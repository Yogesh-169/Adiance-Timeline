import React from 'react';

/**
 * BufferLegend Component
 * 
 * Displays a legend explaining the different buffer types
 * shown in the timeline visualization.
 */
export const BufferLegend: React.FC = () => {
  return (
    <div className="buffer-legend">
      <div className="buffer-item">
        <div className="buffer-color media-buffer"></div>
        <span>Media Buffer</span>
      </div>
      <div className="buffer-item">
        <div className="buffer-color video-buffer"></div>
        <span>Video Buffer</span>
      </div>
      <div className="buffer-item">
        <div className="buffer-color audio-buffer"></div>
        <span>Audio Buffer</span>
      </div>
    </div>
  );
};
