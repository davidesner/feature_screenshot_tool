// Initialize screenshot tool
function initializeScreenshotTool() {
  // State management
  let isSelecting = false;
  let isHighlighting = false;
  let startX, startY, endX, endY;
  let highlightStartX, highlightStartY, highlightEndX, highlightEndY;
  let selectionBox = null;
  let highlightBox = null;
  let selectionComplete = false;
  
  // Default config values
  const defaultConfig = {
    requiredWidth: 1290,
    requiredMinWidth: 1281,
    requiredMaxWidth: 1292,
    requiredHeight: 730
  };

  let config = { ...defaultConfig };

  console.log('Content script loaded with initial config:', config);

  // Check viewport size and show guide if needed
  function checkViewportSize() {
    // Ensure config has all required values
    config = {
      ...defaultConfig,
      ...config
    };
    
    // Force a reflow to get accurate dimensions
    document.body.offsetHeight;
    
    const viewportWidth = Math.round(window.innerWidth);
    const viewportHeight = Math.round(window.innerHeight);
    
    console.log('Checking viewport size:', {
      viewportWidth,
      viewportHeight,
      minWidth: config.requiredMinWidth,
      maxWidth: config.requiredMaxWidth,
      requiredHeight: config.requiredHeight
    });
    
    // Check if width is within acceptable range
    const isWidthCorrect = viewportWidth >= config.requiredMinWidth && viewportWidth <= config.requiredMaxWidth;
    console.log('Is width correct?', isWidthCorrect, 'Current width:', viewportWidth);
    
    if (!isWidthCorrect) {
      // Store that we're showing the guide
      window.showingResizeGuide = true;
      
      const message = `Window width must be between ${config.requiredMinWidth}px and ${config.requiredMaxWidth}px.\n\nCurrent width: ${viewportWidth}px\n\nWould you like to use a visual guide to help you resize the window?`;
      if (confirm(message)) {
        createResizeGuide();
      } else {
        alert(`Please adjust the window width manually to between ${config.requiredMinWidth}px and ${config.requiredMaxWidth}px.`);
      }
      return false;
    }

    if (viewportHeight < config.requiredHeight) {
      const message = `Please increase your window height to at least ${config.requiredHeight}px.\n\nCurrent height: ${viewportHeight}px\nRequired height: ${config.requiredHeight}px`;
      alert(message);
      return false;
    }

    // Clear the guide flag since width is correct
    window.showingResizeGuide = false;
    return true;
  }

  // Create resize guide overlay
  function createResizeGuide() {
    // Remove any existing guide elements first
    const existingGuide = document.getElementById('resize-guide');
    if (existingGuide) {
      existingGuide.remove();
    }
    const existingLabels = document.querySelectorAll('[style*="transform: translateX(-50%)"]');
    existingLabels.forEach(label => label.remove());

    const guide = document.createElement('div');
    guide.id = 'resize-guide';
    guide.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: #FFA726;
      z-index: 1000000;
      pointer-events: none;
      transition: background-color 0.3s ease;
    `;

    const label = document.createElement('div');
    label.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 152, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000001;
      text-align: center;
      white-space: nowrap;
      transition: background-color 0.3s ease;
    `;

    const widthDisplay = document.createElement('div');
    widthDisplay.style.cssText = `
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 152, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 20px;
      font-weight: bold;
      z-index: 1000001;
      transition: background-color 0.3s ease;
    `;

    document.body.appendChild(guide);
    document.body.appendChild(label);
    document.body.appendChild(widthDisplay);

    function updateGuide() {
      const currentWidth = window.innerWidth;
      console.log('Current width:', currentWidth);
      console.log('Required range:', config.requiredMinWidth, '-', config.requiredMaxWidth);
      
      const isWidthCorrect = currentWidth >= config.requiredMinWidth && currentWidth <= config.requiredMaxWidth;
      console.log('Is width correct?', isWidthCorrect);
      
      widthDisplay.textContent = `Current width: ${currentWidth}px`;
      
      if (isWidthCorrect) {
        console.log('Width is correct, updating styles to green');
        label.textContent = '✅ Perfect! Click the extension icon again to start';
        guide.style.setProperty('background-color', '#4CAF50', 'important');
        label.style.setProperty('background-color', 'rgba(76, 175, 80, 0.9)', 'important');
        widthDisplay.style.setProperty('background-color', 'rgba(76, 175, 80, 0.9)', 'important');
        return true;
      } else if (currentWidth < config.requiredMinWidth) {
        console.log('Width too small, keeping orange');
        const diff = config.requiredMinWidth - currentWidth;
        label.textContent = `↔️ Drag window edge outward by ${diff}px`;
        guide.style.setProperty('background-color', '#FFA726', 'important');
        label.style.setProperty('background-color', 'rgba(255, 152, 0, 0.9)', 'important');
        widthDisplay.style.setProperty('background-color', 'rgba(255, 152, 0, 0.9)', 'important');
      } else {
        console.log('Width too large, keeping orange');
        const diff = currentWidth - config.requiredMaxWidth;
        label.textContent = `↔️ Drag window edge inward by ${diff}px`;
        guide.style.setProperty('background-color', '#FFA726', 'important');
        label.style.setProperty('background-color', 'rgba(255, 152, 0, 0.9)', 'important');
        widthDisplay.style.setProperty('background-color', 'rgba(255, 152, 0, 0.9)', 'important');
      }
      return false;
    }

    // Initial update
    updateGuide();

    // Update on resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('Window resized, updating guide');
        updateGuide();
      }, 100);
    });

    return {
      guide,
      label,
      widthDisplay,
      updateGuide
    };
  }

  // Initialize selection overlay
  async function createSelectionOverlay() {
    console.log('Creating selection overlay');
    
    // Force a reflow and get accurate dimensions
    document.body.offsetHeight;
    const viewportWidth = Math.round(window.innerWidth);
    const isWidthCorrect = viewportWidth >= config.requiredMinWidth && viewportWidth <= config.requiredMaxWidth;
    
    console.log('Initial width check:', {
      viewportWidth,
      minWidth: config.requiredMinWidth,
      maxWidth: config.requiredMaxWidth,
      isWidthCorrect
    });
    
    if (!isWidthCorrect) {
      const result = await checkViewportSize();
      if (!result) return;
    }
    
    // Clean up any existing overlay and guide
    cleanup();
    
    // Remove any existing guide elements
    const guideElements = document.querySelectorAll('#resize-guide, [style*="transform: translateX(-50%)"]');
    guideElements.forEach(element => element.remove());
    
    const overlay = document.createElement('div');
    overlay.id = 'screenshot-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: none;
      z-index: 999999;
      cursor: crosshair;
    `;

    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'screenshot-instructions';
    instructions.textContent = 'Selection area is fixed at 1280x720px';
    instructions.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      z-index: 1000000;
    `;
    overlay.appendChild(instructions);

    document.body.appendChild(overlay);

    // Add event listeners directly to the overlay
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);

    // Reset state
    isSelecting = false;
    isHighlighting = false;
    selectionComplete = false;
    selectionBox = null;
    highlightBox = null;

    // Create invisible selection box for tracking bounds
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.cssText = `
      position: fixed;
      width: 1280px;
      height: 720px;
      top: 0;
      left: ${Math.max(0, (viewportWidth - 1280) / 2)}px;
      pointer-events: none;
      z-index: 999999;
    `;
    document.body.appendChild(selectionBox);
    
    // Update coordinates for selection area
    startX = parseInt(selectionBox.style.left);
    startY = 0;
    endX = startX + 1280;
    endY = 720;
    selectionComplete = true;

    return overlay;
  }

  // Handle mouse events for selection
  function handleMouseDown(e) {
    console.log('Mouse down event', { isSelecting, isHighlighting, selectionComplete });
    if (e.button !== 0) return; // Left click only
    
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Check if click is inside selection area
    if (clickX >= startX && clickX <= endX && clickY >= startY && clickY <= endY) {
      isHighlighting = true;
      highlightStartX = clickX;
      highlightStartY = clickY;
      highlightBox = document.createElement('div');
      highlightBox.className = 'highlight-box';
      highlightBox.style.cssText = `
        position: fixed;
        border: none;
        background: none;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 1000000;
      `;
      document.body.appendChild(highlightBox);
      const left = Math.min(highlightStartX, highlightStartX);
      const top = Math.min(highlightStartY, highlightStartY);
      highlightBox.style.left = left + 'px';
      highlightBox.style.top = top + 'px';
      highlightBox.style.width = '0px';
      highlightBox.style.height = '0px';
    } else {
      // Click outside selection area - capture screenshot
      setTimeout(captureScreenshot, 100);
    }
  }

  function handleMouseMove(e) {
    if (isHighlighting && highlightBox) {
      highlightEndX = e.clientX;
      highlightEndY = e.clientY;
      
      // Constrain highlight within selection area
      highlightEndX = Math.max(startX, Math.min(endX, highlightEndX));
      highlightEndY = Math.max(startY, Math.min(endY, highlightEndY));
      
      const left = Math.min(highlightStartX, highlightEndX);
      const top = Math.min(highlightStartY, highlightEndY);
      const width = Math.abs(highlightEndX - highlightStartX);
      const height = Math.abs(highlightEndY - highlightStartY);
      
      highlightBox.style.left = left + 'px';
      highlightBox.style.top = top + 'px';
      highlightBox.style.width = width + 'px';
      highlightBox.style.height = height + 'px';
    }
  }

  function handleMouseUp(e) {
    if (isHighlighting) {
      isHighlighting = false;
      setTimeout(captureScreenshot, 100);
    }
  }

  // Capture the screenshot
  async function captureScreenshot() {
    console.log('Capturing screenshot');
    // Calculate the dimensions
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    try {
      // Send message to background script to capture the tab
      const dataUrl = await chrome.runtime.sendMessage({
        type: 'captureVisibleTab'
      });
      
      if (!dataUrl) {
        throw new Error('Failed to capture screenshot');
      }
      
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      // Load the screenshot
      const img = new Image();
      img.onload = () => {
        // Create temporary canvas for the selected area
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the selected area
        tempCtx.drawImage(img, 
          Math.min(startX, endX), Math.min(startY, startY),
          width, height,
          0, 0, width, height
        );
        
        // Scale to 1280x720
        ctx.drawImage(tempCanvas, 0, 0, 1280, 720);
        
        // Add semi-transparent overlay everywhere except the highlighted area
        if (highlightBox) {
          const highlightLeft = Math.min(highlightStartX, highlightEndX) - Math.min(startX, endX);
          const highlightTop = Math.min(highlightStartY, highlightEndY) - Math.min(startY, startY);
          const highlightWidth = Math.abs(highlightEndX - highlightStartX);
          const highlightHeight = Math.abs(highlightEndY - highlightStartY);
          
          // Create semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          
          // Fill top area
          ctx.fillRect(0, 0, 1280, (highlightTop / height) * 720);
          // Fill bottom area
          ctx.fillRect(0, ((highlightTop + highlightHeight) / height) * 720, 1280, 720);
          // Fill left area
          ctx.fillRect(0, (highlightTop / height) * 720, (highlightLeft / width) * 1280, highlightHeight / height * 720);
          // Fill right area
          ctx.fillRect(((highlightLeft + highlightWidth) / width) * 1280, (highlightTop / height) * 720, 1280, highlightHeight / height * 720);
        }
        
        // Download the image
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'feature-screenshot.png';
          a.click();
          URL.revokeObjectURL(url);
          
          // Clean up after successful capture
          cleanup();
        });
      };
      img.src = dataUrl;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      cleanup();
    }
  }

  // Clean up the overlay and selection boxes
  function cleanup() {
    console.log('Cleaning up');
    const overlay = document.getElementById('screenshot-overlay');
    if (overlay) {
      overlay.removeEventListener('mousedown', handleMouseDown);
      overlay.removeEventListener('mousemove', handleMouseMove);
      overlay.removeEventListener('mouseup', handleMouseUp);
      overlay.remove();
    }
    if (selectionBox) selectionBox.remove();
    if (highlightBox) highlightBox.remove();
    
    // Reset state
    isSelecting = false;
    isHighlighting = false;
    selectionComplete = false;
    selectionBox = null;
    highlightBox = null;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    if (message.type === 'initializeScreenshot') {
      // Merge received config with defaults
      config = {
        ...defaultConfig,
        ...(message.config || {})
      };
      console.log('Updated config:', config);
      createSelectionOverlay();
    } else if (message.type === 'cancelScreenshot') {
      cleanup();
    }
  });
}

// Prevent multiple initializations
if (!window.screenshotToolInitialized) {
  window.screenshotToolInitialized = true;
  initializeScreenshotTool();
} 