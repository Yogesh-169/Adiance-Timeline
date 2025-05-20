import React, { useState, useRef, useEffect, useCallback } from 'react';

interface TimelineProps {
  duration: number;
  currentTime: number;
  bufferEnd: number;
  onSeek: (time: number) => void;
  zoomLevel: number;
  bufferRanges: Array<{start: number; end: number}>;
  onZoomChange: (increment: number) => void;
  isLive?: boolean;
}

/**
 * Timeline Component
 * 
 * Renders an interactive timeline visualization using HTML Canvas.
 * Shows playback position, buffer ranges, and time markers.
 * Supports zoom functionality with mouse wheel and seeking through click/drag.
 */
export const Timeline: React.FC<TimelineProps> = ({ 
  duration, 
  currentTime, 
  bufferEnd, 
  onSeek,
  zoomLevel,
  bufferRanges,
  onZoomChange,
  isLive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visibleTimeRange, setVisibleTimeRange] = useState({ start: 0, end: duration });
  
  // Update visible time range when zoom level changes
  useEffect(() => {
    if (duration <= 0 && !isLive) return;
    
    // For live streams, use a fixed duration if actual duration is not available
    const effectiveDuration = isLive && duration <= 0 ? 300 : duration; // Default to 5 minutes for live
    
    // Calculate visible range based on zoom level
    const visibleDuration = effectiveDuration / zoomLevel;
    
    // Center around current time
    let start = currentTime - (visibleDuration / 2);
    let end = currentTime + (visibleDuration / 2);
    
    // Ensure we don't go out of bounds
    if (start < 0) {
      start = 0;
      end = Math.min(effectiveDuration, visibleDuration);
    }
    
    if (end > effectiveDuration) {
      end = effectiveDuration;
      start = Math.max(0, effectiveDuration - visibleDuration);
    }
    
    // For live streams, always show the most recent content
    if (isLive) {
      end = currentTime + 10; // Show 10 seconds ahead
      start = end - visibleDuration;
    }
    
    setVisibleTimeRange({ start, end });
  }, [zoomLevel, duration, currentTime, isLive]);
  
  // Draw the timeline on the canvas
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // For live streams or very short videos, use a minimum effective duration
    const effectiveDuration = (duration <= 0 || duration < 5) ? 
      (isLive ? 300 : 5) : // Use 5 minutes for live, 5 seconds for short videos
      duration;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    
    // Draw background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    const { start, end } = visibleTimeRange;
    const visibleDuration = end - start;
    
    // Draw time markers
    const timeMarkers = calculateTimeMarkers(start, end, zoomLevel, effectiveDuration);
    drawTimeMarkers(ctx, timeMarkers, canvas.clientWidth, canvas.clientHeight, start, visibleDuration);
    
    // Draw buffer ranges
    drawBufferRanges(ctx, bufferRanges, canvas.clientWidth, canvas.clientHeight, start, visibleDuration);
    
    // Draw different quality levels (simulated for now)
    drawQualityLevels(ctx, canvas.clientWidth, canvas.clientHeight, start, visibleDuration);
    
    // Draw playhead
    if (currentTime >= start && currentTime <= end) {
      const playheadX = ((currentTime - start) / visibleDuration) * canvas.clientWidth;
      ctx.fillStyle = 'red';
      ctx.fillRect(playheadX - 1, 0, 2, canvas.clientHeight);
    }
    
    // Draw live indicator if applicable
    if (isLive) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(canvas.clientWidth - 15, 15, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('LIVE', canvas.clientWidth - 30, 18);
    }
    
  }, [duration, currentTime, bufferEnd, zoomLevel, visibleTimeRange, bufferRanges, isLive]);
  
  // Update canvas when dependencies change
  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);
  
  // Calculate time markers based on zoom level and visible range
  const calculateTimeMarkers = (start: number, end: number, zoomLevel: number, effectiveDuration: number) => {
    const markers = [];
    const visibleDuration = end - start;
    
    // For very short videos or high zoom levels, use smaller step sizes
    let step: number;
    if (effectiveDuration < 10) {
      // For very short videos, show markers every 0.5 seconds
      step = 0.5;
    } else if (zoomLevel <= 1) {
      step = 60; // 1 minute
    } else if (zoomLevel <= 3) {
      step = 30; // 30 seconds
    } else if (zoomLevel <= 5) {
      step = 10; // 10 seconds
    } else if (zoomLevel <= 8) {
      step = 5; // 5 seconds
    } else {
      step = 1; // 1 second
    }
    
    // Find the first marker that's visible
    const firstMarker = Math.floor(start / step) * step;
    
    // Add markers within the visible range
    for (let time = firstMarker; time <= end; time += step) {
      if (time >= start) {
        markers.push({
          time,
          label: formatTime(time)
        });
      }
    }
    
    // Ensure we have at least 2 markers for very short videos
    if (markers.length < 2 && effectiveDuration < 5) {
      markers.length = 0;
      const smallStep = effectiveDuration / 4;
      for (let i = 0; i <= 4; i++) {
        const time = i * smallStep;
        markers.push({
          time,
          label: formatTime(time)
        });
      }
    }
    
    return markers;
  };
  
  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    
    // For very short videos, include deciseconds
    if (duration < 10) {
      return `${s}.${ms}s`;
    }
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // Draw time markers on canvas
  const drawTimeMarkers = (
    ctx: CanvasRenderingContext2D, 
    markers: { time: number; label: string }[], 
    width: number, 
    height: number,
    startTime: number,
    visibleDuration: number
  ) => {
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    markers.forEach(marker => {
      const x = ((marker.time - startTime) / visibleDuration) * width;
      
      // Draw marker line
      ctx.fillRect(x, height - 20, 1, 10);
      
      // Draw marker label
      ctx.fillText(marker.label, x, height - 5);
    });
  };
  
  // Draw buffer ranges
  const drawBufferRanges = (
    ctx: CanvasRenderingContext2D,
    ranges: Array<{start: number; end: number}>,
    width: number,
    height: number,
    startTime: number,
    visibleDuration: number
  ) => {
    ctx.fillStyle = 'rgba(66, 133, 244, 0.3)';
    
    ranges.forEach(range => {
      if (range.end < startTime || range.start > startTime + visibleDuration) return;
      
      const startX = Math.max(0, ((range.start - startTime) / visibleDuration) * width);
      const endX = Math.min(width, ((range.end - startTime) / visibleDuration) * width);
      const rangeWidth = endX - startX;
      
      ctx.fillRect(startX, 0, rangeWidth, height - 20);
    });
  };
  
  // Draw simulated quality levels
  const drawQualityLevels = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    startTime: number,
    visibleDuration: number
  ) => {
    // Simulate different quality levels with different colors
    const levels = [
      { height: 20, color: 'rgba(52, 168, 83, 0.5)', name: '240p' }, // 240p
      { height: 30, color: 'rgba(251, 188, 5, 0.5)', name: '360p' }, // 360p
      { height: 40, color: 'rgba(234, 67, 53, 0.5)', name: '480p' }, // 480p
      { height: 50, color: 'rgba(66, 133, 244, 0.5)', name: '720p' }, // 720p
    ];
    
    // Draw segments to simulate loaded chunks at different qualities
    const segmentDuration = 5; // 5 seconds per segment
    const totalSegments = Math.ceil(visibleDuration / segmentDuration);
    const segmentWidth = width / totalSegments;
    
    for (let i = 0; i < totalSegments; i++) {
      const segmentTime = startTime + (i * segmentDuration);
      
      // Randomly choose which levels to draw for this segment
      // Use a deterministic approach based on segment time to keep it consistent
      const seed = Math.floor(segmentTime / 10);
      const levelsToDraw = (seed % 3) + 2; // 2-4 levels
      
      for (let j = 0; j < levelsToDraw && j < levels.length; j++) {
        const level = levels[j];
        ctx.fillStyle = level.color;
        ctx.fillRect(
          i * segmentWidth, 
          height - 20 - level.height, 
          segmentWidth - 2, 
          level.height
        );
      }
    }
  };
  
  // Handle click on timeline to seek
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = visibleTimeRange;
    const visibleDuration = end - start;
    
    const seekTime = start + (x / canvas.clientWidth) * visibleDuration;
    onSeek(seekTime);
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = () => {
    setIsDragging(true);
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = visibleTimeRange;
    const visibleDuration = end - start;
    
    const seekTime = start + (x / canvas.clientWidth) * visibleDuration;
    onSeek(seekTime);
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle mouse leave to end dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Prevent the default browser zoom behavior
    e.preventDefault();
    
    // Determine zoom direction based on wheel delta
    const zoomIncrement = e.deltaY < 0 ? 1 : -1;
    
    // Call the zoom change handler
    onZoomChange(zoomIncrement);
  };
  
  return (
    <div 
      ref={containerRef} 
      className="timeline-wrapper"
      onWheel={handleWheel}
    >
      <canvas 
        ref={canvasRef} 
        className="timeline-canvas" 
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      <div className="zoom-indicator">
        Zoom: {zoomLevel}x
      </div>
    </div>
  );
};
