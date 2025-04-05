/**
 * Database management for voice commands
 */
// Database singleton
let db = null;
let dbInitialized = false;

// Expose dbInitialized status to window for debugging
window.dbInitialized = false;

/**
 * Initialize the SQLite database
 * @returns {Promise} Promise that resolves when database is ready
 */
function initDatabase() {
    console.log("Initializing database...");
    return new Promise((resolve, reject) => {
        if (dbInitialized && db) {
            console.log("Database already initialized");
            window.dbInitialized = true;
            resolve(db);
            return;
        }
        
        console.log("Loading SQL.js...");
        // Initialize SQL.js
        initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        }).then(SQL => {
            console.log("SQL.js loaded successfully");
            // Create a database
            db = new SQL.Database();
            
            try {
                // Create table for voice commands
                db.run(`
                CREATE TABLE IF NOT EXISTS voice_commands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    processed INTEGER NOT NULL,
                    response TEXT
                );
                `);
                
                dbInitialized = true;
                window.dbInitialized = true;
                console.log("Voice command database initialized successfully");
                resolve(db);
            } catch (error) {
                console.error("Error creating database table:", error);
                reject(error);
            }
        }).catch(err => {
            console.error("SQL.js initialization error:", err);
            reject(err);
        });
    });
}

/**
 * Save a voice command to the database
 * @param {string} command - The voice command text
 * @param {boolean} processed - Whether command was successfully processed
 * @param {string} response - System response to the command
 * @returns {Promise} Promise that resolves when command is saved
 */
function saveVoiceCommand(command, processed, response) {
    console.log(`Attempting to save command: "${command}", processed: ${processed}, response: "${response}"`);
    
    return initDatabase().then(() => {
        if (!db) {
            throw new Error("Database not initialized");
        }
        
        const timestamp = new Date().toISOString();
        const processedInt = processed ? 1 : 0;
        
        try {
            db.run(
                "INSERT INTO voice_commands (command, timestamp, processed, response) VALUES (?, ?, ?, ?)",
                [command, timestamp, processedInt, response]
            );
            console.log(`Command saved successfully: ${command}`);
            return true;
        } catch (error) {
            console.error("SQL error saving command:", error);
            throw error;
        }
    }).catch(err => {
        console.error("Error saving command:", err);
        return false;
    });
}

/**
 * Get all voice commands from current session
 * @returns {Promise<Array>} Promise resolving to array of commands
 */
function getAllCommands() {
    console.log("Getting all commands...");
    
    return initDatabase().then(() => {
        if (!db) {
            console.error("Database not initialized");
            return [];
        }
        
        try {
            const result = db.exec("SELECT * FROM voice_commands ORDER BY timestamp DESC");
            console.log("Query result:", result);
            
            if (result.length > 0 && result[0].values) {
                // Convert to array of objects
                return result[0].values.map(row => {
                    return {
                        id: row[0],
                        command: row[1],
                        timestamp: row[2],
                        processed: row[3] === 1,
                        response: row[4]
                    };
                });
            }
            return [];
        } catch (error) {
            console.error("SQL error getting commands:", error);
            return [];
        }
    }).catch(err => {
        console.error("Error getting commands:", err);
        return [];
    });
}

/**
 * Export database to a downloadable file
 * @returns {Blob} SQLite database file
 */
function exportDatabase() {
    console.log("Exporting database...");
    
    if (!db) {
        console.error("Database not initialized for export");
        return null;
    }
    
    try {
        const data = db.export();
        console.log("Database exported successfully, size:", data.byteLength);
        return new Blob([data], {type: "application/x-sqlite3"});
    } catch (error) {
        console.error("Error exporting database:", error);
        return null;
    }
}