// Store the active tab ID
let activeTabId = null;

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get the current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tabs[0].id;
  console.log('Popup initialized, active tab ID:', activeTabId);

  // Add event listeners
  document.getElementById('startCapture').addEventListener('click', startScreenshot);
  document.getElementById('cancelCapture').addEventListener('click', cancelScreenshot);
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'screenshotComplete') {
      document.getElementById('startCapture').style.display = 'block';
      document.getElementById('cancelCapture').style.display = 'none';
    }
  });
});

// Start the screenshot process
async function startScreenshot() {
  console.log('Start screenshot clicked');

  // Hide start button, show cancel button
  document.getElementById('startCapture').style.display = 'none';
  document.getElementById('cancelCapture').style.display = 'block';

  try {
    // First inject the CSS
    await chrome.scripting.insertCSS({
      target: { tabId: activeTabId },
      files: ['styles.css']
    });

    // Then inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['content.js']
    });

    // Wait a short moment to ensure the script is initialized
    await new Promise(resolve => setTimeout(resolve, 100));

    // Send message to content script
    await chrome.tabs.sendMessage(activeTabId, {
      type: 'initializeScreenshot'
    });

    // Close the popup
    window.close();
  } catch (error) {
    console.error('Error starting screenshot:', error);
    // Show error to user
    document.getElementById('startCapture').style.display = 'block';
    document.getElementById('cancelCapture').style.display = 'none';
    alert('Failed to start screenshot. Please try again.');
  }
}

// Cancel the screenshot process
async function cancelScreenshot() {
  console.log('Cancel screenshot clicked');
  try {
    await chrome.tabs.sendMessage(activeTabId, { type: 'cancelScreenshot' });
    document.getElementById('startCapture').style.display = 'block';
    document.getElementById('cancelCapture').style.display = 'none';
  } catch (error) {
    console.error('Error canceling screenshot:', error);
  }
} 