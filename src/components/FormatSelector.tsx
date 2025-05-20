import React from 'react';
import { VideoFormat } from '../types';

interface FormatSelectorProps {
  currentFormat: VideoFormat;
  onFormatChange: (format: VideoFormat) => void;
  showLiveOptions?: boolean;
}

/**
 * FormatSelector Component
 * 
 * Provides buttons to select different video formats (HLS, MP4, WebM, Live, FLV).
 * Highlights the currently selected format.
 */
export const FormatSelector: React.FC<FormatSelectorProps> = ({
  currentFormat,
  onFormatChange,
  showLiveOptions = false
}) => {
  return (
    <div className="format-selector">
      <h3>Select Video Format:</h3>
      <div className="format-buttons">
        <button 
          className={currentFormat === 'hls' ? 'active' : ''} 
          onClick={() => onFormatChange('hls')}
        >
          HLS
        </button>
        <button 
          className={currentFormat === 'mp4' ? 'active' : ''} 
          onClick={() => onFormatChange('mp4')}
        >
          MP4
        </button>
        <button 
          className={currentFormat === 'webm' ? 'active' : ''} 
          onClick={() => onFormatChange('webm')}
        >
          WebM
        </button>
        {showLiveOptions && (
          <>
            <button 
              className={currentFormat === 'live' ? 'active' : ''} 
              onClick={() => onFormatChange('live')}
            >
              Live Stream (HLS)
            </button>
            <button 
              className={currentFormat === 'flv' ? 'active' : ''} 
              onClick={() => onFormatChange('flv')}
            >
              Live Stream (FLV)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
