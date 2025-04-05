/**
 * Main application initialization
 */

// Global application state
const app = {
    initialized: false
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Prevent double initialization
    if (app.initialized) return;
    
    console.log('Voice GIS Application Initializing...');
    
    // Check if other components are available
    if (typeof initMap !== 'function') {
        console.error('Map module not loaded');
        return;
    }
    
    if (typeof initSpeechRecognition !== 'function') {
        console.error('Speech recognition module not loaded');
        return;
    }
    
    // Display initial loading message
    const commandDisplay = document.getElementById('command-display');
    if (commandDisplay) {
        commandDisplay.textContent = 'Application loading...';
    }
    
    // Add application event listeners
    window.addEventListener('resize', handleResize);
    
    // Set initialization flag
    app.initialized = true;
    
    // Update status message
    setTimeout(() => {
        if (commandDisplay) {
            commandDisplay.textContent = 'Ready! Click microphone to speak';
        }
    }, 1000);
    
    console.log('Voice GIS Application Initialized');
}

/**
 * Handle window resize events
 */
function handleResize() {
    // Invalidate map size when window resizes
    if (map) {
        map.invalidateSize();
    }
}