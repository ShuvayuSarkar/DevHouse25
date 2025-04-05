/**
 * Geocoding functionality
 */

/**
 * Geocode a location name and zoom to it
 * @param {string} locationName - Name of location to find
 * @returns {string} - Status message
 */
function geocodeAndZoom(locationName) {
    updateCommandDisplay(`Finding location: ${locationName}...`);
    
    // Use OpenStreetMap Nominatim for geocoding
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const location = data[0];
                map.setView([location.lat, location.lon], 12);
                
                // Add a marker
                addMarker(location.lat, location.lon, location.display_name);
                
                return `Showing: ${locationName}`;
            } else {
                return `Couldn't find location: ${locationName}`;
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            return `Error finding location: ${locationName}`;
        });
}

/**
 * Geocode a location but return the coordinates instead of zooming
 * @param {string} locationName - Name of location to find
 * @returns {Promise<Object>} - Location data promise
 */
function geocodeLocation(locationName) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                return {
                    lat: data[0].lat,
                    lon: data[0].lon,
                    name: data[0].display_name
                };
            } else {
                throw new Error(`Location not found: ${locationName}`);
            }
        });
}