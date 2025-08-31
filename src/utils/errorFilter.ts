/**
 * Filter out browser extension errors that don't affect app functionality
 */
export const filterExtensionErrors = () => {
  const originalError = window.console.error;
  
  window.console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Filter out extension-related errors
    if (
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Extension context invalidated') ||
      message.includes('chrome-extension://')
    ) {
      return; // Ignore these errors
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };
};