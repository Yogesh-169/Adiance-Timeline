# Updated Component Documentation

## App Component
`App.tsx` is the main container component that orchestrates the entire application. It:

- Manages the global state (current time, duration, buffer ranges, etc.)
- Coordinates communication between the video player and timeline
- Handles format selection and playback controls
- Supports live streaming mode for both HLS and FLV formats
- Renders all child components with appropriate props

### Key State Variables:
- `currentTime`: Tracks the current playback position in seconds
- `duration`: Stores the total video duration in seconds
- `bufferRanges`: Array of objects representing buffered video segments
- `isPlaying`: Boolean indicating if video is currently playing
- `zoomLevel`: Number (1-10) controlling timeline zoom level
- `videoFormat`: Current video format ('hls', 'mp4', 'webm', 'live', 'flv')
- `videoRef`: Reference to the HTML video element
- `isLive`: Boolean indicating if the current stream is a live stream

### Key Functions:
- `handleSeek`: Updates video position when timeline is clicked
- `handleZoomChange`: Adjusts timeline zoom level based on mouse wheel input
- `handleFormatChange`: Switches between video formats and sets live mode
- `togglePlay`: Controls video playback
- `getVideoUrl`: Returns the appropriate URL based on selected format
- `getPlayerFormat`: Returns the correct format for the player (handles 'live' format)

## Timeline Component
`Timeline.tsx` is responsible for rendering the interactive timeline visualization using HTML Canvas. It:

- Draws the timeline with time markers, buffer indicators, and playhead
- Handles user interactions (click, drag) for seeking
- Supports mouse wheel zoom functionality without affecting browser zoom
- Adjusts visible time range based on zoom level
- Visualizes buffer ranges and quality levels
- Supports very short videos with appropriate time markers
- Provides special handling for live streams

### Props:
- `duration`: Total video duration in seconds
- `currentTime`: Current playback position in seconds
- `bufferEnd`: End time of the last buffered segment
- `onSeek`: Callback function when user seeks to a new position
- `zoomLevel`: Current zoom level (1-10)
- `bufferRanges`: Array of buffered video segments
- `onZoomChange`: Callback function when user zooms with mouse wheel
- `isLive`: Boolean indicating if the current stream is a live stream

### Key Functions:
- `drawTimeline`: Main function that renders the timeline on canvas
- `calculateTimeMarkers`: Determines time markers based on zoom level and video duration
- `drawBufferRanges`: Visualizes buffer ranges on the canvas
- `drawQualityLevels`: Simulates quality level visualization
- `handleClick`, `handleMouseDown`, etc.: Handle user interactions
- `handleWheel`: Handles mouse wheel events for zooming in/out with preventDefault to avoid browser zoom

### Mouse Wheel Zoom Functionality:
The zoom feature now works by:
1. Detecting mouse wheel events on the timeline container
2. Preventing default browser behavior with `e.preventDefault()`
3. Determining zoom direction based on wheel delta (up = zoom in, down = zoom out)
4. Calling the onZoomChange callback with appropriate increment
5. Displaying a zoom level indicator in the top-right corner of the timeline
6. Adjusting time marker granularity based on zoom level (from minutes to seconds)
7. Redrawing the timeline with the new visible range and markers

### Short Video Support:
For videos with very short durations:
1. Uses smaller time increments for marker display (down to 0.5 seconds)
2. Shows time in seconds.deciseconds format (e.g., "1.5s") for very short videos
3. Ensures at least 4-5 time markers are visible even for videos under 5 seconds
4. Uses a minimum effective duration to prevent display issues

### Live Stream Support:
For live streams:
1. Shows a "LIVE" indicator in the top-right corner
2. Uses a sliding window approach to show recent content
3. Handles the case where duration is not available or infinite
4. Adjusts time markers to show relative time from current position

## VideoPlayer Component
`VideoPlayer.tsx` handles video playback for different formats. It:

- Initializes the appropriate video player based on format
- Uses hls.js for HLS format support
- Uses flv.js for FLV format support
- Provides callbacks for time updates, buffer changes, etc.
- Handles errors and recovery for video playback
- Supports live streams including Monibuca server streams in both HLS and FLV formats

### Props:
- `format`: Current video format ('hls', 'mp4', 'webm', 'flv')
- `videoUrl`: URL of the video to play
- `onTimeUpdate`: Callback when video time updates
- `onDurationChange`: Callback when video duration is available
- `onBufferUpdate`: Callback when buffer ranges change
- `onPlayStateChange`: Callback when play state changes
- `onVideoRef`: Callback to provide video element reference
- `isLive`: Boolean indicating if the current stream is a live stream

