console.log('Background script loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'captureVisibleTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' })
      .then(dataUrl => {
        console.log('Screenshot captured');
        sendResponse(dataUrl);
      })
      .catch(error => {
        console.error('Failed to capture screenshot:', error);
        sendResponse(null);
      });
    return true; // Required for async response
  }
}); 