/**
 * Command processing functionality
 */

/**
 * Process a voice command
 * @param {string} command - The voice command to process
 * @returns {string|Promise<string>} - Response message or promise resolving to response message
 */
function processCommand(command) {
    // Location commands
    if (command.includes('go to') || command.includes('show me')) {
        const location = extractLocation(command);
        if (location) {
            return geocodeAndZoom(location); // This returns a promise
        }
    }
    
    // Zoom commands
    if (command.includes('zoom in')) {
        map.zoomIn();
        return "Zoomed in";
    }
    
    if (command.includes('zoom out')) {
        map.zoomOut();
        return "Zoomed out";
    }
    
    // Layer commands
    if (command.includes('satellite') || command.includes('satellite view')) {
        return setMapLayer('Satellite');
    }
    
    if ((command.includes('map') && !command.includes('satellite')) || 
        command.includes('street') || 
        command.includes('default view')) {
        return setMapLayer('OpenStreetMap');
    }
    
    if (command.includes('show bhuvan') || command.includes('enable bhuvan')) {
        return toggleOverlay('Bhuvan India', true);
    }
    
    if (command.includes('hide bhuvan') || command.includes('disable bhuvan')) {
        return toggleOverlay('Bhuvan India', false);
    }

    if (command.includes('show land use') || command.includes('enable land use')) {
        return toggleOverlay('Tamil Nadu Land Use', true);
    }

    if (command.includes('hide land use') || command.includes('disable land use')) {
        return toggleOverlay('Tamil Nadu Land Use', false);
    }
    
    // Clear markers
    if (command.includes('clear') && (command.includes('marker') || command.includes('result'))) {
        clearMarkers();
        return "Cleared all markers";
    }
    
    // Compound commands
    if ((command.includes('find') || command.includes('search for')) && 
        (command.includes('near') || command.includes('around') || command.includes('in'))) {
        return handleNearbySearch(command); // This returns a promise
    }
    
    return Promise.resolve(`Sorry, I didn't understand: "${command}"`);
}

/**
 * Extract location from a command
 * @param {string} command - Command containing location
 * @returns {string|null} - Extracted location or null
 */
function extractLocation(command) {
    // Try different patterns
    const goToMatch = command.match(/go to (.*?)( in| near| with| and|$)/i);
    const showMeMatch = command.match(/show me (.*?)( in| near| with| and|$)/i);
    
    if (goToMatch && goToMatch[1]) {
        return goToMatch[1].trim();
    }
    
    if (showMeMatch && showMeMatch[1]) {
        return showMeMatch[1].trim();
    }
    
    // If no specific pattern matches, try to extract location after "go to" or "show me"
    if (command.includes('go to')) {
        return command.substring(command.indexOf('go to') + 5).trim();
    }
    
    if (command.includes('show me')) {
        return command.substring(command.indexOf('show me') + 7).trim();
    }
    
    return null;
}

/**
 * Extract POI type and location from a nearby search command
 * @param {string} command - Command to parse
 * @returns {Object|null} - Extracted information or null
 */
function extractNearbySearchInfo(command) {
    // Try to match pattern: find/show/display [POI] near/around/in [location]
    const pattern = /(find|show|display|search for) (.*?) (near|around|in) (.*?)( with| and|$)/i;
    const match = command.match(pattern);
    
    if (match && match[2] && match[4]) {
        return {
            poiType: match[2].trim(),
            location: match[4].trim()
        };
    }
    
    // Try simpler pattern if the first one fails
    const simplifiedPattern = /(.*?) (near|around|in) (.*)/i;
    const simplifiedMatch = command.match(simplifiedPattern);
    
    if (simplifiedMatch && simplifiedMatch[1] && simplifiedMatch[3]) {
        // Extract the POI type by removing common search terms
        let poiType = simplifiedMatch[1].trim()
            .replace('find', '')
            .replace('show', '')
            .replace('search for', '')
            .replace('display', '')
            .trim();
            
        return {
            poiType: poiType,
            location: simplifiedMatch[3].trim()
        };
    }
    
    return null;
}

/**
 * Handle nearby search command
 * @param {string} command - Command to handle
 * @returns {string} - Response message
 */
function handleNearbySearch(command) {
    const searchInfo = extractNearbySearchInfo(command);
    
    if (!searchInfo) {
        return "I couldn't understand that nearby search command";
    }
    
    return searchPOIs(searchInfo.poiType, searchInfo.location);
}

