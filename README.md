# Changelog Screenshot Tool

A Chrome extension for capturing screenshots with fixed dimensions (1280x720px) and matching the required stile with highlight of the feature for changelog post images.

## Features

- Captures screenshots with exact dimensions (1280x720px)
- Visual guide for window resizing
- Automatic window size validation
- Simple and intuitive interface
- Supports highlighting areas within the screenshot

## Installation

1. Clone this repository or download the source code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files

## Usage

1. Click the extension icon in your Chrome toolbar
2. If your window width is not between 1281px and 1292px:
   - A visual guide will appear at the top of the window
   - Resize your window until the guide turns green
   - The guide will show your current window width
3. Once the window width is correct:
   - A fixed 1280x720px selection area will appear
   - Click and drag within the selection area to highlight specific parts
   - Click outside the selection area to capture the screenshot
4. The screenshot will be automatically downloaded as 'feature-screenshot.png'

## Requirements

- Chrome browser
- Window width: 1281px - 1292px
- Window height: minimum 730px

## File Structure

```
changelog_screenshotter/
├── manifest.json      # Extension configuration
├── popup.html        # Extension popup interface
├── popup.js         # Popup functionality
├── content.js       # Screenshot capture logic
├── background.js    # Background script for screenshot processing
└── styles.css       # Extension styles
```

## Troubleshooting

If the extension is not working:

1. Make sure your window width is between 1281px and 1292px
2. Check that your window height is at least 730px
3. Try removing and re-adding the extension
4. Check the browser console for any error messages

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

This project is proprietary and confidential. 