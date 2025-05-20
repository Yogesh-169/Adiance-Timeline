import React from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { PlaybackControls } from './components/PlaybackControls';
import { FormatSelector } from './components/FormatSelector';
import { BufferLegend } from './components/BufferLegend';
import { VideoFormat } from './types';

// Sample video URLs for different formats
const SAMPLE_VIDEOS = {
  hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  mp4: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  webm: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.720p.webm',
  // Example Monibuca live stream URLs (replace with actual URLs when available)
  live: 'https://example.com/live/stream.m3u8',
  flv: 'https://media.arcisai.io/hdl/DVR/RTSP-VSPL-116065-DHJYL.flv'
};

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [bufferRanges, setBufferRanges] = React.useState<Array<{start: number; end: number}>>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [videoFormat, setVideoFormat] = React.useState<VideoFormat>('hls');
  const [videoRef, setVideoRef] = React.useState<HTMLVideoElement | null>(null);
  const [isLive, setIsLive] = React.useState(false);
  
  // Handle seek
  const handleSeek = (time: number) => {
    if (videoRef) {
      videoRef.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  // Handle zoom in/out
  const handleZoomChange = (increment: number) => {
    setZoomLevel(prev => Math.max(1, Math.min(10, prev + increment)));
  };
  
  // Handle format change
  const handleFormatChange = (format: VideoFormat) => {
    setVideoFormat(format);
    // Set live flag if format is 'live' or 'flv'
    setIsLive(format === 'live' || format === 'flv');
    // Reset state when changing format
    setCurrentTime(0);
    setDuration(0);
    setBufferRanges([]);
    setIsPlaying(false);
  };
  
  // Handle play/pause
  const togglePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play().catch(e => console.error('Error playing video:', e));
      }
    }
  };
  
  // Get the correct video URL based on format
  const getVideoUrl = () => {
    return SAMPLE_VIDEOS[videoFormat];
  };
  
  // Get the correct format for the player
  const getPlayerFormat = () => {
    // For live streams, we need to specify the actual format (hls or flv)
    if (videoFormat === 'live') {
      return 'hls';
    }
    return videoFormat;
  };
  
  return (
    <div className="app-container">
      <h1>Video Timeline Player</h1>
      
      <FormatSelector 
        currentFormat={videoFormat} 
        onFormatChange={handleFormatChange}
        showLiveOptions={true}
      />
      
      <div className="video-container">
        <VideoPlayer
          format={getPlayerFormat()}
          videoUrl={getVideoUrl()}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onBufferUpdate={setBufferRanges}
          onPlayStateChange={setIsPlaying}
          onVideoRef={setVideoRef}
          isLive={isLive}
        />
      </div>
      
      <div className="timeline-container">
        <Timeline
          duration={duration}
          currentTime={currentTime}
          bufferEnd={bufferRanges.length > 0 ? bufferRanges[bufferRanges.length - 1].end : 0}
          onSeek={handleSeek}
          zoomLevel={zoomLevel}
          bufferRanges={bufferRanges}
          onZoomChange={handleZoomChange}
          isLive={isLive}
        />
        
        <div className="timeline-controls">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlay}
            onSeekBackward={() => handleSeek(Math.max(0, currentTime - 10))}
            onSeekForward={() => handleSeek(Math.min(duration, currentTime + 10))}
            isLive={isLive}
          />
        </div>
        
        <BufferLegend />
      </div>
    </div>
  );
};

export default App;
