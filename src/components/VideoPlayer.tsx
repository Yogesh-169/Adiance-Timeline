import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';
import flvjs from 'flv.js';
import { VideoFormat } from '../types';

interface VideoPlayerProps {
  format: VideoFormat;
  videoUrl: string;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onBufferUpdate: (ranges: Array<{start: number; end: number}>) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onVideoRef: (ref: HTMLVideoElement | null) => void;
  isLive?: boolean;
}

/**
 * VideoPlayer Component
 * 
 * Handles video playback for different formats (HLS, MP4, WebM, FLV).
 * Uses hls.js for HLS format support and flv.js for FLV format support.
 * Provides callbacks for time updates, buffer changes, and play state changes.
 * Supports live streams including Monibuca server streams in both HLS and FLV formats.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  format,
  videoUrl,
  onTimeUpdate,
  onDurationChange,
  onBufferUpdate,
  onPlayStateChange,
  onVideoRef,
  isLive = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const flvPlayerRef = useRef<flvjs.Player | null>(null);
  
  // Initialize video player based on format
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Clean up previous media players if they exist
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    if (flvPlayerRef.current) {
      flvPlayerRef.current.unload();
      flvPlayerRef.current.detachMediaElement();
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
    
    // Set up video based on format
    if (format === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          // Configuration for better live stream support
          liveDurationInfinity: isLive,
          enableWorker: true,
          lowLatencyMode: isLive,
          backBufferLength: 90
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.error('Error playing video:', e));
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, cannot recover');
                hls.destroy();
                break;
            }
          }
        });
        
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = videoUrl;
      }
    } else if (format === 'flv') {
      if (flvjs.isSupported()) {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: videoUrl,
          isLive: isLive,
          hasAudio: true,
          hasVideo: true,
          cors: true,
          withCredentials: false,
        }, {
          enableStashBuffer: false,
          stashInitialSize: 128,
          enableWorker: true,
          lazyLoad: false,
          seekType: 'range',
        });
        
        flvPlayer.attachMediaElement(video);
        flvPlayer.load();
        
        flvPlayer.on(flvjs.Events.ERROR, (type, detail) => {
          console.error('FLV.js error:', type, detail);
          // Try to recover from errors
          if (flvPlayer && video) {
            flvPlayer.unload();
            flvPlayer.load();
            video.play().catch(e => console.error('Error playing video after recovery:', e));
          }
        });
        
        flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
          console.log('FLV loading complete');
        });
        
        flvPlayer.on(flvjs.Events.RECOVERED_EARLY_EOF, () => {
          console.log('FLV recovered from early EOF');
        });
        
        flvPlayerRef.current = flvPlayer;
        
        // Start playing
        video.play().catch(e => console.error('Error playing FLV video:', e));
      } else {
        console.error('FLV.js is not supported in this browser');
        // Fallback to showing an error message
        video.innerHTML = 'FLV format is not supported in this browser';
      }
    } else {
      // MP4 or WebM
      video.src = videoUrl;
    }
    
    // For live streams, set additional attributes
    if (isLive) {
      video.autoplay = true;
      video.playsInline = true;
      
      // Try to get to the live edge
      if ((format !== 'hls' || !Hls.isSupported()) && format !== 'flv') {
        video.addEventListener('loadedmetadata', () => {
          if (video.duration && isFinite(video.duration)) {
            video.currentTime = video.duration;
          }
        });
      }
    }
    
    // Pass video ref to parent
    onVideoRef(video);
    
    // Clean up on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      if (flvPlayerRef.current) {
        flvPlayerRef.current.unload();
        flvPlayerRef.current.detachMediaElement();
        flvPlayerRef.current.destroy();
      }
    };
  }, [format, videoUrl, onVideoRef, isLive]);
  
  // Set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };
    
    const handleDurationChange = () => {
      // For live streams, we might not get a valid duration
      if (isLive && (!video.duration || !isFinite(video.duration))) {
        // Use a placeholder duration for the timeline
        onDurationChange(0); // The timeline component will handle this special case
      } else {
        onDurationChange(video.duration);
      }
    };
    
    const handleBufferUpdate = () => {
      const ranges: Array<{start: number; end: number}> = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i)
        });
      }
      onBufferUpdate(ranges);
    };
    
    const handlePlayState = () => {
      onPlayStateChange(!video.paused);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('progress', handleBufferUpdate);
    video.addEventListener('seeking', handleBufferUpdate);
    video.addEventListener('seeked', handleBufferUpdate);
    video.addEventListener('play', handlePlayState);
    video.addEventListener('pause', handlePlayState);
    video.addEventListener('loadedmetadata', handleDurationChange);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('progress', handleBufferUpdate);
      video.removeEventListener('seeking', handleBufferUpdate);
      video.removeEventListener('seeked', handleBufferUpdate);
      video.removeEventListener('play', handlePlayState);
      video.removeEventListener('pause', handlePlayState);
      video.removeEventListener('loadedmetadata', handleDurationChange);
    };
  }, [onTimeUpdate, onDurationChange, onBufferUpdate, onPlayStateChange, isLive]);
  
  return (
    <video
      ref={videoRef}
      className="video-player"
      controls
      playsInline
    />
  );
};
