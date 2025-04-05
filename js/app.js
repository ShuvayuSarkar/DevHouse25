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
    
    if (typeof initDatabase !== 'function') {
        console.error('Database module not loaded');
        return;
    }
    
    if (typeof initCommandHistory !== 'function') {
        console.error('Command history module not loaded');
        return;
    }
    
    // Display initial loading message
    const commandDisplay = document.getElementById('command-display');
    if (commandDisplay) {
        commandDisplay.textContent = 'Application loading...';
    }
    
    // Set correct initialization order
    console.log('Initializing components in sequence...');
    
    // Initialize database first
    initDatabase()
        .then(() => {
            console.log('Database initialized, initializing map...');
            // Initialize map after database
            if (typeof initMap === 'function') {
                try {
                    initMap();
                    console.log('Map initialized');
                } catch (error) {
                    console.error('Error initializing map:', error);
                }
            }
            
            // Initialize command history after map
            if (typeof initCommandHistory === 'function') {
                try {
                    initCommandHistory();
                    console.log('Command history initialized');
                } catch (error) {
                    console.error('Error initializing command history:', error);
                }
            }
            
            // Initialize speech recognition last
            if (typeof initSpeechRecognition === 'function') {
                try {
                    initSpeechRecognition();
                    console.log('Speech recognition initialized');
                } catch (error) {
                    console.error('Error initializing speech recognition:', error);
                }
            }
            
            // Debug component availability
            setTimeout(() => {
                console.log("Component availability check:");
                console.log("- initMap available:", typeof initMap === 'function');
                console.log("- initSpeechRecognition available:", typeof initSpeechRecognition === 'function');
                console.log("- initDatabase available:", typeof initDatabase === 'function'); 
                console.log("- initCommandHistory available:", typeof initCommandHistory === 'function');
                console.log("- saveVoiceCommand available:", typeof saveVoiceCommand === 'function');
                console.log("- refreshCommandHistory available:", typeof refreshCommandHistory === 'function');
                console.log("- db initialized:", window.dbInitialized);
            }, 500);
            
            // Set initialization flag
            app.initialized = true;
            
            // Add application event listeners
            window.addEventListener('resize', handleResize);
            
            // Update status message
            setTimeout(() => {
                if (commandDisplay) {
                    commandDisplay.textContent = 'Ready! Click microphone to speak';
                }
            }, 1000);
            
            console.log('Voice GIS Application Initialized');
        })
        .catch(err => {
            console.error('Failed to initialize database:', err);
            if (commandDisplay) {
                commandDisplay.textContent = 'Error initializing application';
            }
        });
}

/**
 * Handle window resize events
 */
function handleResize() {
    // Invalidate map size when window resizes
    if (window.map) {
        window.map.invalidateSize();
    }
}

// Add a debug function to test database functionality directly
window.testDatabaseSave = function() {
    if (typeof saveVoiceCommand === 'function') {
        saveVoiceCommand('test command', true, 'test response')
            .then(() => {
                console.log('Test command saved successfully');
                if (typeof refreshCommandHistory === 'function') {
                    refreshCommandHistory();
                }
            })
            .catch(err => {
                console.error('Error saving test command:', err);
            });
    } else {
        console.error('saveVoiceCommand function not available');
    }
};

// Add a debug function to test database export directly
window.testDatabaseExport = function() {
    if (typeof exportDatabase === 'function') {
        const blob = exportDatabase();
        if (blob) {
            console.log('Database exported successfully, size:', blob.size);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'test_export.sqlite';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } else {
            console.error('Export returned no data');
        }
    } else {
        console.error('exportDatabase function not available');
    }
};