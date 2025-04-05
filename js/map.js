/**
 * Map initialization and control functions
 */

// Map variables
let map;
const baseLayers = {};
const overlays = {};
let markersLayer;

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initMap);

function initMap() {
    // Create map instance
    map = L.map('map-container').setView([20.5937, 78.9629], 5); // Center on India
    
    // Create marker layer for POIs
    markersLayer = L.layerGroup().addTo(map);
    
    // Set up base layers
    baseLayers["OpenStreetMap"] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    baseLayers["Satellite"] = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
    });
    
    // Set up overlay layers
    overlays["Bhuvan India"] = L.tileLayer.wms('https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms', {
        layers: 'india3',
        format: 'image/png',
        transparent: true,
        attribution: 'Bhuvan'
    });
    
    overlays["SISDP Phase 2 LULC 10K"] = L.tileLayer.wms('https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', {
        layers: 'sisdp_phase2:SISDP_P2_LULC_10K_2016_2019_TN',  // The layer you want to display
        format: 'image/png',                                    // Image format
        transparent: true,                                      // Transparent background
        version: '1.1.1',                                       // WMS version
        crs: L.CRS.EPSG4326,                                    // Coordinate Reference System
        bounds: [[8.075, 76.234], [13.565, 80.349]],            // Define the bounding box (extent for Tamil Nadu)
        attribution: 'Bhuvan'                                   // Optional: Add attribution for the data source
    });

    overlays["Tamil Nadu Land Use"] = L.tileLayer.wms('https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', {
        layers: 'lulc:TN_LULC50K_1516',  // The layer you want to display
        format: 'image/png',              // Image format
        transparent: true,                // Transparent background for overlay
        version: '1.1.1',                 // WMS version
        crs: L.CRS.EPSG4326,              // Coordinate Reference System
        bounds: [[8.075, 76.234], [13.565, 80.349]],  // Define the bounding box (extent for Tamil Nadu)
        attribution: 'Bhuvan'             // Optional: Add attribution for the data source
    });

    overlays["Tamil Nadu Land Degradation"] = L.tileLayer.wms('https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', {
        layers: 'ld:TN_LD50K_1516',  // The layer you want to display (layer name)
        format: 'image/png',          // Image format for tiles
        transparent: true,            // Transparent background for overlay
        version: '1.1.1',             // WMS version
        crs: L.CRS.EPSG4326,          // Coordinate Reference System
        bounds: [[8.075, 76.234], [13.565, 80.349]],  // Define the bounding box (extent for Tamil Nadu)
        attribution: 'Bhuvan'         // Optional: Add attribution for the data source
    });
    
    // Add layer control
    L.control.layers(baseLayers, overlays).addTo(map);
}

/**
 * Switch the active base layer
 * @param {string} layerName - Name of the base layer to activate
 */
function setMapLayer(layerName) {
    // Remove all base layers
    Object.keys(baseLayers).forEach(name => {
        map.removeLayer(baseLayers[name]);
    });
    
    // Add the requested layer
    if (baseLayers[layerName]) {
        baseLayers[layerName].addTo(map);
        return `Switched to ${layerName} view`;
    }
    
    return "Unknown map layer";
}

/**
 * Toggle overlay visibility
 * @param {string} overlayName - Name of the overlay to toggle
 * @param {boolean} show - Whether to show or hide the overlay
 */
function toggleOverlay(overlayName, show) {
    if (overlays[overlayName]) {
        if (show) {
            overlays[overlayName].addTo(map);
            return `Showing ${overlayName} layer`;
        } else {
            map.removeLayer(overlays[overlayName]);
            return `Hiding ${overlayName} layer`;
        }
    }
    
    return "Unknown overlay layer";
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
    markersLayer.clearLayers();
}

/**
 * Add a marker to the map
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} title - Marker popup title
 * @param {string} icon - Optional custom icon
 */
function addMarker(lat, lon, title, icon = null) {
    let marker;
    
    if (icon) {
        const customIcon = L.icon({
            iconUrl: `img/${icon}`,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        });
        marker = L.marker([lat, lon], { icon: customIcon });
    } else {
        marker = L.marker([lat, lon]);
    }
    
    marker.bindPopup(title).addTo(markersLayer);
    return marker;
}