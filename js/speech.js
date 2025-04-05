/**
 * Speech recognition functionality
 */

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

// DOM elements
let micButton;
let micIcon;
let commandDisplay;

// Initialize speech recognition when DOM is loaded
document.addEventListener('DOMContentLoaded', initSpeechRecognition);

function initSpeechRecognition() {
    console.log("Initializing speech recognition...");
    // Get DOM elements
    micButton = document.getElementById('mic-button');
    micIcon = document.getElementById('mic-icon');
    commandDisplay = document.getElementById('command-display');
    
    // Check for browser support
    if (!SpeechRecognition) {
        commandDisplay.textContent = "Speech recognition not supported in this browser";
        micButton.disabled = true;
        micButton.style.backgroundColor = "#ccc";
        return;
    }
    
    // Set up recognition
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Set up event listeners
    micButton.addEventListener('click', toggleListening);
    
    // Set up recognition events
    recognition.onstart = handleRecognitionStart;
    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onend = handleRecognitionEnd;
    
    console.log("Speech recognition initialized");
}

/**
 * Toggle speech recognition on/off
 */
function toggleListening() {
    if (!isListening) {
        startListening();
    } else {
        stopListening();
    }
}

/**
 * Start listening for voice commands
 */
function startListening() {
    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition error:", e);
        handleRecognitionError({ error: "start_error" });
    }
}

/**
 * Stop listening for voice commands
 */
function stopListening() {
    try {
        recognition.stop();
    } catch (e) {
        console.error("Stop error:", e);
    }
}

/**
 * Handle recognition start event
 */
function handleRecognitionStart() {
    isListening = true;
    micButton.classList.add('listening');
    commandDisplay.textContent = "Listening...";
}

/**
 * Save command with response and refresh history
 * @param {string} command - The voice command
 * @param {boolean} processed - Whether processing was successful
 * @param {string} response - The response message
 */
function logCommandAndRefresh(command, processed, response) {
    console.log(`Saving command: "${command}" with response: "${response}"`);
    
    // Check if saveVoiceCommand exists
    if (typeof saveVoiceCommand !== 'function') {
        console.error("saveVoiceCommand function not available");
        return;
    }
    
    // Save to database
    saveVoiceCommand(command, processed, response)
        .then(success => {
            console.log("Command saved:", success);
            
            // Trigger history refresh
            if (typeof refreshCommandHistory === 'function') {
                console.log("Refreshing command history...");
                setTimeout(refreshCommandHistory, 100);
            } else {
                console.error("refreshCommandHistory function not available");
            }
        })
        .catch(err => {
            console.error("Error saving command:", err);
        });
}

/**
 * Handle recognition result event
 * @param {SpeechRecognitionEvent} event - Recognition result
 */
function handleRecognitionResult(event) {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Command recognized:", command);
    commandDisplay.textContent = `Command: ${command}`;
    
    try {
        // Process the command
        const response = processCommand(command);
        
        // Handle different response types
        if (typeof response === 'string') {
            // For immediate responses
            console.log("String response:", response);
            logCommandAndRefresh(command, true, response);
            
            // Update display with response
            setTimeout(() => {
                commandDisplay.textContent = response;
            }, 1000);
        } else if (response instanceof Promise) {
            // For promise-based responses (like geocoding)
            console.log("Promise response received");
            commandDisplay.textContent = "Processing...";
            
            response.then(result => {
                console.log("Promise resolved:", result);
                logCommandAndRefresh(command, true, result);
                commandDisplay.textContent = result;
            }).catch(error => {
                console.error("Promise rejected:", error);
                const errorMsg = error.message || "Command failed";
                logCommandAndRefresh(command, false, errorMsg);
                commandDisplay.textContent = errorMsg;
            });
        } else {
            console.warn("Unknown response type:", typeof response);
            logCommandAndRefresh(command, false, "Unknown response type");
            commandDisplay.textContent = "Command processing error";
        }
    } catch (error) {
        console.error("Error processing command:", error);
        logCommandAndRefresh(command, false, error.message || "Error processing command");
        commandDisplay.textContent = "Error processing command";
    }
}

/**
 * Handle recognition error event
 * @param {SpeechRecognitionEvent} event - Recognition error
 */
function handleRecognitionError(event) {
    let message;
    
    switch(event.error) {
        case 'no-speech':
            message = "No speech detected";
            break;
        case 'aborted':
            message = "Recognition canceled";
            break;
        case 'audio-capture':
            message = "No microphone detected";
            break;
        case 'not-allowed':
            message = "Microphone access denied";
            break;
        case 'network':
            message = "Network error occurred";
            break;
        case 'service-not-allowed':
            message = "Service not allowed";
            break;
        default:
            message = `Error: ${event.error}`;
    }
    
    commandDisplay.textContent = message;
    micButton.classList.remove('listening');
    isListening = false;
}

/**
 * Handle recognition end event
 */
function handleRecognitionEnd() {
    isListening = false;
    micButton.classList.remove('listening');
}

/**
 * Update the command display with a message
 * @param {string} message - Message to display
 */
function updateCommandDisplay(message) {
    if (commandDisplay) {
        commandDisplay.textContent = message;
    }
}