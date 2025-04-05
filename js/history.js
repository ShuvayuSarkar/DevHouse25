/**
 * Command history management
 */
// DOM elements
let historyToggleBtn;
let historyContent;
let commandHistoryBody;
let exportBtn;

// Initialize history UI when DOM is loaded
document.addEventListener('DOMContentLoaded', initCommandHistory);

function initCommandHistory() {
    console.log("Initializing command history...");
    
    // Get DOM elements
    historyToggleBtn = document.getElementById('toggle-history-btn');
    historyContent = document.getElementById('history-content');
    commandHistoryBody = document.getElementById('command-history-body');
    exportBtn = document.getElementById('export-commands-btn');
    
    if (!historyToggleBtn || !historyContent || !commandHistoryBody || !exportBtn) {
        console.error("Missing required DOM elements for history");
        return;
    }
    
    // Set up event listeners
    historyToggleBtn.addEventListener('click', toggleHistoryPanel);
    exportBtn.addEventListener('click', handleExport);
    
    // Make history visible by default
    historyContent.style.display = 'block';
    historyToggleBtn.textContent = 'Hide History';
    
    // Initial refresh
    setTimeout(refreshCommandHistory, 1000);
    
    // Set up periodic refresh
    setInterval(refreshCommandHistory, 10000); // Refresh every 10 seconds
    
    console.log("Command history initialized");
}

/**
 * Toggle command history panel visibility
 */
function toggleHistoryPanel() {
    const isVisible = historyContent.style.display !== 'none';
    if (isVisible) {
        historyContent.style.display = 'none';
        historyToggleBtn.textContent = 'Show History';
    } else {
        historyContent.style.display = 'block';
        historyToggleBtn.textContent = 'Hide History';
        refreshCommandHistory();
    }
}

/**
 * Refresh command history display
 */
function refreshCommandHistory() {
    console.log("Refreshing command history...");
    
    if (!commandHistoryBody) {
        console.error("Command history body element not found");
        return;
    }
    
    if (typeof getAllCommands !== 'function') {
        console.error("getAllCommands function not available");
        return;
    }
    
    getAllCommands().then(commands => {
        console.log(`Received ${commands.length} commands from database`);
        
        // Clear existing rows
        commandHistoryBody.innerHTML = '';
        
        if (commands.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'No commands yet';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            commandHistoryBody.appendChild(row);
            return;
        }
        
        // Add commands to table
        commands.forEach(cmd => {
            const row = document.createElement('tr');
            
            // Format timestamp
            const timestamp = new Date(cmd.timestamp);
            const timeCell = document.createElement('td');
            timeCell.textContent = timestamp.toLocaleTimeString();
            
            // Command text
            const cmdCell = document.createElement('td');
            cmdCell.textContent = cmd.command;
            
            // Response
            const responseCell = document.createElement('td');
            responseCell.textContent = cmd.response || '(No response)';
            
            row.appendChild(timeCell);
            row.appendChild(cmdCell);
            row.appendChild(responseCell);
            commandHistoryBody.appendChild(row);
        });
    }).catch(err => {
        console.error("Error refreshing history:", err);
        
        // Display error in table
        commandHistoryBody.innerHTML = '';
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'Error loading command history';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        commandHistoryBody.appendChild(row);
    });
}

/**
 * Handle export button click
 */
function handleExport() {
    console.log("Export button clicked");
    
    if (typeof exportDatabase !== 'function') {
        console.error("exportDatabase function not available");
        alert('Export functionality not available');
        return;
    }
    
    const dbBlob = exportDatabase();
    if (!dbBlob) {
        alert('No data to export or database error');
        return;
    }
    
    // Create download link
    const url = URL.createObjectURL(dbBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_commands_${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    console.log("Database export download triggered");
}