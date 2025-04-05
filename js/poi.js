/**
 * Points of Interest search functionality
 */

/**
 * Search for POIs near a location
 * @param {string} poiType - Type of POI to search for
 * @param {string} location - Location name to search near
 * @returns {string} - Status message
 */
function searchPOIs(poiType, location) {
    updateCommandDisplay(`Searching for ${poiType} near ${location}...`);
    
    // First geocode the location
    return geocodeLocation(location)
        .then(locationData => {
            // Zoom to the location
            map.setView([locationData.lat, locationData.lon], 14);
            
            // Now search for POIs
            return searchNearbyPOIs(poiType, locationData.lat, locationData.lon, location);
        })
        .catch(error => {
            console.error('POI search error:', error);
            return `Error finding ${location}`;
        });
}

/**
 * Search for nearby POIs using Overpass API
 * @param {string} poiType - Type of POI to search for
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} locationName - Name of the location (for display)
 * @returns {Promise<string>} - Status message promise
 */
function searchNearbyPOIs(poiType, lat, lon, locationName) {
    // Clear existing markers
    clearMarkers();
    
    // Map common spoken terms to OSM tags
    const osmTags = {
        'hospitals': 'amenity=hospital',
        'hospital': 'amenity=hospital',
        'restaurants': 'amenity=restaurant',
        'restaurant': 'amenity=restaurant',
        'hotels': 'tourism=hotel',
        'hotel': 'tourism=hotel',
        'schools': 'amenity=school',
        'school': 'amenity=school',
        'parks': 'leisure=park',
        'park': 'leisure=park',
        'atms': 'amenity=atm',
        'atm': 'amenity=atm',
        'banks': 'amenity=bank',
        'bank': 'amenity=bank',
        'pharmacies': 'amenity=pharmacy',
        'pharmacy': 'amenity=pharmacy',
        'supermarkets': 'shop=supermarket',
        'supermarket': 'shop=supermarket',
        'police': 'amenity=police',
        'police station': 'amenity=police',
        'gas stations': 'amenity=fuel',
        'gas station': 'amenity=fuel',
        'petrol pumps': 'amenity=fuel',
        'petrol pump': 'amenity=fuel'
    };
    
    // Default to searching as a keyword if not in our mapping
    const searchTag = osmTags[poiType.toLowerCase()] || `name~"${poiType}"`;
    
    // Use Overpass API
    const overpassQuery = `
        [out:json];
        node[${searchTag}](around:5000,${lat},${lon});
        out body;
    `;
    
    return fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.elements && data.elements.length > 0) {
            // Add markers
            data.elements.forEach(element => {
                addMarker(
                    element.lat, 
                    element.lon, 
                    element.tags.name || poiType
                );
            });
            
            return `Found ${data.elements.length} ${poiType} near ${locationName}`;
        } else {
            return `No ${poiType} found near ${locationName}`;
        }
    })
    .catch(error => {
        console.error('POI search error:', error);
        return `Error searching for ${poiType}`;
    });
}