### Key Features:
- Format-specific initialization (HLS using hls.js, FLV using flv.js)
- Event listeners for video events (timeupdate, progress, etc.)
- Error handling and recovery for HLS and FLV playback
- Cleanup of resources when component unmounts
- Special handling for live streams

### HLS.js Integration:
For HLS format support:
1. The code checks if HLS.js is supported by the browser
2. If supported, it creates a new HLS instance and attaches it to the video element
3. It sets up event handlers for manifest parsing and error handling
4. For browsers with native HLS support (like Safari), it falls back to native playback

### FLV.js Integration:
For FLV format support:
1. The code checks if FLV.js is supported by the browser
2. If supported, it creates a new FLV player with appropriate configuration
3. It attaches the player to the video element and loads the stream
4. It sets up event handlers for errors and recovery
5. For browsers without FLV.js support, it shows an error message

### Live Stream Support:
For live streams:
1. Configures HLS.js with live-specific options:
   - `liveDurationInfinity: true`
   - `lowLatencyMode: true`
   - `backBufferLength: 90`
2. Configures FLV.js with live-specific options:
   - `isLive: true`
   - `enableStashBuffer: false`
   - `lazyLoad: false`
3. Sets video element to autoplay and playsInline
4. Attempts to seek to the live edge when metadata is loaded
5. Handles special cases where duration is not available or infinite

## PlaybackControls Component
`PlaybackControls.tsx` provides user interface controls for video playback. It:

- Renders play/pause button
- Provides buttons to seek backward/forward (except in live mode)
- Displays current time and duration or a LIVE indicator

### Props:
- `isPlaying`: Boolean indicating if video is currently playing
- `currentTime`: Current playback position in seconds
- `duration`: Total video duration in seconds
- `onTogglePlay`: Callback when play/pause button is clicked
- `onSeekBackward`: Callback when backward seek button is clicked
- `onSeekForward`: Callback when forward seek button is clicked
- `isLive`: Boolean indicating if the current stream is a live stream

### Live Mode Features:
- Hides seek buttons in live mode
- Shows an animated "LIVE" indicator instead of time display
- Maintains play/pause functionality

## FormatSelector Component
`FormatSelector.tsx` allows users to select different video formats. It:

- Renders buttons for each supported format (HLS, MP4, WebM)
- Optionally shows Live Stream (HLS) and Live Stream (FLV) buttons
- Highlights the currently selected format
- Triggers format change when a button is clicked

### Props:
- `currentFormat`: Currently selected video format
- `onFormatChange`: Callback when a format button is clicked
- `showLiveOptions`: Boolean to control whether to show the Live Stream options

## BufferLegend Component
`BufferLegend.tsx` displays a legend explaining the different buffer types shown in the timeline. It:

- Renders color indicators for different buffer types
- Provides labels for each buffer type

## Utils and Types
- `utils.ts`: Contains utility functions like `formatTime` for formatting seconds into readable time strings
- `types.ts`: Contains TypeScript type definitions used throughout the application, including the VideoFormat type which now includes 'live' and 'flv'

## Data Flow
1. The App component initializes with default state values
2. When a video format is selected via FormatSelector, the VideoPlayer component loads the appropriate video
3. If "Live Stream (HLS)" or "Live Stream (FLV)" is selected, the isLive flag is set to true and special handling is activated
4. The VideoPlayer component sends updates to the App component (time, duration, buffer)
5. The App component passes these values to the Timeline component for visualization
6. When the user interacts with the Timeline (click, drag, mouse wheel), it sends commands back to the App
7. The App component updates the video position or zoom level accordingly
8. For very short videos, the Timeline component ensures appropriate time markers are displayed
9. For live streams, the Timeline and PlaybackControls components adjust their UI accordingly

## Using FLV Live Streams
To use FLV live streams from Monibuca server:

1. Update the FLV stream URL in the `SAMPLE_VIDEOS` object:
```javascript
const SAMPLE_VIDEOS = {
  // ...other formats
  flv: 'https://your-monibuca-server.com/live/stream.flv'
};
```

2. Select "Live Stream (FLV)" from the format selector
3. The player will use flv.js to play the stream with appropriate timeline visualization

This modular architecture makes the code more maintainable, testable, and easier to understand. Each component has a single responsibility and clear interfaces for communication with other parts of the application.
