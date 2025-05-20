import React from 'react';
import { formatTime } from '../utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  isLive?: boolean;
}

/**
 * PlaybackControls Component
 * 
 * Provides controls for video playback including play/pause,
 * seek forward/backward, and displays current time and duration.
 * Supports live stream playback with appropriate UI adjustments.
 */
export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  isLive = false
}) => {
  return (
    <div className="playback-controls">
      <button onClick={onTogglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      {!isLive && (
        <>
          <button onClick={onSeekBackward}>
            -10s
          </button>
          <button onClick={onSeekForward}>
            +10s
          </button>
        </>
      )}
      
      <div className="time-display">
        {isLive ? (
          <span className="live-indicator">LIVE</span>
        ) : (
          `${formatTime(currentTime)} / ${formatTime(duration)}`
        )}
      </div>
    </div>
  );
};
