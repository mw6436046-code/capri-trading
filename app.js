// ======================================================= //
// ONLINE / OFFLINE SUPPORT                               //
// ======================================================= //

// ✅ Connection Status
let isOnline = navigator.onLine;
let syncInProgress = false;
let pendingSync = false;

// ✅ Update connection status indicator
function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;
    
    isOnline = navigator.onLine;
    
    if (isOnline) {
        statusEl.textContent = '✅ Online';
        statusEl.style.background = '#27ae60';
        statusEl.style.color = 'white';
        
        // ✅ Auto-sync when online
        if (pendingSync) {
            performFullSync();
        }
    } else {
        statusEl.textContent = '📴 Offline';
        statusEl.style.background = '#e74c3c';
        statusEl.style.color = 'white';
    }
}

// ✅ Listen for online/offline events
window.addEventListener('online', function() {
    console.log('🌐 Internet connected!');
    updateConnectionStatus();
    performFullSync();
});

window.addEventListener('offline', function() {
    console.log('📴 Internet disconnected!');
    updateConnectionStatus();
});

// ✅ Check if online
function isOnlineMode() {
    return navigator.onLine;
}

// ✅ Perform full sync
async function performFullSync() {
    if (!isOnlineMode()) {
        pendingSync = true;
        console.log('⏳ Offline - Sync pending...');
        return;
    }
    
    if (syncInProgress) {
        console.log('⏳ Sync already in progress...');
        return;
    }
    
    syncInProgress = true;
    pendingSync = false;
    
    try {
        console.log('🔄 Starting sync...');
        updateSyncStatus('🔄 Syncing...');
        
        // ✅ 1. Upload local data to cloud
        await uploadLocalData();
        
        // ✅ 2. Download cloud data to local
        await downloadCloudData();
        
        // ✅ 3. Merge and resolve conflicts
        await mergeData();
        
        // ✅ 4. Update UI
        updateSyncStatus('✅ Synced');
        document.getElementById('lastSyncTime').textContent = new Date().toLocaleTimeString();
        loadDashboardProductsGrid(false);
        updateDashboardSummary();
        
        console.log('✅ Sync completed successfully!');
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        updateSyncStatus('❌ Sync failed');
        pendingSync = true;
    }
    
    syncInProgress = false;
}

// ✅ Update sync status
function updateSyncStatus(text) {
    const el = document.getElementById('syncStatus');
    if (el) {
        const span = el.querySelector('span');
        if (span) span.textContent = text;
    }
}

// ✅ Upload local data to cloud (IndexedDB → Server)
async function uploadLocalData() {
    // ✅ Get all data from IndexedDB
    const localData = await getAllLocalData();
    
    if (!localData || localData.invoices.length === 0 && localData.products.length === 0) {
        console.log('📭 No local data to upload');
        return;
    }
    
    try {
        // ✅ Send to server (replace with your API endpoint)
        const response = await fetch('https://your-api.com/sync/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: getCurrentUser(),
                timestamp: new Date().toISOString(),
                data: localData
            })
        });
        
        if (!response.ok) {
            throw new Error('Upload failed: ' + response.status);
        }
        
        const result = await response.json();
        console.log('📤 Upload successful:', result);
        return result;
        
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ✅ Download cloud data to local (Server → IndexedDB)
async function downloadCloudData() {
    try {
        const user = getCurrentUser();
        
        // ✅ Fetch from server
        const response = await fetch(`https://your-api.com/sync/download?user=${user.username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Download failed: ' + response.status);
        }
        
        const cloudData = await response.json();
        
        if (cloudData && cloudData.data) {
            console.log('📥 Download successful:', cloudData.data.invoices.length, 'invoices');
            return cloudData.data;
        }
        
        return null;
        
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

// ✅ Merge data (local + cloud)
async function mergeData() {
    // ✅ This will be called after upload and download
    // Implementation depends on your conflict resolution strategy
    
    // Simple strategy: Server data takes priority
    // You can implement: last-write-wins, timestamp-based, etc.
    
    console.log('🔄 Merging data...');
    
    // ✅ Example: Compare timestamps and merge
    // This is a placeholder - implement based on your needs
}

// ✅ Get all local data from IndexedDB
function getAllLocalData() {
    return new Promise((resolve, reject) => {
        const invoices = [];
        let products = [];
        let completed = 0;
        let total = 2;
        
        // ✅ Get invoices
        try {
            const tx = localDatabase.transaction("sales_history", "readonly");
            const store = tx.objectStore("sales_history");
            const req = store.getAll();
            
            req.onsuccess = function() {
                invoices.push(...(req.result || []));
                completed++;
                if (completed === total) {
                    resolve({ invoices, products });
                }
            };
            req.onerror = function() {
                completed++;
                if (completed === total) {
                    resolve({ invoices, products });
                }
            };
        } catch(e) {
            completed++;
            if (completed === total) {
                resolve({ invoices, products });
            }
        }
        
        // ✅ Get products
        try {
            const tx = localDatabase.transaction("items", "readonly");
            const store = tx.objectStore("items");
            const req = store.getAll();
            
            req.onsuccess = function() {
                products = req.result || [];
                completed++;
                if (completed === total) {
                    resolve({ invoices, products });
                }
            };
            req.onerror = function() {
                completed++;
                if (completed === total) {
                    resolve({ invoices, products });
                }
            };
        } catch(e) {
            completed++;
            if (completed === total) {
                resolve({ invoices, products });
            }
        }
    });
}

// ✅ Manual sync button
function manualSync() {
    if (isOnlineMode()) {
        performFullSync();
    } else {
        alert('📴 You are offline! Sync will happen automatically when online.');
        pendingSync = true;
    }
}

// ✅ Initialize connection status
document.addEventListener('DOMContentLoaded', function() {
    updateConnectionStatus();
    
    // ✅ Auto-sync on load if online
    if (isOnlineMode()) {
        setTimeout(function() {
            performFullSync();
        }, 3000);
    }
});

// ✅ Backup local data to file (Offline backup)
function backupLocalData() {
    getAllLocalData().then(function(data) {
        if (!data.invoices.length && !data.products.length) {
            alert('No data to backup!');
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capri_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Backup downloaded successfully!');
    });
}

// ✅ Restore from backup file
function restoreLocalData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.invoices && !data.products) {
                    alert('Invalid backup file!');
                    return;
                }
                
                if (confirm('⚠️ This will overwrite all local data! Continue?')) {
                    restoreToDatabase(data);
                }
            } catch(err) {
                alert('Error reading file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ✅ Restore data to IndexedDB
function restoreToDatabase(data) {
    // ✅ Restore products
    if (data.products && data.products.length > 0) {
        executeSecureDBTransaction("items", "readwrite", function(store, tx) {
            data.products.forEach(function(item) {
                store.put(item);
            });
        });
    }
    
    // ✅ Restore invoices
    if (data.invoices && data.invoices.length > 0) {
        executeSecureDBTransaction("sales_history", "readwrite", function(store, tx) {
            data.invoices.forEach(function(inv) {
                store.put(inv);
            });
        });
    }
    
    alert('✅ Data restored successfully!');
    loadDashboardProductsGrid(false);
    updateDashboardSummary();
}

// =======================================================================
// GLOBAL VARIABLES & DATABASE CONNECTION
// =======================================================================
let localDatabase;
const dbConnection = indexedDB.open("CapriTradingDB", 1);

// Real-time Auto File Sync Variables
let localFileHandle = null;
let isSyncingWithFile = false;

// Static Hardcoded Customers/Shops Database List
const customerDatabase = [
    { code: "030603010004", name: "TILE MART" },
    { code: "030603010005", name: "CASH CUSTOMER" },
    { code: "030603010006", name: "MUZZAMMIL TILES" },
    { code: "030603010007", name: "AL MADINA TRADERS" },
    { code: "030663157890", name: "CLASSIC TILE" },
];

// Static Hardcoded Stock Data Array (Changed from const to let)
let itemMasterStock = [
    { code: "339", name: "EXTREME BOND 20KG BAG", price: 570, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "901", name: "SPACERS PKT (50PIECES) 2MM CLIP", price: 250, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "902", name: "SPACERS PKT (50PIECES) 2MM KILLI", price: 250, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "227", name: "S BOND 20KG", price: 630, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "338", name: "ECO BOND 20KG BAG", price: 560, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "345", name: "GROUT GENRAL 1KG", price: 350, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "258", name: "SPACER PKT (50 PIECE)", price: 50, pbox: 1, stockBoxes: 0, stockPieces: 0 },
    { code: "12015", name: "L36123 A (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "12016", name: "L36123 B (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "12017", name: "L36123 C (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "102", name: "L36152 A (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "103", name: "L36152 B (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "104", name: "L36152 C (12x24)", price: 2088, pbox: 8, stockBoxes: 0, stockPieces: 0 },
    { code: "501", name: "L62106 A (24x24) PRM", price: 1740, pbox: 4, stockBoxes: 0, stockPieces: 0 },
    { code: "502", name: "L62105 BH (24x24) PRM", price: 1840, pbox: 4, stockBoxes: 0, stockPieces: 0 },
    { code: "1019", name: "L12003 (24x48)", price: 2020, pbox: 2, stockBoxes: 0, stockPieces: 0 },
    { code: "4291", name: "L21201 WOODEN STRIP 8X48", price: 2400, pbox: 6, stockBoxes: 0, stockPieces: 0 }
];

let activeInvoiceItems = [];
let currentSearchFocus = -1;
let selectedActiveProduct = null;
let currentActiveReport = "";
let currentInvoiceType = 'sale';
let currentMode = 'locked';

const searchBox = document.getElementById('searchProduct');
const popupList = document.getElementById('searchPopup');

// =======================================================================
// DATABASE CONNECTION & INITIALIZATION
// =======================================================================
dbConnection.onupgradeneeded = function(event) {
    localDatabase = event.target.result;
    if (!localDatabase.objectStoreNames.contains("sales_history")) {
        localDatabase.createObjectStore("sales_history", { keyPath: "invoiceId" });
    }
    if (!localDatabase.objectStoreNames.contains("items")) {
        localDatabase.createObjectStore("items", { keyPath: "code" });
    }
};

dbConnection.onsuccess = function(event) {
    localDatabase = event.target.result;
    
    try {
        const tx = localDatabase.transaction("items", "readonly");
        const store = tx.objectStore("items");
        const req = store.getAll();

        req.onsuccess = function() {
            const dbItems = req.result || [];
            if (dbItems.length > 0 && typeof itemMasterStock !== 'undefined') {
                itemMasterStock = JSON.parse(JSON.stringify(dbItems));
                console.log("✅ Invoice screen synced with DB rates and stock!");
                checkLowStock();
            }
        };
    } catch (e) {
        console.log("Database sync pending or table empty, using memory fallback.");
    }

    resetSystem(false); 
    setupEnterNavigation();
    setupMobileHooks(); 
    setupCustomerAutoComplete();
    loadDashboardProductsGrid(true);
    updateDashboardSummary();
    lockSystem();
    
    // Setup Invoice # Enter key listener
    setupInvoiceSearchListener();

// Inside dbConnection.onsuccess after existing code
setupCustomerCodeSearch();
setupCustomerSearchKeyboard();

};

// =======================================================================
// INVOICE # SEARCH - FIXED (No Click Popup)
// =======================================================================
function setupInvoiceSearchListener() {
    const invNoInput = document.getElementById('invNo');
    
    if (invNoInput) {
        // ✅ Remove ALL existing listeners
        const newInvNo = invNoInput.cloneNode(true);
        invNoInput.parentNode.replaceChild(newInvNo, invNoInput);
        
        // ✅ Get the fresh element
        const freshInvNo = document.getElementById('invNo');
        
        // ✅ ONLY ENTER KEY EVENT - No Click Event
        freshInvNo.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Only open popup in search or locked mode
                if (currentMode === 'search' || currentMode === 'locked') {
                    // Check if field is unlocked (search mode)
                    if (!this.disabled) {
                        openInvoiceSearchPopup();
                        setTimeout(function() {
                            setupInvoiceSearchKeyboard();
                        }, 200);
                    } else {
                        alert('Invoice # is locked. Click "Search" button first to search invoices.');
                    }
                } else if (currentMode === 'edit') {
                    alert('You are in Edit Mode. Click "Search" button to search invoices.');
                }
            }
        });
        
        // ✅ REMOVED: Click event - No popup on click
        // freshInvNo.addEventListener('click', function() { ... });  // ❌ REMOVED
        
        // ✅ ADDED: Focus event - Just select text, no popup
        freshInvNo.addEventListener('focus', function() {
            // Only select text, don't open popup
            if (!this.disabled) {
                this.select();
            }
        });
    }
}

// =======================================================================
// CUSTOMER SEARCH POPUP - WITH ARROW KEYS NAVIGATION
// =======================================================================

let customerSearchFocus = -1;
let customerSearchResults = [];

// Open Customer Search Popup
function openCustomerSearchPopup() {
    const modal = document.getElementById('customerSearchModal');
    if (!modal) {
        console.error('Customer search modal not found!');
        return;
    }
    
    modal.style.display = 'flex';
    
    const input = document.getElementById('customerSearchInput');
    const results = document.getElementById('customerSearchResults');
    
    if (input) {
        input.value = '';
        customerSearchFocus = -1;
        customerSearchResults = [];
        
        // Show all customers initially
        setTimeout(function() {
            input.focus();
            filterCustomerResults('');
        }, 100);
    }
}

// Close Customer Search Popup
function closeCustomerSearchPopup() {
    const modal = document.getElementById('customerSearchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    customerSearchFocus = -1;
    customerSearchResults = [];
}

// Filter Customer Results
function filterCustomerResults(searchTerm) {
    const resultsDiv = document.getElementById('customerSearchResults');
    if (!resultsDiv) return;
    
    const term = searchTerm.toLowerCase().trim();
    
    // Get customers from database
    let customers = [];
    if (typeof customerDatabase !== 'undefined' && customerDatabase.length > 0) {
        customers = customerDatabase;
    } else {
        // Fallback: Try to get from localStorage
        try {
            const saved = localStorage.getItem('customer_database_backup');
            if (saved) {
                customers = JSON.parse(saved);
            }
        } catch(e) {}
    }
    
    // Filter customers
    customerSearchResults = customers.filter(c => 
        !term || 
        c.name.toLowerCase().includes(term) || 
        c.code.toLowerCase().includes(term)
    );
    
    // Sort by name
    customerSearchResults.sort((a, b) => a.name.localeCompare(b.name));
    
    // Render results
    if (customerSearchResults.length === 0) {
        resultsDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: #95a5a6;">No customers found</div>`;
        return;
    }
    
    let html = '';
    customerSearchResults.forEach((customer, index) => {
        const isActive = index === customerSearchFocus ? 'active' : '';
        html += `
            <div class="search-item ${isActive}" 
                 data-index="${index}"
                 data-code="${customer.code}"
                 data-name="${customer.name}"
                 style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; ${index === customerSearchFocus ? 'background: #3498db; color: white;' : ''}"
                 onclick="selectCustomerFromSearch('${customer.code}', '${customer.name.replace(/'/g, "\\'")}')"
                 onmouseenter="highlightCustomerItem(this, ${index})"
                 onmouseleave="unhighlightCustomerItem(this, ${index})">
                <div>
                    <strong style="${index === customerSearchFocus ? 'color: white;' : 'color: #2c3e50;'}">${customer.code}</strong>
                    <span style="${index === customerSearchFocus ? 'color: white;' : 'color: #555;'} margin-left: 15px;">${customer.name}</span>
                </div>
                <div style="font-size: 11px; color: ${index === customerSearchFocus ? 'white' : '#95a5a6'};">
                    Click to select
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}

// Highlight customer item on hover
function highlightCustomerItem(element, index) {
    // Remove all active classes
    document.querySelectorAll('#customerSearchResults .search-item').forEach(el => {
        el.classList.remove('active');
        el.style.background = '';
        el.style.color = '';
        const strong = el.querySelector('strong');
        const span = el.querySelector('span');
        if (strong) strong.style.color = '#2c3e50';
        if (span && !el.querySelector('span:last-child')) span.style.color = '#555';
    });
    
    // Highlight this one
    element.classList.add('active');
    element.style.background = '#3498db';
    element.style.color = 'white';
    const strong = element.querySelector('strong');
    const spans = element.querySelectorAll('span');
    if (strong) strong.style.color = 'white';
    spans.forEach(s => s.style.color = 'white');
    
    customerSearchFocus = index;
}

// Unhighlight customer item
function unhighlightCustomerItem(element, index) {
    // Only unhighlight if this is the current focus
    if (customerSearchFocus === index) {
        // But keep it highlighted if it's the active one
        // We'll let the keyboard navigation handle this
    }
}

// Select customer from search
function selectCustomerFromSearch(code, name) {
    // Set customer fields
    document.getElementById('custCode').value = code;
    document.getElementById('custType').value = name;
    document.getElementById('custTitle').value = name;
    
    // Close popup
    closeCustomerSearchPopup();
    
    // ✅ Cursor to Product Code / Search box
    setTimeout(function() {
        const productSearch = document.getElementById('searchProduct');
        if (productSearch) {
            productSearch.focus();
            productSearch.select();
        }
    }, 150);
    
    console.log(`✅ Customer selected: ${name} [${code}]`);
}

// Keyboard navigation for customer search
function setupCustomerSearchKeyboard() {
    const input = document.getElementById('customerSearchInput');
    if (!input) return;
    
    // Search on input
    input.addEventListener('input', function() {
        customerSearchFocus = -1;
        filterCustomerResults(this.value);
    });
    
    // Keyboard events
    input.addEventListener('keydown', function(e) {
        const items = document.querySelectorAll('#customerSearchResults .search-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length === 0) return;
            customerSearchFocus++;
            if (customerSearchFocus >= items.length) customerSearchFocus = 0;
            updateCustomerHighlight(items);
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length === 0) return;
            customerSearchFocus--;
            if (customerSearchFocus < 0) customerSearchFocus = items.length - 1;
            updateCustomerHighlight(items);
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (customerSearchFocus > -1 && items[customerSearchFocus]) {
                const code = items[customerSearchFocus].getAttribute('data-code');
                const name = items[customerSearchFocus].getAttribute('data-name');
                if (code && name) {
                    selectCustomerFromSearch(code, name);
                }
            } else if (items.length === 1) {
                // If only one result, select it directly
                const code = items[0].getAttribute('data-code');
                const name = items[0].getAttribute('data-name');
                if (code && name) {
                    selectCustomerFromSearch(code, name);
                }
            }
        }
        else if (e.key === 'Escape') {
            closeCustomerSearchPopup();
        }
    });
}

// Update highlight for keyboard navigation
function updateCustomerHighlight(items) {
    // Remove all highlights
    items.forEach(item => {
        item.classList.remove('active');
        item.style.background = '';
        item.style.color = '';
        const strong = item.querySelector('strong');
        const spans = item.querySelectorAll('span');
        if (strong) strong.style.color = '#2c3e50';
        spans.forEach(s => s.style.color = '');
    });
    
    // Highlight current
    if (items[customerSearchFocus]) {
        const item = items[customerSearchFocus];
        item.classList.add('active');
        item.style.background = '#3498db';
        item.style.color = 'white';
        const strong = item.querySelector('strong');
        const spans = item.querySelectorAll('span');
        if (strong) strong.style.color = 'white';
        spans.forEach(s => s.style.color = 'white');
        item.scrollIntoView({ block: 'nearest' });
    }
}

// Close popup on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('customerSearchModal');
    if (modal && modal.style.display === 'flex') {
        if (e.target === modal) {
            closeCustomerSearchPopup();
        }
    }
});

// =======================================================================
// AUTO-SAVE ENGINE (File System Access API) - ONLY ON SAVE
// =======================================================================
async function autoSaveDataToFile() {
    if (typeof itemMasterStock === 'undefined' || itemMasterStock.length === 0) return;

    if (!localFileHandle) {
        try {
            if ('showSaveFilePicker' in window) {
                const options = {
                    suggestedName: 'capri_trading_live_backup.json',
                    types: [{
                        description: 'JSON Backup File',
                        accept: { 'application/json': ['.json'] }
                    }],
                };
                localFileHandle = await window.showSaveFilePicker(options);
                console.log("✅ File handle obtained successfully!");
            } else {
                console.log("Browser File System API not supported.");
                return;
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'SecurityError') {
                console.log("User cancelled file picker or permission denied.", err);
            }
            return;
        }
    }

    const backupData = {
        last_updated: new Date().toLocaleString(),
        products: itemMasterStock,
        customers: customerDatabase
    };

    try {
        const writable = await localFileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        console.log("⚡ Auto-Save Successful!");
        document.getElementById('summarySync').textContent = new Date().toLocaleTimeString();
    } catch (writeErr) {
        console.error("Auto-Save failed.", writeErr);
        localFileHandle = null;
    }
}

// =======================================================================
// LOW STOCK ALERT SYSTEM
// =======================================================================
function checkLowStock() {
    const lowStockItems = itemMasterStock.filter(item => (item.stockBoxes || 0) < 5 && (item.stockBoxes || 0) > 0);
    const outOfStockItems = itemMasterStock.filter(item => (item.stockBoxes || 0) === 0);
    
    let alertMessage = "";
    if (lowStockItems.length > 0) {
        alertMessage += "⚠️ Low Stock Items (Less than 5 boxes):\n";
        lowStockItems.slice(0, 10).forEach(item => {
            alertMessage += `- ${item.code}: ${item.name} (${item.stockBoxes} boxes left)\n`;
        });
        if (lowStockItems.length > 10) alertMessage += `... and ${lowStockItems.length - 10} more\n`;
    }
    if (outOfStockItems.length > 0 && outOfStockItems.length < 20) {
        if (alertMessage) alertMessage += "\n";
        alertMessage += "❌ Out of Stock Items:\n";
        outOfStockItems.slice(0, 10).forEach(item => {
            alertMessage += `- ${item.code}: ${item.name}\n`;
        });
        if (outOfStockItems.length > 10) alertMessage += `... and ${outOfStockItems.length - 10} more\n`;
    }
    
    if (alertMessage) {
        setTimeout(() => {
            alert(alertMessage);
        }, 2000);
    }
}

// =======================================================================
// DASHBOARD SUMMARY - WITH TOTAL STOCK BOXES & PIECES
// =======================================================================
function updateDashboardSummary() {
    const today = new Date().toISOString().split('T')[0];
    let totalSalesToday = 0;
    let totalInvoices = 0;
    let totalStockValue = 0;
    let totalStockBoxes = 0;
    let totalStockPieces = 0;

    try {
        const tx = localDatabase.transaction("sales_history", "readonly");
        const store = tx.objectStore("sales_history");
        const req = store.getAll();

        req.onsuccess = function() {
            const invoices = req.result || [];
            totalInvoices = invoices.length;
            
            invoices.forEach(inv => {
                if (inv.date === today) {
                    totalSalesToday += parseFloat(inv.netTotal) || 0;
                }
            });
            
            itemMasterStock.forEach(item => {
                let pbox = item.pbox || 1;
                let totalPieces = (item.stockBoxes || 0) * pbox + (item.stockPieces || 0);
                totalStockValue += (totalPieces / pbox) * (item.price || 0);
                totalStockBoxes += (item.stockBoxes || 0);
                totalStockPieces += (item.stockPieces || 0);
            });
            
            const salesEl = document.getElementById('summarySales');
            const invEl = document.getElementById('summaryInvoices');
            const stockEl = document.getElementById('summaryStock');
            const boxesEl = document.getElementById('summaryTotalBoxes');
            const piecesEl = document.getElementById('summaryTotalPieces');
            const syncEl = document.getElementById('summarySync');
            
            if (salesEl) salesEl.textContent = 'Rs. ' + totalSalesToday.toLocaleString();
            if (invEl) invEl.textContent = totalInvoices;
            if (stockEl) stockEl.textContent = 'Rs. ' + Math.round(totalStockValue).toLocaleString();
            if (boxesEl) boxesEl.textContent = totalStockBoxes + ' Boxes';
            if (piecesEl) piecesEl.textContent = totalStockPieces + ' Pieces';
            if (syncEl) syncEl.textContent = new Date().toLocaleTimeString();
        };
    } catch(e) {
        console.log("Summary update pending...");
    }
}

// =======================================================================
// THEME TOGGLE
// =======================================================================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    const btn = document.querySelector('.btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Theme';
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    const btn = document.querySelector('.btn-theme');
    if (btn) btn.textContent = '☀️ Light';
}

// =======================================================================
// EXPORT TO EXCEL
// =======================================================================
function exportToExcel() {
    if (activeInvoiceItems.length === 0) {
        alert("Export karne ke liye invoice mein items hona lazmi hai!");
        return;
    }

    let csv = "S.No,Code,Product Name,Box,Piece,Rate,Amount\n";
    activeInvoiceItems.forEach((row, index) => {
        csv += `${index + 1},${row.code},${row.name},${row.box},${row.piece},${row.rate},${row.amount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${document.getElementById('invNo').value || 'export'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert("✅ Excel file downloaded successfully!");
}

// =======================================================================
// TWO-WAY DYNAMIC CUSTOMER AUTOCOMPLETE ENGINE
// =======================================================================
function setupCustomerAutoComplete() {
    const custCodeInput = document.getElementById('custCode');       
    const custTypeInput = document.getElementById('custType');       
    const custTitleInput = document.getElementById('custTitle');     
    
    let custPopup = document.getElementById('custSearchPopup');         
    let custNamePopup = document.getElementById('custNameSearchPopup'); 

    let currentFocus = -1;

    if (!custCodeInput || !custTypeInput || !custTitleInput) return;

    if (!custPopup) {
        custPopup = document.createElement('div');
        custPopup.id = 'custSearchPopup';
        custPopup.style.position = 'absolute';
        custPopup.style.background = 'white';
        custPopup.style.border = '1px solid #ccc';
        custPopup.style.maxHeight = '200px';
        custPopup.style.overflowY = 'auto';
        custPopup.style.zIndex = '9999';
        custPopup.style.boxShadow = '0px 4px 8px rgba(0,0,0,0.15)';
    }
    
    if (!custNamePopup) {
        custNamePopup = document.createElement('div');
        custNamePopup.id = 'custNameSearchPopup';
        custNamePopup.style.position = 'absolute';
        custNamePopup.style.background = 'white';
        custNamePopup.style.border = '1px solid #ccc';
        custNamePopup.style.maxHeight = '200px';
        custNamePopup.style.overflowY = 'auto';
        custNamePopup.style.zIndex = '9999';
        custNamePopup.style.boxShadow = '0px 4px 8px rgba(0,0,0,0.15)';
        custTitleInput.parentNode.appendChild(custNamePopup);
    }

    function renderShopDropdown(triggerElement) {
        const val = triggerElement.value.toUpperCase().trim();
        custPopup.innerHTML = '';
        currentFocus = -1;
        
        triggerElement.parentNode.appendChild(custPopup);
        
        custPopup.style.width = triggerElement.offsetWidth + 'px';
        custPopup.style.left = triggerElement.offsetLeft + 'px';
        custPopup.style.top = (triggerElement.offsetTop + triggerElement.offsetHeight) + 'px';
        
        const matches = val 
            ? customerDatabase.filter(c => (c.name && c.name.toUpperCase().includes(val)) || (c.code && c.code.includes(val)))
            : customerDatabase;
        
        if(matches.length > 0) {
            matches.forEach((cust, index) => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid #eee';
                div.style.fontSize = '12px';
                div.textContent = `${cust.name} [${cust.code}]`;
                
                div.setAttribute('data-code', cust.code);
                div.setAttribute('data-name', cust.name);
                
                div.onmousedown = function(e) {
                    e.preventDefault(); 
                    selectShop(cust.name, cust.code);
                };
                custPopup.appendChild(div);
            });
            custPopup.style.display = 'block';
        } else {
            custPopup.style.display = 'none';
        }
    }

    function selectShop(name, code) {
        custTypeInput.value = name;
        custCodeInput.value = code;
        custPopup.style.display = 'none';
        currentFocus = -1;
    }

    function addActive(items) {
        if (!items || items.length === 0) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (items.length - 1);
        
        items[currentFocus].style.backgroundColor = '#1e90ff';
        items[currentFocus].style.color = '#ffffff';
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].style.backgroundColor = 'white';
            items[i].style.color = '#000000';
        }
    }

    function handleKeyDown(e) {
        let items = custPopup.getElementsByClassName('search-item');
        if (custPopup.style.display === 'none' || items.length === 0) return;

        if (e.keyCode === 40) { 
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) { 
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) { 
            e.preventDefault();
            if (currentFocus > -1 && items[currentFocus]) {
                const name = items[currentFocus].getAttribute('data-name');
                const code = items[currentFocus].getAttribute('data-code');
                selectShop(name, code);
            }
        }
    }

    custTypeInput.addEventListener('input', function() { renderShopDropdown(custTypeInput); });
    custTypeInput.addEventListener('focus', function() { renderShopDropdown(custTypeInput); });
    custTypeInput.addEventListener('click', function() { renderShopDropdown(custTypeInput); });
    custTypeInput.addEventListener('keydown', handleKeyDown);

    custCodeInput.addEventListener('input', function() { renderShopDropdown(custCodeInput); });
    custCodeInput.addEventListener('focus', function() { renderShopDropdown(custCodeInput); });
    custCodeInput.addEventListener('click', function() { renderShopDropdown(custCodeInput); });
    custCodeInput.addEventListener('keydown', handleKeyDown);

    function renderCustomerDropdown() {
        const val = custTitleInput.value.toUpperCase().trim();
        custNamePopup.innerHTML = '';
        custNamePopup.style.width = custTitleInput.offsetWidth + 'px';
        custNamePopup.style.left = custTitleInput.offsetLeft + 'px';
        custNamePopup.style.top = (custTitleInput.offsetTop + custTitleInput.offsetHeight) + 'px';
        
        if(!val) {
            custNamePopup.style.display = 'none';
            return;
        }

        let walkInHistory = [];
        try {
            walkInHistory = JSON.parse(localStorage.getItem('walk_in_customers_history')) || [];
        } catch(e) { walkInHistory = []; }

        const matches = walkInHistory.filter(name => name.toUpperCase().includes(val));
        
        if(matches.length > 0) {
            matches.forEach(custNameNo => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid #eee';
                div.style.fontSize = '12px';
                div.textContent = custNameNo;
                
                div.onmousedown = function(e) {
                    e.preventDefault();
                    custTitleInput.value = custNameNo;
                    custNamePopup.style.display = 'none';
                };
                custNamePopup.appendChild(div);
            });
            custNamePopup.style.display = 'block';
        } else {
            custNamePopup.style.display = 'none';
        }
    }

    custTitleInput.addEventListener('input', renderCustomerDropdown);
    custTitleInput.addEventListener('focus', renderCustomerDropdown);

    document.addEventListener('click', function(e) {
        if (e.target !== custTypeInput && e.target !== custCodeInput) {
            custPopup.style.display = 'none';
        }
        if (e.target !== custTitleInput) {
            custNamePopup.style.display = 'none';
        }
    });
}

function saveWalkInCustomerToHistory() {
    const custTitleVal = document.getElementById('custTitle').value.trim();
    if(!custTitleVal) return;

    let walkInHistory = [];
    try {
        walkInHistory = JSON.parse(localStorage.getItem('walk_in_customers_history')) || [];
    } catch(e) { walkInHistory = []; }

    if(!walkInHistory.includes(custTitleVal)) {
        walkInHistory.push(custTitleVal);
        localStorage.setItem('walk_in_customers_history', JSON.stringify(walkInHistory));
    }
}

// =======================================================================
// PRODUCT SEARCH POPUP MODAL
// =======================================================================
function openProductSearchPopup() {
    let modal = document.getElementById('productSearchModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'productSearchModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        `;
        modal.innerHTML = `
            <div style="background: white; width: 500px; max-width: 95%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); padding: 20px; max-height: 90vh; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">🔍 Search Product</h3>
                    <button onclick="closeProductSearchPopup()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #e74c3c;">✕</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <input type="text" id="popupSearchInput" placeholder="Type product code or name..." style="width: 100%; padding: 10px; font-size: 14px; border: 2px solid #3498db; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div id="popupSearchResults" style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; max-height: 300px; background: #f8f9fa;">
                    <div style="padding: 15px; text-align: center; color: #7f8c8d;">Start typing to search products...</div>
                </div>
                <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #95a5a6;">
                    <span>↑↓ Arrow keys to navigate</span>
                    <span>Enter to select</span>
                    <span>ESC to close</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const searchInput = document.getElementById('popupSearchInput');
        const resultsDiv = document.getElementById('popupSearchResults');
        let currentFocus = -1;
        
        searchInput.addEventListener('input', function() {
            const val = this.value.toLowerCase().trim();
            resultsDiv.innerHTML = '';
            currentFocus = -1;
            
            let liveItemsList = typeof itemMasterStock !== 'undefined' ? itemMasterStock : [];
            const backup = localStorage.getItem('cached_items_backup');
            if (backup) {
                try {
                    liveItemsList = JSON.parse(backup);
                } catch(e) {}
            }
            
            const matchedItems = liveItemsList.filter(i => 
                !val || String(i.code).toLowerCase().includes(val) || i.name.toLowerCase().includes(val)
            );
            
            if (matchedItems.length === 0) {
                resultsDiv.innerHTML = `<div style="padding: 15px; text-align: center; color: #95a5a6;">No products found</div>`;
                return;
            }
            
            matchedItems.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'popup-search-item';
                div.setAttribute('data-code', item.code);
                div.setAttribute('data-name', item.name);
                div.setAttribute('data-price', item.price);
                div.setAttribute('data-pbox', item.pbox || 1);
                div.setAttribute('data-index', index);
                div.style.cssText = `
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.2s;
                `;
                div.innerHTML = `
                    <div>
                        <strong style="color: #2c3e50;">${item.code}</strong>
                        <span style="color: #555; margin-left: 10px;">${item.name}</span>
                    </div>
                    <div>
                        <span style="color: #27ae60; font-weight: bold;">Rs. ${item.price}</span>
                        <span style="color: #7f8c8d; font-size: 11px; margin-left: 10px;">P/Box: ${item.pbox || 1}</span>
                    </div>
                `;
                
                div.onclick = function() {
                    selectProductFromPopup(item);
                };
                
                div.onmouseenter = function() {
                    removeActivePopupItems();
                    this.style.backgroundColor = '#3498db';
                    this.style.color = 'white';
                    const strong = this.querySelector('strong');
                    const spans = this.querySelectorAll('span');
                    if (strong) strong.style.color = 'white';
                    spans.forEach(s => s.style.color = 'white');
                    currentFocus = index;
                };
                div.onmouseleave = function() {
                    this.style.backgroundColor = '';
                    this.style.color = '';
                    const strong = this.querySelector('strong');
                    const spans = this.querySelectorAll('span');
                    if (strong) strong.style.color = '#2c3e50';
                    spans.forEach(s => s.style.color = '');
                };
                
                resultsDiv.appendChild(div);
            });
        });
        
        searchInput.addEventListener('keydown', function(e) {
            const items = resultsDiv.getElementsByClassName('popup-search-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length === 0) return;
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                addActivePopupItem(items, currentFocus);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length === 0) return;
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
                addActivePopupItem(items, currentFocus);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    const code = items[currentFocus].getAttribute('data-code');
                    const name = items[currentFocus].getAttribute('data-name');
                    const price = parseFloat(items[currentFocus].getAttribute('data-price')) || 0;
                    const pbox = parseInt(items[currentFocus].getAttribute('data-pbox')) || 1;
                    
                    const selectedItem = {
                        code: code,
                        name: name,
                        price: price,
                        pbox: pbox
                    };
                    selectProductFromPopup(selectedItem);
                }
            } else if (e.key === 'Escape') {
                closeProductSearchPopup();
            }
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProductSearchPopup();
            }
        });
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        const input = document.getElementById('popupSearchInput');
        if (input) {
            input.value = '';
            input.focus();
            input.dispatchEvent(new Event('input'));
        }
    }, 100);
}

function closeProductSearchPopup() {
    const modal = document.getElementById('productSearchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (searchBox) {
        searchBox.focus();
    }
}

function addActivePopupItem(items, focusIndex) {
    const allItems = document.querySelectorAll('.popup-search-item');
    allItems.forEach(item => {
        item.style.backgroundColor = '';
        item.style.color = '';
        const strong = item.querySelector('strong');
        const spans = item.querySelectorAll('span');
        if (strong) strong.style.color = '#2c3e50';
        spans.forEach(s => s.style.color = '');
    });
    
    if (items[focusIndex]) {
        items[focusIndex].style.backgroundColor = '#3498db';
        items[focusIndex].style.color = 'white';
        const strong = items[focusIndex].querySelector('strong');
        const spans = items[focusIndex].querySelectorAll('span');
        if (strong) strong.style.color = 'white';
        spans.forEach(s => s.style.color = 'white');
        items[focusIndex].scrollIntoView({ block: 'nearest' });
    }
}

function removeActivePopupItems() {
    const items = document.querySelectorAll('.popup-search-item');
    items.forEach(item => {
        item.style.backgroundColor = '';
        item.style.color = '';
        const strong = item.querySelector('strong');
        const spans = item.querySelectorAll('span');
        if (strong) strong.style.color = '#2c3e50';
        spans.forEach(s => s.style.color = '');
    });
}

// =======================================================================
// SELECT PRODUCT FROM POPUP
// =======================================================================
function selectProductFromPopup(item) {
    closeProductSearchPopup();
    
    let fullItem = null;
    if (typeof itemMasterStock !== 'undefined') {
        fullItem = itemMasterStock.find(i => String(i.code) === String(item.code));
    }
    if (!fullItem) {
        fullItem = item;
    }
    
    selectProductItem(fullItem);
}

// =======================================================================
// SELECT PRODUCT ITEM - WITH STOCK IN HAND DISPLAY
// =======================================================================
// =======================================================================
// SELECT PRODUCT ITEM - FIXED CURSOR TO BOX
// =======================================================================
function selectProductItem(item) {
    let livePrice = item.price;
    let liveStockBoxes = 0;
    let liveStockPieces = 0;
    
    if (typeof itemMasterStock !== 'undefined') {
        const liveItem = itemMasterStock.find(i => String(i.code) === String(item.code));
        if (liveItem) {
            if (liveItem.price !== undefined) livePrice = liveItem.price;
            liveStockBoxes = liveItem.stockBoxes || 0;
            liveStockPieces = liveItem.stockPieces || 0;
        }
    }

    selectedActiveProduct = item;
    searchBox.value = item.code;
    document.getElementById('prodNameDisplay').value = item.name;
    document.getElementById('itemRate').value = livePrice;
    
    // Reset inputs
    document.getElementById('boxQty').value = '';
    document.getElementById('pieceQty').value = '';
    document.getElementById('itemDisc').value = '';
    document.getElementById('rowAmount').value = '';
    
    // ✅ STOCK IN HAND DISPLAY
    const stockDisplay = document.getElementById('stockDisplay');
    if (stockDisplay) {
        let statusText = '✅ In Stock';
        let statusColor = '#27ae60';
        let borderColor = '#2980b9';
        
        if (liveStockBoxes === 0 && liveStockPieces === 0) {
            statusText = '❌ Out of Stock';
            statusColor = '#e74c3c';
            borderColor = '#e74c3c';
        } else if (liveStockBoxes < 5 && liveStockBoxes > 0) {
            statusText = '⚠️ Low Stock';
            statusColor = '#f39c12';
            borderColor = '#f39c12';
        }
        
        stockDisplay.style.borderColor = borderColor;
        stockDisplay.style.background = '#f8f9fa';
        
        stockDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 4px;">
                <span style="font-weight: bold; color: #2c3e50; font-size: 11px;">📦 Stock In Hand:</span>
                <span style="background: #1a1a2e; color: white; padding: 2px 14px; border-radius: 3px; font-weight: bold; font-size: 13px;">
                    ${liveStockBoxes} Boxes, ${liveStockPieces} Pieces
                </span>
                <span style="color: ${statusColor}; font-weight: bold; font-size: 11px; background: ${statusColor}15; padding: 2px 10px; border-radius: 3px;">
                    ${statusText}
                </span>
            </div>
        `;
    }
    
    popupList.style.display = 'none';
    calculateRowValue();
    
    // ✅ FIX: Cursor to Box field (skip Piece) - Multiple attempts
    // Attempt 1: Immediate
    const boxField = document.getElementById('boxQty');
    if (boxField) {
        boxField.focus();
        boxField.select();
    }
    
    // Attempt 2: After 50ms
    setTimeout(function() {
        const boxField2 = document.getElementById('boxQty');
        if (boxField2) {
            boxField2.focus();
            boxField2.select();
        }
    }, 50);
    
    // Attempt 3: After 150ms (final)
    setTimeout(function() {
        const boxField3 = document.getElementById('boxQty');
        if (boxField3) {
            boxField3.focus();
            boxField3.select();
        }
    }, 150);
}

// =======================================================================
// ENTER & ARROW KEYS NAVIGATION ENGINE
// =======================================================================
function setupEnterNavigation() {
    document.body.addEventListener('keydown', function(e) {
        const activeEl = document.activeElement;

        if (activeEl.id === 'searchProduct' && e.key === 'Enter') {
            e.preventDefault();
            openProductSearchPopup();
            return;
        }

        if (activeEl.id === 'popupSearchInput') {
            return;
        }

        if (activeEl.id === 'searchProduct' && popupList && popupList.style.display === 'block') {
            const items = popupList.getElementsByClassName('search-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSearchFocus++;
                addActiveSearchItem(items);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSearchFocus--;
                addActiveSearchItem(items);
                return;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentSearchFocus > -1 && items[currentSearchFocus]) {
                    items[currentSearchFocus].click(); 
                } else if (items.length > 0) {
                    items[0].click(); 
                }
                return;
            }
        }

        if (e.key === 'Enter') {
            if (activeEl.id === 'invNo') {
                // Invoice # Enter handled by setupInvoiceSearchListener
                return;
            }

            if (activeEl.classList.contains('nav-enter')) {
                e.preventDefault();
                const nextId = activeEl.getAttribute('data-next');
                const triggerId = activeEl.getAttribute('data-trigger');
                
                if (nextId) {
                    const nextEl = document.getElementById(nextId);
                    if (nextEl) nextEl.focus();
                } else if (triggerId) {
                    const btn = document.getElementById(triggerId);
                    if (btn) btn.click();
                }
            }
        }
    });
}

function setupMobileHooks() {
    const invInput = document.getElementById('invNo');
    if (invInput) {
        invInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { 
                // Handled by setupInvoiceSearchListener
            }
        });

        invInput.addEventListener('blur', function() {
            processInvoiceLookup(this.value.trim());
        });
    }
}

// =======================================================================
// INVOICE LOOKUP ENGINE
// =======================================================================
function processInvoiceLookup(targetId) {
    if (targetId) {
        const tx = localDatabase.transaction("sales_history", "readonly");
        const getReq = tx.objectStore("sales_history").get(targetId);

        getReq.onsuccess = function() {
            if (getReq.result) {
                fetchOldInvoice(targetId); 
            } else {
                alert("Invoice #" + targetId + " nahi mili! Search popup kholi ja rahi hai.");
                openInvoiceSearchPopup();
            }
        };
    } else {
        openInvoiceSearchPopup();
    }
}

function addActiveSearchItem(items) {
    if (!items || items.length === 0) return false;
    removeActiveSearchItem(items);
    if (currentSearchFocus >= items.length) currentSearchFocus = 0;
    if (currentSearchFocus < 0) currentSearchFocus = items.length - 1;
    items[currentSearchFocus].style.backgroundColor = '#3498db';
    items[currentSearchFocus].style.color = 'white';
    items[currentSearchFocus].scrollIntoView({ block: 'nearest' });
}

function removeActiveSearchItem(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].style.backgroundColor = '';
        items[i].style.color = '';
    }
}

// =======================================================================
// LIVE PRODUCT SEARCH POPUP ENGINE
// =======================================================================
if (searchBox) {
    searchBox.addEventListener('focus', function() {});
    
    searchBox.addEventListener('change', function() {
        if (this.value.trim()) {
            const matchedItem = itemMasterStock.find(i => String(i.code) === this.value.trim());
            if (matchedItem) {
                selectProductItem(matchedItem);
            }
        }
    });
}

function triggerSearchFilter(textVal) {
    if (!popupList) return;
    const rawVal = textVal.toLowerCase().trim();
    popupList.innerHTML = '';
    currentSearchFocus = -1;
    
    let liveItemsList = typeof itemMasterStock !== 'undefined' ? itemMasterStock : [];
    const backup = localStorage.getItem('cached_items_backup');
    if (backup) {
        try {
            liveItemsList = JSON.parse(backup);
        } catch(e) {}
    }

    const matchedItems = liveItemsList.filter(i => 
        !rawVal || String(i.code).toLowerCase().includes(rawVal) || i.name.toLowerCase().includes(rawVal)
    );
    
    matchedItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.textContent = `[${item.code}] - ${item.name}`;
        div.onclick = function() { selectProductItem(item); };
        popupList.appendChild(div);
    });

    popupList.style.display = 'block';
}

// =======================================================================
// COMMIT ROW ITEM
// =======================================================================
function commitRowItem() {
    if(!selectedActiveProduct) { alert("Pehle item select karein!"); return; }
    let boxes = parseInt(document.getElementById('boxQty').value) || 0;
    let pieces = parseInt(document.getElementById('pieceQty').value) || 0;
    const finalRate = parseFloat(document.getElementById('itemRate').value) || 0;
    const discount = parseFloat(document.getElementById('itemDisc').value) || 0;
    
    if(boxes === 0 && pieces === 0) return;
    let pbox = parseInt(selectedActiveProduct.pbox) || 1;

    if (!checkStockAvailability(selectedActiveProduct.code, boxes, pieces)) {
        return;
    }

    if (pbox > 1 && pieces >= pbox) {
        let totalPieces = (boxes * pbox) + pieces;
        boxes = Math.floor(totalPieces / pbox); 
        pieces = totalPieces % pbox;           
    } 
    else if (pbox === 1 && pieces > 0) {
        boxes = boxes + pieces;
        pieces = 0;
    }

    const rowGross = (boxes * finalRate) + ((pieces / pbox) * finalRate);
    const rowNet = Math.round(rowGross - discount);

    activeInvoiceItems.push({
        code: selectedActiveProduct.code,
        name: selectedActiveProduct.name,
        box: boxes,
        piece: pieces,
        rate: finalRate,
        gross: Math.round(rowGross), 
        disc: discount,
        amount: rowNet,
        pbox: selectedActiveProduct.pbox
    });

    renderGridTable();
    
    searchBox.value = '';
    document.getElementById('prodNameDisplay').value = '';
    document.getElementById('boxQty').value = '';
    document.getElementById('pieceQty').value = '';
    document.getElementById('itemRate').value = '';
    document.getElementById('itemDisc').value = '';
    document.getElementById('rowAmount').value = '';
    selectedActiveProduct = null;
    
    setTimeout(function() {
        if (searchBox) {
            searchBox.focus();
        }
    }, 50);
}

function renderGridTable() {
    const tableBody = document.querySelector('#invoiceTable tbody');
    if (!tableBody) return;
    
    // ✅ Clear table first
    tableBody.innerHTML = '';
    
    let boxSum = 0, pieceSum = 0, amountSum = 0;

    activeInvoiceItems.forEach((row, index) => {
        boxSum += row.box;
        pieceSum += row.piece;
        amountSum += row.amount;

        const htmlRow = `<tr>
            <td>${row.code}</td>
            <td style="text-align:left;">${row.name}</td>
            <td>${row.box}</td>
            <td>${row.piece}</td>
            <td>${row.rate}</td>
            <td>${row.amount.toFixed(2)}</td>
            <td>${row.pbox}</td>
            <td>
                <span class="action-link edit-link" onclick="editRowItem(${index})">✏️ Edit</span>
                <span class="action-link delete-link" onclick="removeRowItem(${index})">❌</span>
            </td>
        </tr>`;
        tableBody.innerHTML += htmlRow;
    });

    document.getElementById('totalBoxesCount').value = boxSum;
    document.getElementById('totalPiecesCount').value = pieceSum;
    document.getElementById('calcGross').value = Math.round(amountSum);
    runTotalBal();
}

function editRowItem(index) {
    const targetItem = activeInvoiceItems[index];
    selectedActiveProduct = itemMasterStock.find(i => i.code === targetItem.code);
    if(selectedActiveProduct) {
        searchBox.value = targetItem.code;
        document.getElementById('prodNameDisplay').value = targetItem.name;
        document.getElementById('boxQty').value = targetItem.box;
        document.getElementById('pieceQty').value = targetItem.piece;
        document.getElementById('itemRate').value = targetItem.rate;
        document.getElementById('itemDisc').value = targetItem.disc || '';
        document.getElementById('rowAmount').value = targetItem.amount;
        activeInvoiceItems.splice(index, 1);
        renderGridTable();
        document.getElementById('boxQty').focus();
    }
}

function removeRowItem(index) {
    activeInvoiceItems.splice(index, 1);
    renderGridTable();
}

// =======================================================================
// CALCULATIONS & GRID MANAGEMENT
// =======================================================================
if(document.getElementById('boxQty')) document.getElementById('boxQty').addEventListener('input', calculateRowValue);
if(document.getElementById('pieceQty')) document.getElementById('pieceQty').addEventListener('input', calculateRowValue);
if(document.getElementById('itemRate')) document.getElementById('itemRate').addEventListener('input', calculateRowValue);
if(document.getElementById('itemDisc')) document.getElementById('itemDisc').addEventListener('input', calculateRowValue);

function calculateRowValue() {
    if(!selectedActiveProduct) return;
    const boxes = parseInt(document.getElementById('boxQty').value) || 0;
    const pieces = parseInt(document.getElementById('pieceQty').value) || 0;
    const dynamicRate = parseFloat(document.getElementById('itemRate').value) || 0;
    const discount = parseFloat(document.getElementById('itemDisc').value) || 0;
    
    let pbox = parseInt(selectedActiveProduct.pbox) || 1;
    
    const grossCalc = (boxes * dynamicRate) + ((pieces / pbox) * dynamicRate);
    const netCalc = Math.round(grossCalc - discount);
    
    document.getElementById('rowAmount').value = netCalc === 0 ? '' : netCalc;
}

// =======================================================================
// STOCK CHECK FUNCTION
// =======================================================================
function checkStockAvailability(productCode, requestedBoxes, requestedPieces) {
    let product = null;
    
    if (typeof itemMasterStock !== 'undefined') {
        product = itemMasterStock.find(i => String(i.code) === String(productCode));
    }
    
    if (!product) {
        alert("Product stock information not found!");
        return false;
    }
    
    let pbox = product.pbox || 1;
    let availablePieces = (product.stockBoxes || 0) * pbox + (product.stockPieces || 0);
    let requestedPiecesTotal = (requestedBoxes * pbox) + (requestedPieces || 0);
    
    if (requestedPiecesTotal > availablePieces) {
        alert(`⚠️ Insufficient Stock!\n\nAvailable: ${product.stockBoxes} Boxes, ${product.stockPieces} Pieces\nRequested: ${requestedBoxes} Boxes, ${requestedPieces || 0} Pieces\n\nPlease reduce quantity.`);
        return false;
    }
    
    return true;
}

// =======================================================================
// STOCK DEDUCTION FUNCTION (When Invoice is Saved)
// =======================================================================
function deductStockFromInvoice(invoiceItems) {
    if (!invoiceItems || invoiceItems.length === 0) return;

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        if (!store) {
            console.warn("Stock deduction: Store not available");
            return;
        }

        invoiceItems.forEach(function(item) {
            const getReq = store.get(item.code);
            getReq.onsuccess = function() {
                let product = getReq.result;
                if (product) {
                    let totalPiecesSold = (item.box * (product.pbox || 1)) + (item.piece || 0);
                    let currentStockPieces = (product.stockBoxes || 0) * (product.pbox || 1) + (product.stockPieces || 0);
                    let newStockPieces = currentStockPieces - totalPiecesSold;
                    
                    let pbox = product.pbox || 1;
                    product.stockBoxes = Math.floor(newStockPieces / pbox);
                    product.stockPieces = newStockPieces % pbox;
                    
                    if (product.stockBoxes < 0) product.stockBoxes = 0;
                    if (product.stockPieces < 0) product.stockPieces = 0;
                    
                    store.put(product);
                    
                    if (typeof itemMasterStock !== 'undefined') {
                        const idx = itemMasterStock.findIndex(i => String(i.code) === String(item.code));
                        if (idx > -1) {
                            itemMasterStock[idx].stockBoxes = product.stockBoxes;
                            itemMasterStock[idx].stockPieces = product.stockPieces;
                        }
                    }
                }
            };
        });
    });
}

// =======================================================================
// ADD STOCK FUNCTION (For Return Invoice)
// =======================================================================
function addStockFromInvoice(invoiceItems) {
    if (!invoiceItems || invoiceItems.length === 0) return;

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        if (!store) {
            console.warn("Stock addition: Store not available");
            return;
        }

        invoiceItems.forEach(function(item) {
            const getReq = store.get(item.code);
            getReq.onsuccess = function() {
                let product = getReq.result;
                if (product) {
                    let totalPiecesToAdd = (item.box * (product.pbox || 1)) + (item.piece || 0);
                    let currentStockPieces = (product.stockBoxes || 0) * (product.pbox || 1) + (product.stockPieces || 0);
                    let newStockPieces = currentStockPieces + totalPiecesToAdd;
                    
                    let pbox = product.pbox || 1;
                    product.stockBoxes = Math.floor(newStockPieces / pbox);
                    product.stockPieces = newStockPieces % pbox;
                    
                    store.put(product);
                    
                    if (typeof itemMasterStock !== 'undefined') {
                        const idx = itemMasterStock.findIndex(i => String(i.code) === String(item.code));
                        if (idx > -1) {
                            itemMasterStock[idx].stockBoxes = product.stockBoxes;
                            itemMasterStock[idx].stockPieces = product.stockPieces;
                        }
                    }
                }
            };
        });
    });
}

// =======================================================================
// SAVE TO INDEXEDDB - FIXED
// =======================================================================
function saveToIndexedDB() {
    console.log('🔵 Step 1: saveToIndexedDB called');
    
    const invId = document.getElementById('invNo').value.trim();
    if(!invId) { 
        alert("Invoice ID empty!"); 
        return;
    }
    
    console.log('🔵 Step 2: Invoice ID:', invId);
    
    saveWalkInCustomerToHistory();

    const finalNetTotal = parseFloat(document.getElementById('calcNetTotal').value) || 0;

    // ✅ Copy items to save
    const itemsToSave = [...activeInvoiceItems];

    const objectPayload = {
        invoiceId: invId,
        date: document.getElementById('invDate').value,
        customerName: document.getElementById('custType').value,
        customerCode: document.getElementById('custCode').value,
        customerDetailsName: document.getElementById('custTitle').value, 
        items: itemsToSave,
        previousBalance: document.getElementById('calcPrev').value,
        cashReceived: document.getElementById('calcCashRec').value,
        netTotal: finalNetTotal,
        invoiceType: currentInvoiceType
    };

    console.log('🔵 Step 3: Items count:', itemsToSave.length);
    console.log('🔵 Step 4: Saving to IndexedDB...');

    const tx = localDatabase.transaction("sales_history", "readwrite");
    tx.objectStore("sales_history").put(objectPayload);
    
    tx.oncomplete = function() {
        console.log('🔵 Step 5: Save complete!');
        
        // ✅ Stock update with proper message
        if (currentInvoiceType === 'sale') {
            deductStockFromInvoice(itemsToSave);
            alert("Invoice #" + invId + " Saved! Stock DEDUCTED.");
        } else if (currentInvoiceType === 'return') {
            addStockFromInvoice(itemsToSave);
            alert("Invoice #" + invId + " Saved! Stock ADDED (Return).");
        } else {
            alert("Invoice #" + invId + " Saved!");
        }
        
        // ✅ Dashboard update
        loadDashboardProductsGrid(false);
        updateDashboardSummary();
        
        // ✅ Print preview with delay
        console.log('🔵 Step 6: Attempting print preview...');
        console.log('🔵 Items count before print:', itemsToSave.length);
        
        setTimeout(function() {
            try {
                console.log('🔵 Generating print preview...');
                generatePrintInNewTab();
            } catch(e) {
                console.error('❌ Print preview error:', e);
            }
        }, 500);
        
        // ✅ Reset and lock after print preview
        setTimeout(function() {
            resetSystem(true);
            lockSystem();
            console.log('🔵 Step 7: System reset and locked');
        }, 1000);
    };
    
    tx.onerror = function(error) {
        console.error('❌ Save error:', error);
        alert('❌ Save failed! Please try again.');
    };
}

// =======================================================================
// FETCH OLD INVOICE - FIXED (No Duplicate Items)
// =======================================================================
function fetchOldInvoice(id) {
    const tx = localDatabase.transaction("sales_history", "readonly");
    const getReq = tx.objectStore("sales_history").get(id);

    getReq.onsuccess = function() {
        if(getReq.result) {
            const data = getReq.result;
            
            // ✅ 1. Invoice data load karo
            document.getElementById('invNo').value = data.invoiceId;
            document.getElementById('invDate').value = data.date;
            document.getElementById('custType').value = data.customerName || "";
            document.getElementById('custCode').value = data.customerCode || "";
            document.getElementById('custTitle').value = data.customerDetailsName || "";
            document.getElementById('calcPrev').value = data.previousBalance || 0;
            document.getElementById('calcCashRec').value = data.cashReceived || 0;
            
            // ✅ 2. Items load karo - PEHLE CLEAR KAREIN
            activeInvoiceItems = [];  // 👈 IMPORTANT: Pehle clear
            activeInvoiceItems = data.items || [];
            renderGridTable();
            
            // ✅ 3. Invoice Type set karo
            if (data.invoiceType) {
                currentInvoiceType = data.invoiceType;
                const select = document.getElementById('invoiceType');
                if (select) select.value = data.invoiceType;
                updateInvoiceType();
            }
            
            // ✅ 4. Edit Mode enable karo
            enableEditModeAfterLoad();
            
            // ✅ 5. Update title
            updateWindowTitle();
            
            console.log('✅ Invoice loaded successfully in Edit Mode');
        } else {
            alert("Invoice #" + id + " nahi mili!");
        }
    };
}

// =======================================================================
// NEW FUNCTION: ENABLE EDIT MODE AFTER LOAD (WITHOUT RESET)
// =======================================================================
function enableEditModeAfterLoad() {
    currentMode = 'edit';
    
    // ✅ All fields ko editable karo (except stock display)
    const fields = getAllEditableFields();
    fields.forEach(field => {
        if (field) {
            field.classList.remove('locked-field');
            field.classList.remove('search-mode-field');
            field.disabled = false;
            field.readOnly = false;
        }
    });
    
    // ✅ Stock display ko locked rakho (read-only)
    const stockDisplay = document.getElementById('stockDisplay');
    if (stockDisplay) {
        stockDisplay.style.pointerEvents = 'none';
        stockDisplay.style.opacity = '0.8';
    }
    
    // ✅ Mode indicator update karo
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = '✏️ Edit Mode (Loaded)';
        indicator.className = 'mode-indicator mode-edit';
    }
    
    // ✅ Focus on first editable field
    const boxField = document.getElementById('boxQty');
    if (boxField) {
        setTimeout(() => {
            boxField.focus();
        }, 100);
    }
    
    console.log('✏️ Edit Mode enabled after loading invoice');
}

function deleteCurrentInvoice() {
    const currentId = document.getElementById('invNo').value.trim();
    if(!currentId) return;
    if(confirm("Delete this invoice?")) {
        const tx = localDatabase.transaction("sales_history", "readwrite");
        const store = tx.objectStore("sales_history");
        store.delete(currentId);
        tx.oncomplete = function() {
            generatePrintInNewTab();
            alert("Deleted!");
            resetSystem(true);
            lockSystem();
        };
    }
}

function runTotalBal() {
    const gross = parseFloat(document.getElementById('calcGross').value) || 0;
    const prev = parseFloat(document.getElementById('calcPrev').value) || 0;
    const cash = parseFloat(document.getElementById('calcCashRec').value) || 0;
    document.getElementById('calcNetTotal').value = Math.round((gross + prev) - cash);
}

function resetSystem(generateNewId) {
    // ✅ Clear items - IMPORTANT
    activeInvoiceItems = [];
    const tbody = document.querySelector('#invoiceTable tbody');
    if (tbody) tbody.innerHTML = '';
    
    // ... baqi code waisa hi ...
}

// =======================================================================
// FIND SMALLEST MISSING NUMBER IN SEQUENCE
// =======================================================================
function findSmallestMissingNumber(existingIds) {
    if (existingIds.length === 0) {
        return "1001";
    }
    
    // Sort numbers in ascending order
    const sorted = existingIds.sort((a, b) => a - b);
    
    // Start from 1001 (minimum invoice number)
    let expected = 1001;
    
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] === expected) {
            expected++;
        } else if (sorted[i] > expected) {
            // Found a gap!
            return expected.toString();
        }
    }
    
    // No gaps found, return next number after max
    return (Math.max(...sorted) + 1).toString();
}

// =======================================================================
// FOCUS NEXT FIELD AFTER NEW BUTTON
// =======================================================================
// =======================================================================
// FOCUS NEXT FIELD AFTER NEW BUTTON - FIXED
// =======================================================================
function focusNextFieldAfterNew() {
    // ✅ Cursor ko "Customer Name & No" (custTitle) field par le jayen
    setTimeout(function() {
        const custTitleField = document.getElementById('custTitle');
        if (custTitleField) {
            custTitleField.focus();
            custTitleField.select();
        }
    }, 150); // Slight delay for DOM to settle
}

// =======================================================================
// ENABLE EDIT MODE (New Button) - UPDATED
// =======================================================================
// =======================================================================
// ENABLE EDIT MODE (New Button) - FIXED
// =======================================================================
function enableEditMode() {
    currentMode = 'edit';
    
    // ✅ Reset system with smart invoice generation
    resetSystem(true);
    
    // ✅ All fields ko editable karo
    const fields = getAllEditableFields();
    fields.forEach(field => {
        if (field) {
            field.classList.remove('locked-field');
            field.classList.remove('search-mode-field');
            field.disabled = false;
            field.readOnly = false;
        }
    });
    
    // ✅ Update title
    const title = document.getElementById('mainWindowTitle');
    if (title) {
        if (currentInvoiceType === 'sale') {
            title.textContent = '≡ Sale Invoice Management Panel';
        } else {
            title.textContent = '≡ Return Invoice Management Panel';
        }
    }
    
    // ✅ Update mode indicator
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = '✏️ Edit Mode';
        indicator.className = 'mode-indicator mode-edit';
    }
    
    // ✅ IMPORTANT: Close any open popups
    closeInvoiceSearchPopup();
    closeProductSearchPopup();
    
    // ✅ Cursor automatically "Customer Name & No" field par focus ho ga
    // (focusNextFieldAfterNew() already called in resetSystem)
    
    console.log('✏️ Edit Mode Enabled - Smart Invoice # Generated');
}

// =======================================================================
// UPDATE WINDOW TITLE FUNCTION
// =======================================================================
function updateWindowTitle() {
    const title = document.getElementById('mainWindowTitle');
    if (title) {
        if (currentInvoiceType === 'sale') {
            title.textContent = '≡ Sale Invoice Management Panel';
        } else {
            title.textContent = '≡ Return Invoice Management Panel';
        }
    }
}

// =======================================================================
// INVOICE TYPE - SALE / RETURN FUNCTION
// =======================================================================
function updateInvoiceType() {
    const select = document.getElementById('invoiceType');
    const indicator = document.getElementById('invoiceTypeIndicator');
    const title = document.getElementById('mainWindowTitle');
    
    if (select.value === 'sale') {
        currentInvoiceType = 'sale';
        indicator.textContent = '⬇️';
        indicator.style.color = '#27ae60';
        if (title) title.textContent = '≡ Sale Invoice Management Panel';
    } else {
        currentInvoiceType = 'return';
        indicator.textContent = '⬆️';
        indicator.style.color = '#e74c3c';
        if (title) title.textContent = '≡ Return Invoice Management Panel';
    }
    
    const modeIndicator = document.getElementById('modeIndicator');
    if (modeIndicator && currentMode === 'edit') {
        modeIndicator.textContent = '✏️ Edit Mode';
        modeIndicator.className = 'mode-indicator mode-edit';
    }
}

// =======================================================================
// GET ALL EDITABLE FIELDS
// =======================================================================
function getAllEditableFields() {
    const fields = [
        document.getElementById('invNo'),
        document.getElementById('invDate'),
        document.getElementById('custTitle'),
        document.getElementById('refDate'),
        document.getElementById('custCode'),
        document.getElementById('custType'),
        document.getElementById('safeAC'),
        document.getElementById('saleTitle'),
        document.getElementById('searchProduct'),
        document.getElementById('boxQty'),
        document.getElementById('pieceQty'),
        document.getElementById('itemRate'),
        document.getElementById('itemDisc'),
        document.getElementById('rowAmount')
    ];
    return fields.filter(f => f !== null);
}

// =======================================================================
// GET SEARCH-ONLY FIELDS
// =======================================================================
function getSearchFields() {
    const fields = [
        document.getElementById('invNo'),
        document.getElementById('searchProduct')
    ];
    return fields.filter(f => f !== null);
}

// =======================================================================
// LOCK SYSTEM
// =======================================================================
// =======================================================================
// LOCK SYSTEM - UPDATED
// =======================================================================
function lockSystem() {
    currentMode = 'locked';
    const fields = getAllEditableFields();
    fields.forEach(field => {
        if (field) {
            field.classList.add('locked-field');
            field.classList.remove('search-mode-field');
            field.disabled = true;
            field.readOnly = true;
        }
    });
    
    // ✅ Lock invoice # field
    lockInvoiceNumberField();
    
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = '🔒 Locked';
        indicator.className = 'mode-indicator mode-locked';
    }
    console.log('🔒 System Locked');
}

// =======================================================================
// ENABLE EDIT MODE (New Button)
// =======================================================================
function enableEditMode() {
    currentMode = 'edit';
    
    // ✅ Reset system with smart invoice generation
    resetSystem(true);
    
    // ✅ All fields ko editable karo (except Invoice #)
    const fields = getAllEditableFields();
    fields.forEach(field => {
        if (field && field.id !== 'invNo') {  // ✅ Skip Invoice # field
            field.classList.remove('locked-field');
            field.classList.remove('search-mode-field');
            field.disabled = false;
            field.readOnly = false;
        }
    });
    
    // ✅ LOCK Invoice # field
    lockInvoiceNumberField();
    
    // ✅ Update title
    const title = document.getElementById('mainWindowTitle');
    if (title) {
        if (currentInvoiceType === 'sale') {
            title.textContent = '≡ Sale Invoice Management Panel';
        } else {
            title.textContent = '≡ Return Invoice Management Panel';
        }
    }
    
    // ✅ Update mode indicator
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = '✏️ Edit Mode';
        indicator.className = 'mode-indicator mode-edit';
    }
    
    // ✅ Close any open popups
    closeInvoiceSearchPopup();
    closeProductSearchPopup();
    
    // ✅ Cursor to "Customer Name & No" field
    setTimeout(function() {
        const custTitleField = document.getElementById('custTitle');
        if (custTitleField) {
            custTitleField.focus();
            custTitleField.select();
        }
    }, 150);
    
    console.log('✏️ Edit Mode Enabled - Invoice # Locked');
}

// =======================================================================
// ENABLE SEARCH MODE
// =======================================================================
function enableSearchMode() {
    currentMode = 'search';
    const allFields = getAllEditableFields();
    const searchFields = getSearchFields();
    const searchIds = searchFields.map(f => f ? f.id : '');
    
    allFields.forEach(field => {
        if (searchIds.includes(field.id)) {
            field.classList.remove('locked-field');
            field.classList.add('search-mode-field');
            field.disabled = false;
            field.readOnly = false;
        } else {
            field.classList.add('locked-field');
            field.classList.remove('search-mode-field');
            field.disabled = true;
            field.readOnly = true;
        }
    });
    
    const invNo = document.getElementById('invNo');
    if (invNo) {
        invNo.focus();
        invNo.select();
    }
    
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = '🔍 Search Mode';
        indicator.className = 'mode-indicator mode-search';
    }
    console.log('🔍 Search Mode Enabled');
}

// =======================================================================
// INVOICE SEARCH POPUP - WITH ARROW KEYS NAVIGATION
// =======================================================================

let invoiceSearchFocus = -1;
let invoiceSearchResultsData = [];

// Open Invoice Search Popup
function openInvoiceSearchPopup() {
    const modal = document.getElementById('invoiceSearchModal');
    if (modal) {
        modal.style.display = 'flex';
        const tbody = document.getElementById('invoiceSearchResults');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#95a5a6;">Loading invoices...</td></tr>';
        }
        
        // Reset focus
        invoiceSearchFocus = -1;
        invoiceSearchResultsData = [];
        
        setTimeout(() => {
            const input = document.getElementById('invoiceSearchInput');
            if (input) {
                input.value = '';
                input.focus();
                // Load results automatically
                loadInvoiceSearchResults();
            }
        }, 100);
    }
}

// Close Invoice Search Popup
// Close Invoice Search Popup - UPDATED
function closeInvoiceSearchPopup() {
    const modal = document.getElementById('invoiceSearchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    invoiceSearchFocus = -1;
    invoiceSearchResultsData = [];
}

// =======================================================================
// LOAD INVOICE SEARCH RESULTS - FIXED (Sirf Customer Title)
// =======================================================================
function loadInvoiceSearchResults() {
    const searchInput = document.getElementById('invoiceSearchInput');
    const typeFilter = document.getElementById('invoiceTypeFilter');
    const tbody = document.getElementById('invoiceSearchResults');
    const countEl = document.getElementById('invoiceSearchCount');
    
    if (!tbody || !localDatabase) return;
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterType = typeFilter ? typeFilter.value : 'all';
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#95a5a6;">Loading...</td></tr>';
    
    const tx = localDatabase.transaction("sales_history", "readonly");
    const store = tx.objectStore("sales_history");
    const getAllReq = store.getAll();
    
    getAllReq.onsuccess = function() {
        let invoices = getAllReq.result || [];
        
        // Filter by search term
        if (searchTerm) {
            invoices = invoices.filter(inv => {
                const invNo = String(inv.invoiceId || '').toLowerCase();
                const custName = String(inv.customerName || inv.custTitle || '').toLowerCase();
                const custCode = String(inv.customerCode || '').toLowerCase();
                return invNo.includes(searchTerm) || 
                       custName.includes(searchTerm) || 
                       custCode.includes(searchTerm);
            });
        }
        
        // Filter by type
        if (filterType !== 'all') {
            invoices = invoices.filter(inv => (inv.invoiceType || 'sale') === filterType);
        }
        
        // Sort by date (newest first)
        invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Store for keyboard navigation
        invoiceSearchResultsData = invoices;
        invoiceSearchFocus = -1;
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#95a5a6;">No invoices found</td></tr>';
            if (countEl) countEl.textContent = '0';
            return;
        }
        
        let html = '';
        invoices.forEach((inv, index) => {
            const invType = inv.invoiceType || 'sale';
            const typeBadge = invType === 'sale' 
                ? '<span style="color:#27ae60; font-weight:bold;">💰 Sale</span>' 
                : '<span style="color:#e74c3c; font-weight:bold;">🔄 Return</span>';
            
            let billAmount = inv.netTotal;
            if (billAmount === undefined) {
                const gross = inv.items ? inv.items.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
                const prev = parseFloat(inv.previousBalance) || 0;
                const cash = parseFloat(inv.cashReceived) || 0;
                billAmount = Math.round((gross + prev) - cash);
            }
            
            const dateFormatted = inv.date ? inv.date.split('-').reverse().join('/') : '';
            
            // ✅ FIX: SIRF "Customer Title" (customerName) se uthayein
            let customerDisplay = '';
            
            // ✅ Priority 1: customerName (Customer Title field)
            if (inv.customerName && inv.customerName.trim() !== '') {
                customerDisplay = inv.customerName;
            }
            // ✅ Priority 2: custTitle (fallback)
            else if (inv.custTitle && inv.custTitle.trim() !== '') {
                customerDisplay = inv.custTitle;
            }
            // ✅ Priority 3: customerDetailsName (Last resort - but only if no customerName)
            else if (inv.customerDetailsName && inv.customerDetailsName.trim() !== '') {
                customerDisplay = inv.customerDetailsName;
            }
            // ✅ Priority 4: customerCode (last resort)
            else if (inv.customerCode && inv.customerCode.trim() !== '') {
                customerDisplay = inv.customerCode;
            }
            // Default
            else {
                customerDisplay = 'Walking Customer';
            }
            
            // ✅ Clean: Sirf name rakhein, [code] hatayein
            if (customerDisplay.includes('[')) {
                customerDisplay = customerDisplay.split('[')[0].trim();
            }
            
            // ✅ Clean: Agar number hai aur name nahi, toh "Walking Customer"
            if (customerDisplay.match(/^[0-9]+$/) && customerDisplay.length > 5) {
                customerDisplay = 'Walking Customer';
            }
            
            // ✅ Clean: Agar "0306" se start ho raha hai toh "Walking Customer"
            if (customerDisplay.startsWith('0306') || customerDisplay.startsWith('03')) {
                customerDisplay = 'Walking Customer';
            }
            
            // ✅ Final: Agar empty hai toh default
            if (!customerDisplay || customerDisplay.trim() === '') {
                customerDisplay = 'Walking Customer';
            }
            
            html += `<tr id="invoiceRow_${index}" 
                        data-index="${index}"
                        data-invoice="${inv.invoiceId}"
                        style="border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" 
                        onclick="loadInvoiceFromSearch('${inv.invoiceId}')"
                        onmouseover="highlightInvoiceRow(${index})"
                        onmouseout="unhighlightInvoiceRow(${index})">
                <td style="padding: 8px; font-weight: bold; color: #2c3e50;">${inv.invoiceId}</td>
                <td style="padding: 8px;">${dateFormatted}</td>
                <td style="padding: 8px;">${typeBadge}</td>
                <td style="padding: 8px; text-align:left; font-weight: 500;">${customerDisplay}</td>
                <td style="padding: 8px; text-align:right; font-weight: bold; color: ${invType === 'sale' ? '#27ae60' : '#e74c3c'};">${Number(billAmount).toLocaleString()}</td>
                <td style="padding: 8px;">
                    <button style="padding: 3px 12px; background: #2980b9; color: white; border: none; cursor: pointer; border-radius: 2px; font-size: 11px; font-weight: bold;" 
                            onclick="event.stopPropagation(); loadInvoiceFromSearch('${inv.invoiceId}')">📂 Load</button>
                </td>
            </tr>`;
        });
        
        tbody.innerHTML = html;
        if (countEl) countEl.textContent = invoices.length;
    };
    
    getAllReq.onerror = function() {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#e74c3c;">Error loading invoices</td></tr>';
    };
}

// =======================================================================
// INVOICE SEARCH KEYBOARD NAVIGATION
// =======================================================================

// Highlight invoice row
function highlightInvoiceRow(index) {
    // Remove all highlights
    document.querySelectorAll('#invoiceSearchResults tr').forEach(row => {
        row.style.backgroundColor = '';
    });
    
    // Highlight this row
    const row = document.getElementById(`invoiceRow_${index}`);
    if (row) {
        row.style.backgroundColor = '#3498db';
        invoiceSearchFocus = index;
    }
}

// Unhighlight invoice row
function unhighlightInvoiceRow(index) {
    // Only remove if this is the current focus
    if (invoiceSearchFocus === index) {
        const row = document.getElementById(`invoiceRow_${index}`);
        if (row && !row.classList.contains('active')) {
            row.style.backgroundColor = '';
        }
    }
}

// Keyboard navigation for invoice search
function setupInvoiceSearchKeyboard() {
    const searchInput = document.getElementById('invoiceSearchInput');
    const typeFilter = document.getElementById('invoiceTypeFilter');
    
    if (searchInput) {
        // Search on input
        searchInput.addEventListener('input', function() {
            invoiceSearchFocus = -1;
            loadInvoiceSearchResults();
        });
        
        // Keyboard events
        searchInput.addEventListener('keydown', function(e) {
            const rows = document.querySelectorAll('#invoiceSearchResults tr');
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none' && row.id);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (visibleRows.length === 0) return;
                invoiceSearchFocus++;
                if (invoiceSearchFocus >= visibleRows.length) invoiceSearchFocus = 0;
                updateInvoiceHighlight(visibleRows);
            } 
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (visibleRows.length === 0) return;
                invoiceSearchFocus--;
                if (invoiceSearchFocus < 0) invoiceSearchFocus = visibleRows.length - 1;
                updateInvoiceHighlight(visibleRows);
            } 
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (invoiceSearchFocus > -1 && visibleRows[invoiceSearchFocus]) {
                    const invoiceId = visibleRows[invoiceSearchFocus].getAttribute('data-invoice');
                    if (invoiceId) {
                        loadInvoiceFromSearch(invoiceId);
                    }
                } else if (visibleRows.length === 1) {
                    // If only one result, select it directly
                    const invoiceId = visibleRows[0].getAttribute('data-invoice');
                    if (invoiceId) {
                        loadInvoiceFromSearch(invoiceId);
                    }
                }
            }
            else if (e.key === 'Escape') {
                closeInvoiceSearchPopup();
            }
        });
    }
    
    // Also add keyboard support for type filter
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            invoiceSearchFocus = -1;
            loadInvoiceSearchResults();
        });
    }
}

// Update highlight for keyboard navigation
function updateInvoiceHighlight(rows) {
    // Remove all highlights
    rows.forEach(row => {
        row.style.backgroundColor = '';
        row.classList.remove('active');
    });
    
    // Highlight current
    if (rows[invoiceSearchFocus]) {
        const row = rows[invoiceSearchFocus];
        row.style.backgroundColor = '#eaf2f8';
        row.classList.add('active');
        row.scrollIntoView({ block: 'nearest' });
    }
}

// Load Invoice from Search Result
// =======================================================================
// LOAD INVOICE FROM SEARCH - FIXED VERSION
// =======================================================================
function loadInvoiceFromSearch(invoiceId) {
    if (!invoiceId || !localDatabase) return;
    
    const tx = localDatabase.transaction("sales_history", "readonly");
    const store = tx.objectStore("sales_history");
    const getReq = store.get(invoiceId);
    
    getReq.onsuccess = function() {
        if (getReq.result) {
            closeInvoiceSearchPopup();
            
            // ✅ Use the fixed fetchOldInvoice
            fetchOldInvoice(invoiceId);
            
            // ✅ Show success message
            showToast('✅ Invoice #' + invoiceId + ' loaded successfully!', 'success');
        } else {
            alert("Invoice #" + invoiceId + " not found!");
        }
    };
    
    getReq.onerror = function() {
        alert("Error loading invoice!");
    };
}

// =======================================================================
// NEW: TOAST NOTIFICATION FUNCTION
// =======================================================================
function showToast(message, type = 'info') {
    // Check if toast container exists
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#2980b9'
    };
    
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        cursor: default;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Add CSS animation for toast
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(styleSheet);

// =======================================================================
// NAVIGATION DROPDOWN MODAL POPUP
// =======================================================================
document.addEventListener("DOMContentLoaded", function() {
    const targetReports = ["Dashboard", "Coding", "Invoice", "Accounts", "Accounts Reports", "Inventory Reports", "System"];
    
    document.body.addEventListener("click", function(event) {
        let clickedElement = event.target;
        let rawText = clickedElement.textContent ? clickedElement.textContent.trim() : "";
        let cleanText = rawText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();

        if (targetReports.includes(cleanText)) {
            if (clickedElement.classList.contains('nav-item') || clickedElement.closest('.top-nav')) {
                event.preventDefault();
                event.stopPropagation();
                openReportModal(cleanText);
            }
        }
    });

    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('popupStartDate')) document.getElementById('popupStartDate').value = today;
    if(document.getElementById('popupEndDate')) document.getElementById('popupEndDate').value = today;
});

function openReportModal(reportName) {
    currentActiveReport = reportName;
    const modalEl = document.getElementById("reportModal");
    const modalTitle = document.getElementById("modalReportTitle");
    
    if (!modalEl) {
        console.error("Error: 'reportModal' element index.html mein nahi mila!");
        alert("Report Popup Modal ka HTML code index.html mein missing hai!");
        return;
    }

    if (modalTitle) {
        modalTitle.textContent = reportName + " - Date Filter";
    }
    
    modalEl.style.display = "flex";
}

function closeReportModal() {
    const modalEl = document.getElementById("reportModal");
    if(modalEl) {
        modalEl.style.display = "none";
    }
}

// =======================================================================
// REPORT GENERATION LOGIC
// =======================================================================
function handleReportView() {
    const startDate = document.getElementById("popupStartDate").value;
    const endDate = document.getElementById("popupEndDate").value;

    if (!startDate || !endDate) {
        alert("Meharbani karke Start aur End Date select karein!");
        return;
    }

    let sParts = startDate.split("-");
    let displayStart = `${sParts[2]}/${sParts[1]}/${sParts[0]}`;
    let eParts = endDate.split("-");
    let displayEnd = `${eParts[2]}/${eParts[1]}/${eParts[0]}`;

    closeReportModal();

    const dbName = "CapriTradingDB";
    const storeName = "sales_history";

    let request = indexedDB.open(dbName);
    
    request.onsuccess = function(event) {
        let db = event.target.result;
        
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Store '${storeName}' nahi mila, fallback to first available store.`);
            let fallbackStore = db.objectStoreNames[0];
            if (!fallbackStore) {
                compileLiveAndDbReports([], displayStart, displayEnd, startDate, endDate);
                return;
            }
            fetchDataFromStore(db, fallbackStore, displayStart, displayEnd, startDate, endDate);
            return;
        }
        
        fetchDataFromStore(db, storeName, displayStart, displayEnd, startDate, endDate);
    };

    request.onerror = function() {
        console.error("CapriTradingDB open karne mein error.");
        compileLiveAndDbReports([], displayStart, displayEnd, startDate, endDate);
    };
}

function fetchDataFromStore(db, storeName, displayStart, displayEnd, startDate, endDate) {
    let transaction = db.transaction(storeName, "readonly");
    let objectStore = transaction.objectStore(storeName);
    let getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function() {
        let dbRecords = getAllRequest.result || [];
        compileLiveAndDbReports(dbRecords, displayStart, displayEnd, startDate, endDate);
    };

    getAllRequest.onerror = function() {
        compileLiveAndDbReports([], displayStart, displayEnd, startDate, endDate);
    };
}

function compileLiveAndDbReports(dbRecords, displayStart, displayEnd, startRaw, endRaw) {
    let allInvoicesList = [...dbRecords];

    let currentInvoice = {
        invNo: document.getElementById("invNo") ? document.getElementById("invNo").value : "",
        invDate: document.getElementById("invDate") ? document.getElementById("invDate").value : "",
        custTitle: document.getElementById("custTitle") ? document.getElementById("custTitle").value : "TILE MART",
        custCode: document.getElementById("custCode") ? document.getElementById("custCode").value : "030603010004",
        calcGross: document.getElementById("calcGross") ? document.getElementById("calcGross").value : "0",
        calcCashRec: document.getElementById("calcCashRec") ? document.getElementById("calcCashRec").value : "0",
        calcNetTotal: document.getElementById("calcNetTotal") ? document.getElementById("calcNetTotal").value : "0",
        items: []
    };

    const tableRows = document.querySelectorAll("#invoiceTable tbody tr, table tr");
    tableRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5 && !row.closest('.report-header')) {
            let code = cells[0].textContent.trim();
            if(code && !isNaN(code)) {
                currentInvoice.items.push({
                    code: code,
                    name: cells[1] ? cells[1].textContent.trim() : "",
                    boxQty: cells[2] ? cells[2].textContent.trim() : "0",
                    pieceQty: cells[3] ? cells[3].textContent.trim() : "0",
                    itemRate: cells[4] ? cells[4].textContent.trim() : "0",
                    rowAmount: cells[5] ? cells[5].textContent.trim() : "0"
                });
            }
        }
    });

    if (currentInvoice.items.length > 0 && currentInvoice.invNo) {
        if (!allInvoicesList.some(inv => (inv.invNo == currentInvoice.invNo || inv.invoiceNo == currentInvoice.invNo || inv.billNo == currentInvoice.invNo))) {
            allInvoicesList.push(currentInvoice);
        }
    }

    let filteredInvoices = allInvoicesList.filter(inv => {
        let rawDate = inv.invDate || inv.invoiceDate || inv.date || inv.billDate || "";
        if (!rawDate) return false;
        
        let cleanInvDate = rawDate.toString().trim();
        let normalizedDate = "";

        if (cleanInvDate.includes("/")) {
            let parts = cleanInvDate.split("/");
            if (parts[2] && parts[2].length === 4) {
                normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } else if (cleanInvDate.includes("-")) {
            let parts = cleanInvDate.split("-");
            if (parts[0].length === 4) {
                normalizedDate = cleanInvDate;
            } else {
                normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        if (!normalizedDate) return false;
        return normalizedDate >= startRaw && normalizedDate <= endRaw;
    });

    if (filteredInvoices.length === 0 && allInvoicesList.length > 0) {
        filteredInvoices = allInvoicesList;
    }

    let reportSpecificHtml = "";
    let reportColor = "#1a365d";

    switch(currentActiveReport) {
        case "Dashboard":
            reportColor = "#2c3e50";
            let totalSales = 0;
            let totalCash = 0;
            filteredInvoices.forEach(inv => {
                let currentNet = inv.calcNetTotal || inv.netTotal || inv.netAmount || inv.calcGross || inv.grossAmount || 0;
                totalSales += parseFloat(currentNet);
                totalCash += parseFloat(inv.calcCashRec || inv.cashReceived || 0);
            });

            reportSpecificHtml = `
                <div class="metrics-grid">
                    <div class="card"><h3>Total Sales</h3><p>Rs. ${totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p></div>
                    <div class="card"><h3>Total Cash Received</h3><p>Rs. ${totalCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p></div>
                    <div class="card"><h3>Active Invoices Count</h3><p>${filteredInvoices.length}</p></div>
                </div>
                <div class="content-box">
                    <strong>📊 Executive Summary Status Report</strong><br><br>
                    Live business analysis dashboard tracking synchronized from CapriTradingDB -> sales_history successfully.
                </div>`;
            break;

        case "Invoice":
            reportColor = "#2980b9";
            let invoiceRows = "";
            if (filteredInvoices.length === 0) {
                invoiceRows = `<tr><td colspan="5" style="text-align:center; color:#777;">No records found for the period ${displayStart} to ${displayEnd}</td></tr>`;
            } else {
                filteredInvoices.forEach((inv, index) => {
                    let finalInvNo = inv.invNo || inv.invoiceNo || inv.billNo || inv.invoiceNum || inv.id;
                    if (!finalInvNo || finalInvNo === "N/A") {
                        let keys = Object.keys(inv);
                        for (let k of keys) {
                            if ((k.toLowerCase().includes('no') || k.toLowerCase().includes('num') || k.toLowerCase().includes('id')) && inv[k]) {
                                finalInvNo = inv[k];
                                break;
                            }
                        }
                    }
                    if (!finalInvNo) {
                        finalInvNo = (1000 + index + 1).toString();
                    }

                    let finalDate = inv.invDate || inv.invoiceDate || inv.date || inv.billDate || displayStart;
                    let finalNet = inv.calcNetTotal || inv.netTotal || inv.netAmount || "0.00";
                    let finalGross = inv.calcGross || inv.grossAmount || inv.gross || "0.00"; 
                    if (parseFloat(finalGross) === 0 && parseFloat(finalNet) > 0) {
                        finalGross = finalNet;
                    }

                    invoiceRows += `
                    <tr>
                        <td style="font-weight: bold; color: #2c3e50;">${finalInvNo}</td>
                        <td>${finalDate}</td>
                        <td>${inv.custTitle || inv.customerName || 'Walking Customer'}</td>
                        <td style="text-align:right;">Rs. ${parseFloat(finalGross).toFixed(2)}</td>
                        <td style="text-align:right; font-weight:bold; color: #2980b9;">Rs. ${parseFloat(finalNet).toFixed(2)}</td>
                    </tr>`;
                });
            }

            reportSpecificHtml = `
                <div class="content-box" style="border:none; padding:0;">
                    <strong>🧾 Sales Invoice Registry Counter</strong><br><br>
                    <table class="report-data-table">
                        <thead>
                            <tr><th>Invoice #</th><th>Date</th><th>Customer Title</th><th style="text-align:right;">Gross Amount</th><th style="text-align:right;">Net Total</th></tr>
                        </thead>
                        <tbody>
                            ${invoiceRows}
                        </tbody>
                    </table>
                </div>`;
            break;

        case "Accounts Reports":
            reportColor = "#8e44ad";
            let accountRows = "";
            let accountsMap = {};

            filteredInvoices.forEach(inv => {
                let title = inv.custTitle || inv.customerName || "General Sale";
                if (!accountsMap[title]) {
                    accountsMap[title] = { code: inv.custCode || '---', sale: 0, cash: 0, net: 0 };
                }
                let currentNet = inv.calcNetTotal || inv.netTotal || inv.netAmount || 0;
                let currentGross = inv.calcGross || inv.grossAmount || currentNet;
                if(parseFloat(currentGross) === 0 && parseFloat(currentNet) > 0) currentGross = currentNet;
                
                accountsMap[title].sale += parseFloat(currentGross);
                accountsMap[title].cash += parseFloat(inv.calcCashRec || inv.cashReceived || 0);
                accountsMap[title].net += parseFloat(currentNet);
            });

            let keys = Object.keys(accountsMap);
            if(keys.length === 0) {
                accountRows = `<tr><td colspan="5" style="text-align:center; color:#777;">No transaction history for accounts.</td></tr>`;
            } else {
                keys.forEach(k => {
                    accountRows += `
                    <tr>
                        <td>${accountsMap[k].code}</td>
                        <td>${k}</td>
                        <td style="text-align:right; color:#27ae60;">Rs. ${accountsMap[k].sale.toFixed(2)}</td>
                        <td style="text-align:right; color:#c0392b;">Rs. ${accountsMap[k].cash.toFixed(2)}</td>
                        <td style="text-align:right; font-weight:bold;">Rs. ${accountsMap[k].net.toFixed(2)}</td>
                    </tr>`;
                });
            }

            reportSpecificHtml = `
                <div class="content-box" style="border:none; padding:0;">
                    <strong>📊 Financial Accounts Ledger Summary</strong><br><br>
                    <table class="report-data-table">
                        <thead>
                            <tr><th>Account Code</th><th>Party Name</th><th style="text-align:right;">Total Debit (Sale)</th><th style="text-align:right;">Total Credit (Cash)</th><th style="text-align:right;">Net Balance</th></tr>
                        </thead>
                        <tbody>
                            ${accountRows}
                        </tbody>
                    </table>
                </div>`;
            break;

        case "Inventory Reports":
            reportColor = "#d35400";
            let stockMap = {};
            filteredInvoices.forEach(inv => {
                if(inv.items && Array.isArray(inv.items)) {
                    inv.items.forEach(item => {
                        let code = item.code || '---';
                        if(!stockMap[code]) {
                            stockMap[code] = { name: item.name || 'Product', boxes: 0, pcs: 0 };
                        }
                        stockMap[code].boxes += parseInt(item.boxQty || 0);
                        stockMap[code].pcs += parseInt(item.pieceQty || 0);
                    });
                }
            });

            let stockKeys = Object.keys(stockMap);
            let inventoryRows = "";
            if(stockKeys.length === 0) {
                inventoryRows = `<tr><td colspan="4" style="text-align:center; color:#777;">No stock movement records registered in this timeline.</td></tr>`;
            } else {
                stockKeys.forEach(sk => {
                    inventoryRows += `
                    <tr>
                        <td>${sk}</td>
                        <td>${stockMap[sk].name}</td>
                        <td style="text-align:center; font-weight:bold; color:#d35400;">${stockMap[sk].boxes} Box</td>
                        <td style="text-align:center; font-weight:bold; color:#e67e22;">${stockMap[sk].pcs} Pcs</td>
                    </tr>`;
                });
            }

            reportSpecificHtml = `
                <div class="content-box" style="border:none; padding:0;">
                    <strong>📦 Inventory Items Despatch Log</strong><br><br>
                    <table class="report-data-table">
                        <thead>
                            <tr><th>Item Code</th><th>Product Description</th><th style="text-align:center;">Total Out Boxes</th><th style="text-align:center;">Total Out Pieces</th></tr>
                        </thead>
                        <tbody>
                            ${inventoryRows}
                        </tbody>
                    </table>
                </div>`;
            break;

        default:
            reportSpecificHtml = `<div class="content-box">Data selection parameters completed.</div>`;
    }

    const windowName = "CapriReportTargetTab";
    let reportWindow = window.open("", windowName);

    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Capri Trading - ${currentActiveReport} Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 30px; font-size: 12px; color: #000; line-height: 1.4; position: relative; }
            .report-header { text-align: center; margin-bottom: 25px; border-bottom: 3px double ${reportColor}; padding-bottom: 12px; }
            .company-name { font-size: 22px; font-weight: bold; color: ${reportColor}; letter-spacing: 1px; }
            .report-title { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-top: 5px; color: #333; }
            .date-range { font-size: 12px; margin-top: 5px; font-weight: bold; color: #555; }
            .action-bar { display: flex; gap: 10px; margin-bottom: 15px; }
            .btn-update { background: #27ae60; color: white; border: none; padding: 6px 14px; font-size: 11px; font-weight: bold; border-radius: 3px; cursor: pointer; text-transform: uppercase; }
            .btn-update:hover { background: #219653; }
            .metrics-grid { display: flex; gap: 15px; margin-bottom: 20px; }
            .card { flex: 1; border: 1px solid #ccc; padding: 12px; border-radius: 4px; text-align: center; background: #fdfdfd; }
            .card h3 { margin: 0 0 5px 0; font-size: 11px; color: #555; text-transform: uppercase; }
            .card p { margin: 0; font-size: 16px; font-weight: bold; color: ${reportColor}; }
            .content-box { margin-top: 15px; padding: 20px; border: 1px solid #95a5a6; background: #fafafa; border-radius: 4px; }
            .report-data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .report-data-table th { background: ${reportColor}; color: white; padding: 8px 6px; font-size: 11px; border: 1px solid #444; text-align: left; }
            .report-data-table td { padding: 8px 6px; border: 1px solid #ddd; text-align: left; font-size: 11px; }
            .footer { margin-top: 80px; text-align: center; font-size: 10px; border-top: 1px dashed #aaa; padding-top: 8px; color: #666; }
            @media print { .no-print { display: none !important; } body { margin: 10px; } }
        </style>
    </head>
    <body>
        <div class="action-bar no-print">
            <button class="btn-update" onclick="triggerMainSync()">🔄 Update Live Data</button>
        </div>

        <div class="report-header">
            <div class="company-name">CAPRI TRADING SYSTEM</div>
            <div class="report-title">${currentActiveReport} Ledger Module</div>
            <div class="date-range">Statement Period: ${displayStart} To ${displayEnd}</div>
        </div>

        ${reportSpecificHtml}

        <div class="footer">
            Automated Report System - Generated on ${new Date().toLocaleDateString('en-GB')} - CapriTradingDB Node Engine
        </div>

        <script>
            function triggerMainSync() {
                if (window.opener && !window.opener.closed) {
                    const mainBtn = window.opener.document.querySelector("button[onclick*='Report'], .btn-report");
                    if(mainBtn) {
                        mainBtn.click();
                    } else {
                        alert("Peeche main window par report filter selection dubaara active karein.");
                    }
                } else {
                    alert("Main software window close ho chuki hai!");
                }
            }
        </script>
    </body>
    </html>`;

    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
}

// =======================================================================
// ACCOUNT LEDGER ENGINE
// =======================================================================
document.addEventListener("DOMContentLoaded", function() {
    const menuBtn = document.getElementById("accountsReportsMenuBtn");
    const dropdownMenu = document.getElementById("accountsReportsDropdown");

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
        });
    }

    document.addEventListener("click", function(e) {
        if (dropdownMenu && e.target !== menuBtn && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = "none";
        }
    });
});

function openAccountLedgerModal() {
    document.getElementById("accountsReportsDropdown").style.display = "none";
    const modal = document.getElementById("accountLedgerModal");
    
    const codeSelect = document.getElementById("ledgerPopupCode");
    const titleSelect = document.getElementById("ledgerPopupTitle");
    
    codeSelect.innerHTML = "";
    titleSelect.innerHTML = "";
    
    customerDatabase.forEach(cust => {
        let optCode = document.createElement("option");
        optCode.value = cust.code;
        optCode.textContent = cust.code;
        codeSelect.appendChild(optCode);
        
        let optTitle = document.createElement("option");
        optTitle.value = cust.code;
        optTitle.textContent = cust.name;
        titleSelect.appendChild(optTitle);
    });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("ledgerPopupFromDate").value = today;
    document.getElementById("ledgerPopupToDate").value = today;
    
    modal.style.display = "flex";
}

function closeAccountLedgerModal() {
    document.getElementById("accountLedgerModal").style.display = "none";
}

function syncLedgerPopupFields(triggerSource) {
    const codeSelect = document.getElementById("ledgerPopupCode");
    const titleSelect = document.getElementById("ledgerPopupTitle");
    
    if (triggerSource === 'code') {
        titleSelect.value = codeSelect.value;
    } else {
        codeSelect.value = titleSelect.value;
    }
}

function generateLiveLedgerTab() {
    const selectedCode = document.getElementById("ledgerPopupCode").value;
    const selectedTitle = document.getElementById("ledgerPopupTitle").options[document.getElementById("ledgerPopupTitle").selectedIndex].text;
    const fromDateRaw = document.getElementById("ledgerPopupFromDate").value; 
    const toDateRaw = document.getElementById("ledgerPopupToDate").value;     
    
    if (!fromDateRaw || !toDateRaw) {
        alert("Meharbani karke dono dates select karein!");
        return;
    }
    
    const ledgerTabWindow = window.open("", "CapriLedgerTabTargetWindow");
    
    let fParts = fromDateRaw.split("-");
    let displayFrom = fParts[2] + "/" + fParts[1] + "/" + fParts[0];
    let tParts = toDateRaw.split("-");
    let displayTo = tParts[2] + "/" + tParts[1] + "/" + tParts[0];
    const todayPrintDate = new Date().toLocaleDateString('en-GB');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Account Ledger - ${selectedTitle}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; color: #000; }
            .company-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 2px; letter-spacing:0.5px;}
            .company-address { text-align: center; font-size: 11px; margin-bottom: 2px; font-weight: bold; color: #333;}
            .doc-identity { text-align: center; font-size: 13px; font-weight: bold; color: #722f37; text-decoration: underline; margin-bottom: 20px;}
            .meta-summary { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; font-weight: bold;}
            .meta-block { display: flex; flex-direction: column; gap: 4px; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .ledger-table th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 4px; font-size: 12px; font-weight: bold; background: #566573; color: white;}
            .ledger-table td { border-bottom: 1px solid #ddd; padding: 6px 4px; font-size: 12px; text-align: center;}
            .grand-total-row td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; color: #4a154b; padding: 8px 4px;}
            .no-print-bar { display: flex; gap: 10px; margin-bottom: 20px; background: #eaeaea; padding: 8px; border-radius:3px;}
            .btn-refresh { background: #2e4053; color: white; border: none; padding: 6px 15px; font-weight: bold; cursor: pointer; border-radius: 2px;}
            .sale-type { font-size: 10px; padding: 1px 6px; border-radius: 2px; font-weight: bold; }
            .sale-type.sale { color: #27ae60; background: #d5f5e3; }
            .sale-type.return { color: #e74c3c; background: #fdedec; }
            @media print { .no-print-bar { display: none !important; } margin: 20px; }
        </style>
    </head>
    <body>
        <div class="no-print-bar">
            <button class="btn-refresh" onclick="loadLiveLedgerData()">🔄 Refresh / Sync Data</button>
            <button class="btn-refresh" style="background:#27ae60;" onclick="window.print()">🖨️ Print Ledger</button>
        </div>

        <div style="float: right; font-weight: bold;">Print Date: &nbsp; ${todayPrintDate}</div>
        <div class="company-title">CAPRI SANITARY</div>
        <div class="company-address">DERRA ADDA HASSAN PARWANA ROAD MULTAN</div>
        <div class="doc-identity">Account Ledger</div>

        <div class="meta-summary">
            <div class="meta-block" style="width: 50%;">
                <div>Account: &nbsp; <span style="font-weight:normal;">${selectedCode}</span></div>
                <div>From: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight:normal;">${displayFrom}</span></div>
            </div>
            <div class="meta-block" style="width: 50%; padding-left: 50px;">
                <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${selectedTitle}</div>
                <div>To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight:normal;">${displayTo}</span></div>
            </div>
        </div>

        <table class="ledger-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 12%;">Voucher#</th>
                    <th style="width: 8%;">Type</th>
                    <th style="text-align:left; padding-left:5px; width: 30%;">Narration</th>
                    <th style="width: 12%; text-align:right; padding-right:5px;">Debit (Sale)</th>
                    <th style="width: 12%; text-align:right; padding-right:5px;">Credit (Return)</th>
                    <th style="width: 16%; text-align:right; padding-right:5px;">Balance</th>
                </tr>
            </thead>
            <tbody id="ledgerTableBody"></tbody>
        </table>

        <script>
            function loadLiveLedgerData() {
                const dbRequest = indexedDB.open("CapriTradingDB", 1);
                
                dbRequest.onerror = function() {
                    alert("Database connection open karne mein masla aa raha hai.");
                };
                
                dbRequest.onsuccess = function(event) {
                    const db = event.target.result;
                    if(!db) { 
                        alert("Database connect nahi ho paya."); 
                        return; 
                    }
                    
                    const code = "${selectedCode}";
                    const fromDateRaw = "${fromDateRaw}";
                    const toDateRaw = "${toDateRaw}";
                    
                    const tx = db.transaction("sales_history", "readonly");
                    const store = tx.objectStore("sales_history");
                    const getAllReq = store.getAll();
                    
                    getAllReq.onsuccess = function() {
                        let dbRecords = getAllReq.result || [];
                        let partyInvoices = dbRecords.filter(function(inv) {
                            if (inv.customerCode !== code) return false;
                            let rawDate = inv.date || "";
                            if (!rawDate) return false;
                            let checkDate = "";
                            if (rawDate.includes("-")) {
                                let parts = rawDate.split("-");
                                checkDate = parts[0].length === 4 ? rawDate : parts[2] + "-" + parts[1] + "-" + parts[0];
                            } else if (rawDate.includes("/")) {
                                let parts = rawDate.split("/");
                                checkDate = parts[2] + "-" + parts[1] + "-" + parts[0];
                            }
                            return checkDate >= fromDateRaw && checkDate <= toDateRaw;
                        });
                        
                        partyInvoices.sort(function(a,b) { 
                            return new Date(a.date) - new Date(b.date); 
                        });
                        
                        let runningBalance = 1998920;
                        let totalDebitSum = 1998920;
                        let totalCreditSum = 0;
                        
                        let tableHtml = '<tr style="height:25px;"><td>${displayFrom}</td><td>BO</td><td></td><td style="text-align:left; padding-left:5px;">Opening Balance</td><td style="text-align:right; padding-right:5px;">1,998,920.00</td><td style="text-align:right; padding-right:5px;"></td><td style="text-align:right; padding-right:5px; font-weight:bold;">1,998,920 Dr</td></tr>';
                        
                        partyInvoices.forEach(function(inv) {
                            let invoiceType = inv.invoiceType || 'sale';
                            
                            let debitAmount = 0;
                            let creditAmount = 0;
                            
                            if(inv.items && Array.isArray(inv.items)) {
                                debitAmount = inv.items.reduce(function(sum, item) { 
                                    return sum + (parseFloat(item.amount) || 0); 
                                }, 0);
                            } else { 
                                debitAmount = parseFloat(inv.netTotal) || 0; 
                            }
                            
                            if (invoiceType === 'return') {
                                creditAmount = debitAmount;
                                debitAmount = 0;
                            }
                            
                            runningBalance = (runningBalance + debitAmount) - creditAmount;
                            totalDebitSum += debitAmount;
                            totalCreditSum += creditAmount;
                            
                            let dateFormatted = inv.date;
                            if(dateFormatted.includes("-")) {
                                let parts = dateFormatted.split("-");
                                dateFormatted = parts[2] + "/" + parts[1] + "/" + parts[0];
                            }
                            
                            let typeBadge = invoiceType === 'sale' 
                                ? '<span class="sale-type sale">Sale</span>' 
                                : '<span class="sale-type return">Return</span>';
                            
                            let narration = invoiceType === 'sale' 
                                ? 'Sale bill S-' + inv.invoiceId 
                                : 'Return bill R-' + inv.invoiceId;
                            
                            tableHtml += '<tr style="height:25px;">' +
                                '<td>' + dateFormatted + '</td>' +
                                '<td>' + (invoiceType === 'sale' ? 'S-JV' : 'R-JV') + inv.invoiceId + '</td>' +
                                '<td>' + typeBadge + '</td>' +
                                '<td style="text-align:left; padding-left:5px;">' + narration + '</td>' +
                                '<td style="text-align:right; padding-right:5px;">' + (debitAmount > 0 ? debitAmount.toLocaleString('en-US', {minimumFractionDigits: 2}) : "") + '</td>' +
                                '<td style="text-align:right; padding-right:5px;">' + (creditAmount > 0 ? creditAmount.toLocaleString('en-US', {minimumFractionDigits: 2}) : "") + '</td>' +
                                '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + Math.round(runningBalance).toLocaleString() + ' Dr</td>' +
                                '</tr>';
                        });
                        
                        tableHtml += '<tr class="grand-total-row">' +
                            '<td colspan="4" style="text-align: right; font-weight: bold; padding-right: 30px; color:#4a154b;">Grand Total</td>' +
                            '<td style="text-align: right; padding-right: 5px;">' + totalDebitSum.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>' +
                            '<td style="text-align: right; padding-right: 5px;">' + (totalCreditSum > 0 ? totalCreditSum.toLocaleString('en-US', {minimumFractionDigits: 2}) : "0.00") + '</td>' +
                            '<td style="text-align: right; padding-right: 5px; font-weight: bold;">' + Math.round(runningBalance).toLocaleString() + ' Dr</td>' +
                            '</tr>';
                            
                        document.getElementById("ledgerTableBody").innerHTML = tableHtml;
                    };
                };
            }
            window.onload = loadLiveLedgerData;
        </script>
    </body>
    </html>`;

    ledgerTabWindow.document.open();
    ledgerTabWindow.document.write(htmlContent);
    ledgerTabWindow.document.close();
}

// =======================================================================
// INVENTORY ENGINE
// =======================================================================
function openInventoryLedgerModalDirect() {
    const drop = document.getElementById("accountsReportsDropdown");
    if(drop) drop.style.display = "none";
    
    const modal = document.getElementById("inventoryLedgerModal");
    const codeSelect = document.getElementById("invPopupCode");
    const titleSelect = document.getElementById("invPopupTitle");
    
    codeSelect.innerHTML = "";
    titleSelect.innerHTML = "";
    
    let blankCodeOpt = document.createElement("option");
    blankCodeOpt.value = "BLANK_ALL";
    blankCodeOpt.textContent = " "; 
    codeSelect.appendChild(blankCodeOpt);
    
    let blankTitleOpt = document.createElement("option");
    blankTitleOpt.value = "BLANK_ALL";
    blankTitleOpt.textContent = " "; 
    titleSelect.appendChild(blankTitleOpt);
    
    const dbRequest = indexedDB.open("CapriTradingDB", 1);
    
    dbRequest.onsuccess = function(event) {
        const db = event.target.result;
        try {
            const itemTx = db.transaction("items", "readonly");
            const itemStore = itemTx.objectStore("items");
            const itemReq = itemStore.getAll();
            
            itemReq.onsuccess = function() {
                let dbItems = itemReq.result || [];
                
                if(dbItems.length === 0 && typeof itemMasterStock !== 'undefined') {
                    dbItems = itemMasterStock;
                }
                
                dbItems.forEach(item => {
                    let optCode = document.createElement("option");
                    optCode.value = item.code;
                    optCode.textContent = item.code;
                    codeSelect.appendChild(optCode);
                    
                    let optTitle = document.createElement("option");
                    optTitle.value = item.code;
                    optTitle.textContent = item.name;
                    titleSelect.appendChild(optTitle);
                });
            };
            
            itemReq.onerror = function() {
                if (typeof itemMasterStock !== 'undefined') {
                    itemMasterStock.forEach(item => {
                        let optCode = document.createElement("option"); optCode.value = item.code; optCode.textContent = item.code; codeSelect.appendChild(optCode);
                        let optTitle = document.createElement("option"); optTitle.value = item.code; optTitle.textContent = item.name; titleSelect.appendChild(optTitle);
                    });
                }
            };
        } catch(e) {
            if (typeof itemMasterStock !== 'undefined') {
                itemMasterStock.forEach(item => {
                    let optCode = document.createElement("option"); optCode.value = item.code; optCode.textContent = item.code; codeSelect.appendChild(optCode);
                    let optTitle = document.createElement("option"); optTitle.value = item.code; optTitle.textContent = item.name; titleSelect.appendChild(optTitle);
                });
            }
        }
    };
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("invPopupFromDate").value = today;
    document.getElementById("invPopupToDate").value = today;
    
    modal.style.display = "flex";
}

function closeInventoryLedgerModal() {
    document.getElementById("inventoryLedgerModal").style.display = "none";
}

function syncInventoryPopupFields(triggerSource) {
    const codeSelect = document.getElementById("invPopupCode");
    const titleSelect = document.getElementById("invPopupTitle");
    if (triggerSource === 'code') {
        titleSelect.value = codeSelect.value;
    } else {
        codeSelect.value = titleSelect.value;
    }
}

function generateLiveInventoryTab() {
    const selectedItemCode = document.getElementById("invPopupCode").value;
    const selectedItemName = document.getElementById("invPopupTitle").options[document.getElementById("invPopupTitle").selectedIndex].text;
    const fromDateRaw = document.getElementById("invPopupFromDate").value; 
    const toDateRaw = document.getElementById("invPopupToDate").value;     
    
    if (!fromDateRaw || !toDateRaw) {
        alert("Meharbani karke dono dates select karein!");
        return;
    }
    
    let rawItemsJson = "[]";
    if (typeof itemMasterStock !== 'undefined') {
        rawItemsJson = JSON.stringify(itemMasterStock);
    }
    
    const invTabWindow = window.open("", "CapriInventoryLedgerTabWindow");
    
    let fParts = fromDateRaw.split("-");
    let displayFrom = fParts[2] + "/" + fParts[1] + "/" + fParts[0];
    let tParts = toDateRaw.split("-");
    let displayTo = tParts[2] + "/" + tParts[1] + "/" + tParts[0];
    const todayPrintDate = new Date().toLocaleDateString('en-GB');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Inventory Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; color: #000; }
            .company-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 2px; letter-spacing:0.5px;}
            .company-address { text-align: center; font-size: 11px; margin-bottom: 2px; font-weight: bold; color: #333;}
            .doc-identity { text-align: center; font-size: 13px; font-weight: bold; color: #16a085; text-decoration: underline; margin-bottom: 20px;}
            .meta-summary { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; font-weight: bold;}
            .meta-block { display: flex; flex-direction: column; gap: 4px; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .ledger-table th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 4px; font-size: 12px; font-weight: bold; background: #2e4053; color: white;}
            .ledger-table td { border-bottom: 1px solid #ddd; padding: 6px 4px; font-size: 12px; text-align: center;}
            .grand-total-row td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; color: #16a085; padding: 8px 4px;}
            .no-print-bar { display: flex; gap: 10px; margin-bottom: 20px; background: #eaeaea; padding: 8px; border-radius:3px;}
            .btn-refresh { background: #2e4053; color: white; border: none; padding: 6px 15px; font-weight: bold; cursor: pointer; border-radius: 2px;}
            .remaining-stock { color: #2980b9; font-weight: bold; }
            .low-stock { color: #e74c3c; font-weight: bold; }
            @media print { .no-print-bar { display: none !important; } margin: 20px; }
        </style>
    </head>
    <body>
        <div class="no-print-bar">
            <button class="btn-refresh" onclick="loadLiveInventoryData()">🔄 Refresh / Sync Stock</button>
            <button class="btn-refresh" style="background:#27ae60;" onclick="window.print()">🖨️ Print Report</button>
        </div>

        <div style="float: right; font-weight: bold;">Print Date: &nbsp; ${todayPrintDate}</div>
        <div class="company-title">CAPRI SANITARY</div>
        <div class="company-address">DERRA ADDA HASSAN PARWANA ROAD MULTAN</div>
        <div class="doc-identity">${selectedItemCode === "BLANK_ALL" ? "All Products Stock Sales Summary" : "Product Inventory Ledger"}</div>

        <div class="meta-summary">
            <div class="meta-block" style="width: 50%;">
                <div>Item Code: &nbsp; <span style="font-weight:normal;">${selectedItemCode === "BLANK_ALL" ? "ALL" : selectedItemCode}</span></div>
                <div>From: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight:normal;">${displayFrom}</span></div>
            </div>
            <div class="meta-block" style="width: 50%; padding-left: 50px;">
                <div>Item Name: &nbsp; <span style="font-weight:normal;">${selectedItemCode === "BLANK_ALL" ? "ALL REGISTERED ITEMS" : selectedItemName}</span></div>
                <div>To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight:normal;">${displayTo}</span></div>
            </div>
        </div>

        <table class="ledger-table">
            <thead id="tableHeader"></thead>
            <tbody id="inventoryTableBody"></tbody>
        </table>

        <script>
            const fallbackMasterItems = ${rawItemsJson};

            function loadLiveInventoryData() {
                const dbRequest = indexedDB.open("CapriTradingDB", 1);
                
                dbRequest.onsuccess = function(event) {
                    const db = event.target.result;
                    const itemCodeMode = "${selectedItemCode}";
                    const fromDateRaw = "${fromDateRaw}";
                    const toDateRaw = "${toDateRaw}";
                    
                    let liveItemsList = [];
                    
                    try {
                        const itemTx = db.transaction("items", "readonly");
                        const itemStore = itemTx.objectStore("items");
                        const itemReq = itemStore.getAll();
                        
                        itemReq.onsuccess = function() {
                            liveItemsList = itemReq.result || [];
                            proceedToSalesComputation(db, itemCodeMode, fromDateRaw, toDateRaw, liveItemsList);
                        };
                        itemReq.onerror = function() {
                            proceedToSalesComputation(db, itemCodeMode, fromDateRaw, toDateRaw, fallbackMasterItems);
                        };
                    } catch(e) {
                        proceedToSalesComputation(db, itemCodeMode, fromDateRaw, toDateRaw, fallbackMasterItems);
                    }
                };
            }

            function proceedToSalesComputation(db, itemCodeMode, fromDateRaw, toDateRaw, productsArray) {
                const tx = db.transaction("sales_history", "readonly");
                const store = tx.objectStore("sales_history");
                const getAllReq = store.getAll();
                
                getAllReq.onsuccess = function() {
                    let dbRecords = getAllReq.result || [];
                    let tableBodyHtml = '';
                    
                    const stockMap = {};
                    productsArray.forEach(function(p) {
                        stockMap[p.code] = {
                            name: p.name || "Unknown",
                            stockBoxes: p.stockBoxes || 0,
                            stockPieces: p.stockPieces || 0,
                            pbox: p.pbox || 1
                        };
                    });
                    
                    if (itemCodeMode === "BLANK_ALL") {
                        document.getElementById("tableHeader").innerHTML = '<tr>' +
                            '<th style="width: 12%;">Product Code</th>' +
                            '<th style="text-align:left; padding-left:15px; width: 30%;">Product Name</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:10px;">Sold Boxes</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:10px;">Sold Pieces</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:10px; background:#e8f4f8; color:#2980b9;">Remaining Boxes</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:10px; background:#e8f4f8; color:#2980b9;">Remaining Pieces</th>' +
                            '<th style="width: 10%; text-align:center;">Status</th>' +
                            '</tr>';
                            
                        let summaryMap = {};
                        
                        productsArray.forEach(function(p) {
                            summaryMap[p.code] = { 
                                name: p.name, 
                                boxes: 0, 
                                pieces: 0,
                                stockBoxes: p.stockBoxes || 0,
                                stockPieces: p.stockPieces || 0,
                                pbox: p.pbox || 1
                            };
                        });
                        
                        dbRecords.forEach(function(inv) {
                            let rawDate = inv.date || "";
                            let checkDate = "";
                            if (rawDate.includes("-")) {
                                let parts = rawDate.split("-");
                                checkDate = parts[0].length === 4 ? rawDate : parts[2] + "-" + parts[1] + "-" + parts[0];
                            } else if (rawDate.includes("/")) {
                                let parts = rawDate.split("/");
                                checkDate = parts[2] + "-" + parts[1] + "-" + parts[0];
                            }
                            
                            if (checkDate >= fromDateRaw && checkDate <= toDateRaw) {
                                if (inv.items && Array.isArray(inv.items)) {
                                    inv.items.forEach(function(it) {
                                        if (summaryMap[it.code]) {
                                            summaryMap[it.code].boxes += (parseInt(it.box) || 0);
                                            summaryMap[it.code].pieces += (parseInt(it.piece) || 0);
                                        }
                                    });
                                }
                            }
                        });
                        
                        let grandSoldBoxes = 0;
                        let grandSoldPieces = 0;
                        let grandRemainingBoxes = 0;
                        let grandRemainingPieces = 0;
                        
                        for (let key in summaryMap) {
                            let item = summaryMap[key];
                            grandSoldBoxes += item.boxes;
                            grandSoldPieces += item.pieces;
                            grandRemainingBoxes += item.stockBoxes;
                            grandRemainingPieces += item.stockPieces;
                            
                            let statusText = "✅ In Stock";
                            let statusColor = "#27ae60";
                            if (item.stockBoxes === 0 && item.stockPieces === 0) {
                                statusText = "❌ Out of Stock";
                                statusColor = "#e74c3c";
                            } else if (item.stockBoxes < 5) {
                                statusText = "⚠️ Low Stock";
                                statusColor = "#f39c12";
                            }
                            
                            tableBodyHtml += '<tr style="height:26px; border-bottom: 1px solid #ddd;">' +
                                '<td style="font-weight: bold; color: #2c3e50;">' + key + '</td>' +
                                '<td style="text-align:left; padding-left:15px;">' + item.name + '</td>' +
                                '<td style="text-align:right; padding-right:10px;">' + item.boxes + '</td>' +
                                '<td style="text-align:right; padding-right:10px;">' + item.pieces + '</td>' +
                                '<td style="text-align:right; padding-right:10px; font-weight:bold; color:#2980b9;">' + item.stockBoxes + '</td>' +
                                '<td style="text-align:right; padding-right:10px; font-weight:bold; color:#2980b9;">' + item.stockPieces + '</td>' +
                                '<td style="text-align:center; color:' + statusColor + '; font-weight:bold;">' + statusText + '</td>' +
                                '</tr>';
                        }
                        
                        tableBodyHtml += '<tr class="grand-total-row">' +
                            '<td colspan="2" style="text-align: right; font-weight: bold; padding-right: 30px; border-top: 1px solid #000;">Grand Total</td>' +
                            '<td style="text-align:right; padding-right:10px; border-top: 1px solid #000;">' + grandSoldBoxes + '</td>' +
                            '<td style="text-align:right; padding-right:10px; border-top: 1px solid #000;">' + grandSoldPieces + '</td>' +
                            '<td style="text-align:right; padding-right:10px; border-top: 1px solid #000; font-weight:bold; color:#2980b9;">' + grandRemainingBoxes + '</td>' +
                            '<td style="text-align:right; padding-right:10px; border-top: 1px solid #000; font-weight:bold; color:#2980b9;">' + grandRemainingPieces + '</td>' +
                            '<td style="border-top: 1px solid #000;"></td>' +
                            '</tr>';
                            
                    } else {
                        document.getElementById("tableHeader").innerHTML = '<tr>' +
                            '<th style="width: 12%;">Date</th>' +
                            '<th style="width: 15%;">Invoice#</th>' +
                            '<th style="text-align:left; padding-left:5px;">Transaction Details</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:5px;">Qty Out (Boxes)</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:5px;">Qty Out (Pieces)</th>' +
                            '<th style="width: 12%; text-align:right; padding-right:5px;">Rate</th>' +
                            '<th style="width: 15%; text-align:right; padding-right:5px;">Total Amount</th>' +
                            '</tr>';
                            
                        let totalQtyBoxes = 0;
                        let totalQtyPieces = 0;
                        let totalValueAmount = 0;
                        
                        let currentStock = stockMap[itemCodeMode] || { stockBoxes: 0, stockPieces: 0 };
                        
                        dbRecords.forEach(function(inv) {
                            let rawDate = inv.date || "";
                            let checkDate = "";
                            if (rawDate.includes("-")) {
                                let parts = rawDate.split("-");
                                checkDate = parts[0].length === 4 ? rawDate : parts[2] + "-" + parts[1] + "-" + parts[0];
                            } else if (rawDate.includes("/")) {
                                let parts = rawDate.split("/");
                                checkDate = parts[2] + "-" + parts[1] + "-" + parts[0];
                            }
                            
                            if (checkDate >= fromDateRaw && checkDate <= toDateRaw) {
                                if (inv.items && Array.isArray(inv.items)) {
                                    inv.items.forEach(function(item) {
                                        if (item.code === itemCodeMode) {
                                            let boxQty = parseInt(item.box) || 0;
                                            let pieceQty = parseInt(item.piece) || 0;
                                            let rate = parseFloat(item.rate) || 0;
                                            let totalAmt = parseFloat(item.amount) || 0;
                                            
                                            totalQtyBoxes += boxQty;
                                            totalQtyPieces += pieceQty;
                                            totalValueAmount += totalAmt;
                                            
                                            let dateFormatted = inv.date;
                                            if(dateFormatted.includes("-")) {
                                                let parts = dateFormatted.split("-");
                                                dateFormatted = parts[2] + "/" + parts[1] + "/" + parts[0];
                                            }
                                            
                                            tableBodyHtml += '<tr style="height:25px;">' +
                                                '<td>' + dateFormatted + '</td>' +
                                                '<td>S-' + inv.invoiceId + '</td>' +
                                                '<td style="text-align:left; padding-left:5px;">Sold to ' + (inv.customerName || "Walking Customer") + '</td>' +
                                                '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + boxQty + '</td>' +
                                                '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + pieceQty + '</td>' +
                                                '<td style="text-align:right; padding-right:5px;">' + rate.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>' +
                                                '<td style="text-align:right; padding-right:5px;">' + totalAmt.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>' +
                                                '</tr>';
                                        }
                                    });
                                }
                            }
                        });
                        
                        if(tableBodyHtml === '') {
                            tableBodyHtml = '<tr><td colspan="7" style="padding:20px; color:#7f8c8d;">Is select carda date period mein is product ki koi sales entry nahi mili.</td></tr>';
                        }
                        
                        tableBodyHtml += '<tr class="grand-total-row">' +
                            '<td colspan="3" style="text-align: right; font-weight: bold; padding-right: 30px;">Total Sales Out</td>' +
                            '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + totalQtyBoxes + '</td>' +
                            '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + totalQtyPieces + '</td>' +
                            '<td></td>' +
                            '<td style="text-align:right; padding-right:5px; font-weight:bold;">' + totalValueAmount.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>' +
                            '</tr>';
                        
                        let stockStatus = "✅ In Stock";
                        let stockColor = "#27ae60";
                        if (currentStock.stockBoxes === 0 && currentStock.stockPieces === 0) {
                            stockStatus = "❌ Out of Stock";
                            stockColor = "#e74c3c";
                        } else if (currentStock.stockBoxes < 5) {
                            stockStatus = "⚠️ Low Stock";
                            stockColor = "#f39c12";
                        }
                        
                        tableBodyHtml += '<tr style="background: #e8f4f8; font-weight: bold;">' +
                            '<td colspan="3" style="text-align: right; padding-right: 30px; color: #2980b9;">📦 Current Remaining Stock</td>' +
                            '<td style="text-align:right; padding-right:5px; color: #2980b9;">' + currentStock.stockBoxes + ' Boxes</td>' +
                            '<td style="text-align:right; padding-right:5px; color: #2980b9;">' + currentStock.stockPieces + ' Pieces</td>' +
                            '<td></td>' +
                            '<td style="text-align:center; color: ' + stockColor + ';">' + stockStatus + '</td>' +
                            '</tr>';
                    }
                    
                    document.getElementById("inventoryTableBody").innerHTML = tableBodyHtml;
                };
            }
            window.onload = loadLiveInventoryData;
        </script>
    </body>
    </html>`;

    invTabWindow.document.open();
    invTabWindow.document.write(htmlContent);
    invTabWindow.document.close();
}

// =======================================================================
// PRODUCT REGISTRY & BULK RATE UPDATER
// =======================================================================
function executeSecureDBTransaction(storeName, mode, callback) {
    const dbRequest = indexedDB.open("CapriTradingDB", 1);
    
    dbRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("items")) {
            db.createObjectStore("items", { keyPath: "code" });
        }
        if (!db.objectStoreNames.contains("sales_history")) {
            db.createObjectStore("sales_history", { keyPath: "invoiceId" });
        }
    };

    dbRequest.onsuccess = function(event) {
        const db = event.target.result;
        localDatabase = db;
        
        try {
            if (!db.objectStoreNames.contains(storeName)) {
                callback(null, null);
                return;
            }
            const tx = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            callback(store, tx);
        } catch(e) {
            callback(null, null);
        }
    };

    dbRequest.onerror = function() {
        callback(null, null);
    };
}

function loadDashboardProductsGrid(skipAutoSave = true) {
    const tbody = document.getElementById("dashboardProductsTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 15px; text-align: center; color: #7f8c8d;">Syncing system item records...</td></tr>`;

    executeSecureDBTransaction("items", "readonly", function(store) {
        if (!store) {
            const backup = localStorage.getItem('cached_items_backup');
            const fallbackData = backup ? JSON.parse(backup) : (typeof itemMasterStock !== 'undefined' ? itemMasterStock : []);
            renderGridRows(fallbackData);
            return;
        }
        
        const req = store.getAll();
        req.onsuccess = function() {
            let dbItems = req.result || [];
            
            if (dbItems.length > 0 && typeof itemMasterStock !== 'undefined') {
                itemMasterStock = JSON.parse(JSON.stringify(dbItems));
                localStorage.setItem('cached_items_backup', JSON.stringify(itemMasterStock));
            }
            
            renderGridRows(dbItems);
            checkLowStock();
            updateDashboardSummary();
            
            if (!skipAutoSave && typeof autoSaveDataToFile === 'function') {
                // autoSaveDataToFile();   //
            }
        };
        req.onerror = function() {
            const backup = localStorage.getItem('cached_items_backup');
            renderGridRows(backup ? JSON.parse(backup) : (typeof itemMasterStock !== 'undefined' ? itemMasterStock : []));
        };
    });
}

function renderGridRows(itemsList) {
    const tbody = document.getElementById("dashboardProductsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if(itemsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding: 15px; text-align: center; color: #7f8c8d;">No items found. Add a new product below!</td></tr>`;
        return;
    }
    
    itemsList.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, {numeric: true}));

    itemsList.forEach((item, index) => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid #eaeded";
        row.innerHTML = `
            <td style="padding: 4px 6px;">
                <input type="text" class="grid-code-input" data-index="${index}" value="${item.code}" style="width: 95%; padding: 4px; font-weight: bold; color: #2e4053; border: 1px solid #d5dbdb; border-radius: 2px; text-align:center; background:#fef9e7;">
            </td>
            <td style="padding: 4px 6px;">
                <input type="text" class="grid-name-input" data-index="${index}" value="${item.name}" style="width: 95%; padding: 4px; color: #333; border: 1px solid #d5dbdb; border-radius: 2px; text-align:left; background:#fef9e7;">
            </td>
            <td style="padding: 4px 6px;">
                <input type="number" class="grid-rate-input" data-code="${item.code}" data-name="${item.name}" data-pbox="${item.pbox || 1}" value="${item.price}" style="width: 95%; padding: 4px; font-weight: bold; color: #27ae60; border: 1px solid #d5dbdb; border-radius: 2px; text-align:right;">
            </td>
            <td style="padding: 4px 6px;">
                <input type="number" class="grid-pbox-input" data-code="${item.code}" value="${item.pbox || 1}" style="width: 95%; padding: 4px; color: #7f8c8d; border: 1px solid #d5dbdb; border-radius: 2px; text-align:center; background:#fef9e7;">
            </td>
            <td style="padding: 4px 6px;">
                <input type="number" class="grid-stock-boxes-input" data-code="${item.code}" value="${item.stockBoxes || 0}" style="width: 95%; padding: 4px; font-weight: bold; color: #2980b9; border: 1px solid #d5dbdb; border-radius: 2px; text-align:center;">
            </td>
            <td style="padding: 4px 6px;">
                <input type="number" class="grid-stock-pieces-input" data-code="${item.code}" value="${item.stockPieces || 0}" style="width: 95%; padding: 4px; font-weight: bold; color: #2980b9; border: 1px solid #d5dbdb; border-radius: 2px; text-align:center;">
            </td>
            <td style="padding: 4px 6px; text-align:center;">
                <button onclick="deleteProductFromRegistry('${item.code}')" style="background: #e74c3c; color: white; border: none; padding: 3px 10px; cursor: pointer; border-radius: 2px; font-size: 11px; font-weight: bold;">✕ Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addNewProductToRegistry() {
    const code = document.getElementById("newProdCode").value.trim();
    const name = document.getElementById("newProdName").value.trim();
    const rate = parseFloat(document.getElementById("newProdPrice").value) || 0; 
    const pbox = parseInt(document.getElementById("newProdPBox").value) || 1; 
    const stockBoxes = parseInt(document.getElementById("newProdStockBoxes").value) || 0;
    const stockPieces = parseInt(document.getElementById("newProdStockPieces").value) || 0;

    if (!code || !name) {
        alert("Meharbani karke Product Code aur Name lazmi likhein!");
        return;
    }

    const newProductObj = {
        code: code,
        name: name,
        price: rate,
        pbox: pbox,
        stockBoxes: stockBoxes,
        stockPieces: stockPieces
    };

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        if (store) {
            store.put(newProductObj);
        }
        
        if (typeof itemMasterStock !== 'undefined') {
            const idx = itemMasterStock.findIndex(i => String(i.code) === String(code));
            if (idx > -1) {
                itemMasterStock[idx] = newProductObj;
            } else {
                itemMasterStock.push(newProductObj);
            }
        }

        alert("Naya product aur purchased stock kamyabi se add ho gaya hai!");
        
        document.getElementById("newProdCode").value = "";
        document.getElementById("newProdName").value = "";
        document.getElementById("newProdPrice").value = "0";
        document.getElementById("newProdPBox").value = "1";
        document.getElementById("newProdStockBoxes").value = "0";
        document.getElementById("newProdStockPieces").value = "0";
        
        if (typeof closeProductModal === 'function') {
            closeProductModal();
        } else {
            const modal = document.getElementById("newProductModal");
            if(modal) modal.style.display = "none";
        }
        
        loadDashboardProductsGrid(false);
        // autoSaveDataToFile();   //
        updateDashboardSummary();
    });
}

function addNewProductFromDashboard() {
    const code = document.getElementById('dashNewCode').value.trim();
    const name = document.getElementById('dashNewName').value.trim();
    const price = parseFloat(document.getElementById('dashNewPrice').value) || 0;
    const pbox = parseInt(document.getElementById('dashNewPBox').value) || 1;
    const stockBoxes = parseInt(document.getElementById('dashNewStockBoxes').value) || 0;
    const stockPieces = parseInt(document.getElementById('dashNewStockPieces').value) || 0;

    if (!code || !name) {
        alert("Meharbani karke Product Code aur Name lazmi likhein!");
        return;
    }

    const newProductObj = {
        code: code,
        name: name,
        price: price,
        pbox: pbox,
        stockBoxes: stockBoxes,
        stockPieces: stockPieces
    };

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        if (store) {
            store.put(newProductObj);
        }
        
        if (typeof itemMasterStock !== 'undefined') {
            const idx = itemMasterStock.findIndex(i => String(i.code) === String(code));
            if (idx > -1) {
                itemMasterStock[idx] = newProductObj;
            } else {
                itemMasterStock.push(newProductObj);
            }
        }

        alert("✅ Naya product aur stock kamyabi se add ho gaya!");
        
        document.getElementById('dashNewCode').value = '';
        document.getElementById('dashNewName').value = '';
        document.getElementById('dashNewPrice').value = '';
        document.getElementById('dashNewPBox').value = '1';
        document.getElementById('dashNewStockBoxes').value = '0';
        document.getElementById('dashNewStockPieces').value = '0';
        
        loadDashboardProductsGrid(false);
        // autoSaveDataToFile();   //
        updateDashboardSummary();
    });
}

function saveBulkRatesToDatabase() {
    const rows = document.querySelectorAll("#dashboardProductsTableBody tr");
    if (rows.length === 0) {
        alert("List mein tabdeel karne ke liye koi products majood nahi hain!");
        return;
    }

    let updatedItems = [];

    rows.forEach(row => {
        const codeInput = row.querySelector('.grid-code-input');
        const nameInput = row.querySelector('.grid-name-input');
        const rateInput = row.querySelector('.grid-rate-input');
        const pboxInput = row.querySelector('.grid-pbox-input');
        const stockBoxesInput = row.querySelector('.grid-stock-boxes-input');
        const stockPiecesInput = row.querySelector('.grid-stock-pieces-input');

        if (codeInput && rateInput) {
            const code = codeInput.value.trim();
            const name = nameInput ? nameInput.value.trim() : "";
            const price = parseFloat(rateInput.value) || 0;
            const pbox = pboxInput ? parseInt(pboxInput.value) || 1 : 1;
            const stockBoxes = stockBoxesInput ? parseInt(stockBoxesInput.value) || 0 : 0;
            const stockPieces = stockPiecesInput ? parseInt(stockPiecesInput.value) || 0 : 0;

            if (code) {
                updatedItems.push({
                    code: code,
                    name: name,
                    price: price,
                    pbox: pbox,
                    stockBoxes: stockBoxes,
                    stockPieces: stockPieces
                });
            }
        }
    });

    if (updatedItems.length === 0) {
        alert("Koi valid product nahi mila!");
        return;
    }

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        updatedItems.forEach(item => {
            if (store) {
                store.put(item);
            }
            
            if (typeof itemMasterStock !== 'undefined') {
                const idx = itemMasterStock.findIndex(i => String(i.code) === String(item.code));
                if (idx > -1) {
                    itemMasterStock[idx] = item;
                } else {
                    itemMasterStock.push(item);
                }
            }
        });

        if (typeof itemMasterStock !== 'undefined') {
            localStorage.setItem('cached_items_backup', JSON.stringify(itemMasterStock));
        }

        alert("✅ Mubarak ho! Saari products ke changes kamyabi se save ho chuke hain!");
        loadDashboardProductsGrid(false);
        // autoSaveDataToFile();   //
        updateDashboardSummary();
    });
}

function deleteProductFromRegistry(code) {
    if (!code) return;
    if (!confirm(`⚠️ Kya aap product "${code}" ko delete karna chahte hain?`)) return;

    executeSecureDBTransaction("items", "readwrite", function(store, tx) {
        if (store) {
            store.delete(code);
        }
        
        if (typeof itemMasterStock !== 'undefined') {
            const idx = itemMasterStock.findIndex(i => String(i.code) === String(code));
            if (idx > -1) {
                itemMasterStock.splice(idx, 1);
            }
        }

        localStorage.setItem('cached_items_backup', JSON.stringify(itemMasterStock));
        alert(`✅ Product "${code}" deleted successfully!`);
        loadDashboardProductsGrid(false);
        // autoSaveDataToFile();   //
        updateDashboardSummary();
    });
}

// =======================================================================
// TAB SWITCHING FUNCTION - WITHOUT AUTO-SAVE
// =======================================================================
function showActiveTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
    
    if (tabId === 'invoiceTab') {
        const title = document.getElementById('mainWindowTitle');
        if (title) {
            if (currentInvoiceType === 'sale') {
                title.textContent = '≡ Sale Invoice Management Panel';
            } else {
                title.textContent = '≡ Return Invoice Management Panel';
            }
        }
    }
    
    if (tabId === 'codingTab') {
        loadDashboardProductsGrid(true);
    }
    
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
}

// =======================================================================
// LOCK INVOICE # FIELD (After New Button)
// =======================================================================
function lockInvoiceNumberField() {
    const invNo = document.getElementById('invNo');
    if (invNo) {
        invNo.disabled = true;
        invNo.readOnly = true;
        invNo.classList.add('locked-field');
        invNo.style.backgroundColor = '#e8e8e8';
        invNo.style.cursor = 'not-allowed';
        invNo.title = 'Invoice # is locked. Click Search to unlock.';
        
        // ✅ Remove any click listeners to prevent popup
        invNo.removeEventListener('click', openInvoiceSearchPopup);
    }
}

// =======================================================================
// UNLOCK INVOICE # FIELD (For Search)
// =======================================================================
function unlockInvoiceNumberField() {
    const invNo = document.getElementById('invNo');
    if (invNo) {
        invNo.disabled = false;
        invNo.readOnly = false;
        invNo.classList.remove('locked-field');
        invNo.classList.add('search-mode-field');
        invNo.style.backgroundColor = '#fffde7';
        invNo.style.cursor = 'text';
        invNo.title = 'Enter invoice # or press Enter to search';
        
        // ✅ Add click listener only when unlocked
        invNo.addEventListener('click', function(e) {
            if (currentMode === 'search' || currentMode === 'locked') {
                openInvoiceSearchPopup();
            }
        });
    }
}

// =======================================================================
// CUSTOMER CODE FIELD - ENTER KEY OPENS SEARCH POPUP
// =======================================================================
function setupCustomerCodeSearch() {
    const custCodeInput = document.getElementById('custCode');
    
    if (custCodeInput) {
        // Remove existing listeners
        const newInput = custCodeInput.cloneNode(true);
        custCodeInput.parentNode.replaceChild(newInput, custCodeInput);
        
        const freshInput = document.getElementById('custCode');
        
        // Enter key -> Open search popup
        freshInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Only open in edit or search mode
                if (currentMode === 'edit' || currentMode === 'search') {
                    openCustomerSearchPopup();
                } else {
                    alert('System is locked. Click "New" or "Search" button first.');
                }
            }
        });
        
        // Also handle click for easier access
        freshInput.addEventListener('click', function() {
            if (currentMode === 'edit' || currentMode === 'search') {
                // Select all text for easy typing
                this.select();
            }
        });
        
        // Double click opens popup directly
        freshInput.addEventListener('dblclick', function() {
            if (currentMode === 'edit' || currentMode === 'search') {
                openCustomerSearchPopup();
            }
        });
    }
}

// ======================================================= //
// STYLESHEET FOR TOAST - SINGLE DECLARATION              //
// ======================================================= //
if (!document.getElementById('toastStyles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'toastStyles';
    styleSheet.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// ======================================================= //
// ROLE-BASED ACCESS CONTROL                              //
// ======================================================= //

// ✅ Get current user from localStorage
function getCurrentUser() {
    const userData = localStorage.getItem('capri_user');
    if (!userData) return null;
    try {
        return JSON.parse(userData);
    } catch(e) {
        return null;
    }
}

// ✅ Check if user is Admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// ✅ Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ======================================================= //
// APPLY ROLE-BASED ACCESS                                //
// ======================================================= //
function applyRoleBasedAccess() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const isAdminUser = user.role === 'admin';
    
    // ✅ Show/Hide Admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdminUser ? '' : 'none';
    });
    
    // ✅ If User, force Sale invoice type
    if (!isAdminUser) {
        const invoiceType = document.getElementById('invoiceType');
        if (invoiceType) {
            invoiceType.value = 'sale';
            invoiceType.disabled = true;
        }
        // Hide the indicator
        const indicator = document.getElementById('invoiceTypeIndicator');
        if (indicator) indicator.style.display = 'none';
        
        // Update title
        const title = document.getElementById('mainWindowTitle');
        if (title) {
            title.textContent = '≡ Sale Invoice Management Panel';
        }
    } else {
        // ✅ Admin: Enable invoice type dropdown
        const invoiceType = document.getElementById('invoiceType');
        if (invoiceType) {
            invoiceType.disabled = false;
        }
        const indicator = document.getElementById('invoiceTypeIndicator');
        if (indicator) indicator.style.display = '';
    }
    
    // ✅ Show user name
    const nameEl = document.getElementById('userDisplayName');
    if (nameEl) nameEl.textContent = user.name || user.username;
    
    // ✅ Show role badge
    const badgeEl = document.getElementById('userRoleBadge');
    if (badgeEl) {
        badgeEl.textContent = isAdminUser ? '👑 Admin' : '👤 User';
        badgeEl.style.background = isAdminUser ? '#2980b9' : '#27ae60';
    }
    
    // ✅ If not admin, hide Product Setup & Accounts tabs
    if (!isAdminUser) {
        const codingTab = document.getElementById('codingTab');
        const accountsTab = document.getElementById('accountsTab');
        if (codingTab) codingTab.style.display = 'none';
        if (accountsTab) accountsTab.style.display = 'none';
        // Ensure only invoice tab is visible
        showActiveTab('invoiceTab');
    }
    
    console.log(`✅ Logged in as: ${user.name} (${user.role})`);
}

// ✅ Logout Function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('capri_user');
        localStorage.removeItem('capri_remember');
        window.location.href = 'login.html';
    }
}

// ✅ Show User Name
function showUserName() {
    const user = getCurrentUser();
    const nameEl = document.getElementById('userDisplayName');
    if (nameEl && user) {
        nameEl.textContent = user.name || user.username;
    }
}

// ======================================================= //
// CHANGE PASSWORD - ADMIN ONLY                           //
// ======================================================= //

// ✅ Open Change Password Modal
function openChangePasswordModal() {
    const user = getCurrentUser();
    if (!user) return;
    
    // ✅ Only Admin can change password
    if (user.role !== 'admin') {
        alert('❌ Only Admin can change passwords!');
        return;
    }
    
    document.getElementById('cpUsername').value = user.username;
    document.getElementById('cpCurrentPassword').value = '';
    document.getElementById('cpNewPassword').value = '';
    document.getElementById('cpConfirmPassword').value = '';
    document.getElementById('cpError').style.display = 'none';
    document.getElementById('cpSuccess').style.display = 'none';
    
    document.getElementById('changePasswordModal').style.display = 'flex';
}

// ✅ Close Change Password Modal
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

// ✅ Change Password Form Submit - UPDATED (Username Editable)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // ✅ Username (editable field se)
            const newUsername = document.getElementById('cpUsername').value.trim();
            const currentPassword = document.getElementById('cpCurrentPassword').value.trim();
            const newPassword = document.getElementById('cpNewPassword').value.trim();
            const confirmPassword = document.getElementById('cpConfirmPassword').value.trim();
            const errorEl = document.getElementById('cpError');
            const successEl = document.getElementById('cpSuccess');
            
            errorEl.style.display = 'none';
            successEl.style.display = 'none';
            
            // ✅ Validation
            if (!newUsername) {
                errorEl.textContent = '⚠️ Please enter username!';
                errorEl.style.display = 'block';
                return;
            }
            
            if (!currentPassword) {
                errorEl.textContent = '⚠️ Please enter current password!';
                errorEl.style.display = 'block';
                return;
            }
            
            if (newPassword.length < 4) {
                errorEl.textContent = '⚠️ New password must be at least 4 characters!';
                errorEl.style.display = 'block';
                return;
            }
            
            if (newPassword !== confirmPassword) {
                errorEl.textContent = '⚠️ Passwords do not match!';
                errorEl.style.display = 'block';
                return;
            }
            
            // ✅ Get users from localStorage
            let users = JSON.parse(localStorage.getItem('capri_users') || '[]');
            
            // ✅ Current user from session
            const currentUser = getCurrentUser();
            const oldUsername = currentUser ? currentUser.username : '';
            
            // ✅ Find user by old username
            const userIndex = users.findIndex(u => u.username === oldUsername);
            
            if (userIndex === -1) {
                errorEl.textContent = '⚠️ User not found!';
                errorEl.style.display = 'block';
                return;
            }
            
            // ✅ Verify current password
            if (users[userIndex].password !== currentPassword) {
                errorEl.textContent = '⚠️ Current password is incorrect!';
                errorEl.style.display = 'block';
                return;
            }
            
            // ✅ Check if new username already exists (except self)
            if (newUsername !== oldUsername) {
                const existingUser = users.find(u => u.username === newUsername && u.username !== oldUsername);
                if (existingUser) {
                    errorEl.textContent = '⚠️ Username "' + newUsername + '" already exists!';
                    errorEl.style.display = 'block';
                    return;
                }
            }
            
            // ✅ Update username AND password
            users[userIndex].username = newUsername;
            users[userIndex].password = newPassword;
            localStorage.setItem('capri_users', JSON.stringify(users));
            
            // ✅ Update session with new username
            const updatedUser = {
                username: newUsername,
                name: users[userIndex].name,
                role: users[userIndex].role,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('capri_user', JSON.stringify(updatedUser));
            
            // ✅ Show success
            successEl.style.display = 'block';
            
            // ✅ Clear fields
            document.getElementById('cpCurrentPassword').value = '';
            document.getElementById('cpNewPassword').value = '';
            document.getElementById('cpConfirmPassword').value = '';
            
            // ✅ Close modal after 2 seconds
            setTimeout(function() {
                closeChangePasswordModal();
                alert('✅ Username and Password changed successfully!\nPlease login again with new username.');
                // ✅ Logout and redirect to login
                localStorage.removeItem('capri_user');
                window.location.href = 'login.html';
            }, 1500);
        });
    }
});

// ✅ Apply Role-Based Access on page load
document.addEventListener('DOMContentLoaded', function() {
    applyRoleBasedAccess();
});

function generatePrintInNewTab() {
    console.log('🟢 generatePrintInNewTab called!');
    console.log('🟢 Items count:', activeInvoiceItems.length);
    
    try {
        console.log('🟢 Getting invoice data...');
        const invNo = document.getElementById('invNo').value || "N/A";
        const invDate = document.getElementById('invDate').value || "N/A";
        const custTitle = document.getElementById('custType').value || "TILE MART";
        const custCode = document.getElementById('custCode').value || "030603010004";
        const grossAmt = parseFloat(document.getElementById('calcGross').value) || 0;
        const netTotal = parseFloat(document.getElementById('calcNetTotal').value) || 0;
        const totalBoxes = document.getElementById('totalBoxesCount').value || "0";
        const totalPieces = document.getElementById('totalPiecesCount').value || "0";
        
        // ✅ FIX 1: displayDate define karein
        let displayDate = invDate;
        if (invDate.includes("-")) {
            const parts = invDate.split("-");
            displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        
        // ✅ FIX 2: custNameAndNo define karein
        let rawCustValue = document.getElementById('custTitle').value;
        let custNameAndNo = rawCustValue ? rawCustValue.toString().trim() : "";
        if (!custNameAndNo || custNameAndNo === "0" || custNameAndNo === "00" || custNameAndNo === "N/A" || custNameAndNo === "undefined") {
            custNameAndNo = "&nbsp;";
        }
        
        console.log('🟢 Data:', { invNo, custTitle, grossAmt, netTotal, displayDate });
        
        // ✅ FIX 3: billRowsHtml build karein
        let billRowsHtml = "";
        if (activeInvoiceItems.length === 0) {
            billRowsHtml = `<tr><td colspan="10" style="text-align:center; padding:20px; color:#999;">No items in this invoice</td></tr>`;
        } else {
            activeInvoiceItems.forEach((row, index) => {
                billRowsHtml += `
                    <tr>
                        <td style="width: 5%; border:1px solid #000;">${index + 1}</td>
                        <td style="width: 8%; border:1px solid #000;">${row.code || ''}</td>
                        <td style="width: 32%; text-align:left; border:1px solid #000; padding-left:5px;">${row.name || ''}</td>
                        <td style="width: 15%; border:1px solid #000;"></td>
                        <td style="width: 6%; border:1px solid #000;">${row.box || 0}</td>
                        <td style="width: 6%; border:1px solid #000;">${row.piece || 0}</td>
                        <td style="width: 6%; border:1px solid #000;">${row.rate || 0}</td>
                        <td style="width: 8%; border:1px solid #000;">${(row.gross || 0).toLocaleString()}</td>
                        <td style="width: 6%; border:1px solid #000;">${(row.disc || 0).toLocaleString()}</td>
                        <td style="width: 8%; border:1px solid #000;">${(row.amount || 0).toLocaleString()}</td>
                    </tr>`;
            });
        }
        
        // ✅ FIX 4: gatePassRowsHtml build karein
        let gatePassRowsHtml = "";
        if (activeInvoiceItems.length === 0) {
            gatePassRowsHtml = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">No items</td></tr>`;
        } else {
            activeInvoiceItems.forEach((row, index) => {
                gatePassRowsHtml += `
                    <tr>
                        <td style="width: 6%; border:1px solid #000; height: 22px;">${index + 1}</td>
                        <td style="width: 12%; border:1px solid #000;">${row.code || ''}</td>
                        <td style="text-align:left; border:1px solid #000; padding-left:5px;">${row.name || ''}</td>
                        <td style="width: 15%; border:1px solid #000;"></td>
                        <td style="width: 10%; border:1px solid #000;">${row.box || 0}</td>
                        <td style="width: 10%; border:1px solid #000;">${row.piece || 0}</td>
                    </tr>`;
            });
        }
        
        // ✅ Open window with proper target
        let printWindow = window.open("", "printPreviewTab");
        console.log('🟢 Window opened:', printWindow ? 'Yes' : 'No');
        
        if (!printWindow || printWindow.closed) {
            console.log('🟢 Creating new window with features...');
            printWindow = window.open("", "printPreviewTab", "width=900,height=700,scrollbars=yes,resizable=yes");
        }
        
        if (!printWindow) {
            console.error('❌ Popup blocked!');
            alert('⚠️ Pop-up blocked! Please allow pop-ups for this site.\n\nClick the popup blocked icon in the address bar and select "Always allow".');
            return;
        }
        
        printWindow.focus();
        console.log('🟢 Window focused');
        
        // ✅ Write HTML
        const documentBodyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Preview - Invoice #${invNo}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; color: #000; line-height: 1.3; }
                .page-container { width: 100%; page-break-after: always; box-sizing: border-box; margin-bottom: 30px; }
                .gatepass-outer-border { border: 1.5px solid #000000; padding: 15px; box-sizing: border-box; width: 100%; display: block; }
                .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .doc-type-title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
                .meta-wrapper { display: flex; justify-content: space-between; margin-bottom: 15px; gap: 20px; }
                .meta-left-table { width: 50%; border-collapse: collapse; table-layout: fixed; }
                .meta-left-table td { border: 1px solid #000000; padding: 5px 6px; font-size: 12px; height: 22px; text-align: left; }
                .meta-left-title { background: #fafafa; width: 22%; }
                .meta-right-box { width: 45%; border: 1px solid #000000; padding: 6px 10px; font-size: 12px; box-sizing: border-box; }
                .grid-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                .grid-table th { border: 1px solid #000; padding: 6px 4px; font-size: 11px; font-weight: bold; background: #e6e6e6; text-align: center; }
                .grid-table td { border: 1px solid #000; padding: 5px 4px; text-align: center; font-size: 11px; }
                .totals-row td { font-weight: bold; border: 1px solid #000; padding: 6px 4px; }
                .double-bottom-border { border-bottom: 4px double #000000 !important; }
                .summary-footer-bar { border: 1px solid #000; margin-top: -1px; display: flex; font-weight: bold; font-size: 11px; height: 35px; align-items: center; }
                .summary-left-text { padding-left: 10px; width: 65%; text-transform: uppercase; font-size: 10px; }
                .summary-right-calc { padding-right: 10px; width: 35%; display: flex; flex-direction:column; justify-content: center; text-align: right; border-left: 1px solid #000; height: 100%; box-sizing: border-box; }
                .signature-tight-row { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 10px; }
                .sig-item { text-align: center; width: 160px; font-size: 11px; font-weight: bold; color: #000; }
                .sig-line { border-top: 1px solid #000; margin-bottom: 5px; width: 100%; }
                .no-print { background: #2a3f54; color: white; padding: 10px 15px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 15px; border-radius: 4px; }
                .no-print button { padding: 6px 18px; border: none; border-radius: 3px; font-weight: bold; cursor: pointer; font-size: 12px; }
                .btn-print { background: #27ae60; color: white; }
                .btn-close { background: #e74c3c; color: white; }
                @media print { .no-print { display: none !important; } body { margin: 10px; } }
            </style>
        </head>
        <body>
            <div class="no-print">
                <span style="font-weight: bold; font-size: 14px;">🖨️ Print Preview - Invoice #${invNo}</span>
                <div style="margin-left: auto; display: flex; gap: 8px;">
                    <button class="btn-print" onclick="window.print()">🖨️ Print</button>
                    <button class="btn-close" onclick="window.close()">✕ Close</button>
                </div>
            </div>
            <div class="page-container">
                <div class="header-section">
                    <div style="flex-grow: 1;"></div>
                    <div class="doc-type-title">${currentInvoiceType === 'sale' ? 'Cash Sale Invoice' : 'Return Invoice'}</div>
                </div>
                <div class="meta-wrapper">
                    <table class="meta-left-table">
                        <tr>
                            <td class="meta-left-title">InvoiceNo:</td>
                            <td style="font-weight: bold; width: 33%;">${invNo}</td>
                            <td style="width: 15%; text-align:center;">Date:</td>
                            <td style="font-weight: bold; width: 30%;">${displayDate}</td>
                        </tr>
                        <tr>
                            <td class="meta-left-title">AccountID:</td>
                            <td colspan="3" style="font-weight: bold;">${custCode}</td>
                        </tr>
                        <tr>
                            <td class="meta-left-title">Title:</td>
                            <td colspan="3" style="font-weight: bold;">${custTitle}</td>
                        </tr>
                    </table>
                    <div class="meta-right-box">
                        <div style="color: #000; font-size: 11px; font-weight: bold;">Customer & Phone No :</div>
                        <div style="font-weight: bold; font-size: 13px; margin-top: 8px;">${custNameAndNo}</div>
                    </div>
                </div>
                <table class="grid-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Pr ID</th>
                            <th style="text-align:left; padding-left:5px;">Product Name</th>
                            <th>Description</th>
                            <th>Box</th>
                            <th>Piece</th>
                            <th>Rate</th>
                            <th>GrossAmt</th>
                            <th>Disc</th>
                            <th>Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${billRowsHtml}
                        <tr class="totals-row">
                            <td colspan="4" style="text-align: right; padding-right: 15px;" class="double-bottom-border">Totals :</td>
                            <td class="double-bottom-border">${totalBoxes}</td>
                            <td class="double-bottom-border">${totalPieces}</td>
                            <td colspan="3" class="double-bottom-border"></td>
                            <td style="text-align: right; padding-right: 5px;" class="double-bottom-border">${grossAmt.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="summary-footer-bar">
                    <div class="summary-left-text"></div>
                    <div class="summary-right-calc">
                        <div>Net Total : <span style="font-size:13px; margin-left:20px;">${netTotal.toLocaleString()}</span></div>
                    </div>
                </div>
                <div class="signature-tight-row">
                    <div class="sig-item"><div class="sig-line"></div>Buyer's Signature</div>
                    <div class="sig-item"><div class="sig-line"></div>Seller's Signature</div>
                </div>
            </div>
            <div class="page-container">
                <div class="gatepass-outer-border">
                    <div class="header-section">
                        <div style="flex-grow: 1;"></div>
                        <div class="doc-type-title">Gate Pass</div>
                    </div>
                    <div class="meta-wrapper">
                        <table class="meta-left-table" style="width: 50%;">
                            <tr>
                                <td class="meta-left-title">InvoiceNo:</td>
                                <td style="font-weight: bold; width: 33%;">${invNo}</td>
                                <td style="width: 15%; text-align:center;">Date:</td>
                                <td style="font-weight: bold; width: 30%;">${displayDate}</td>
                            </tr>
                            <tr>
                                <td class="meta-left-title">AccountID:</td>
                                <td colspan="3" style="font-weight: bold;">${custCode}</td>
                            </tr>
                            <tr>
                                <td class="meta-left-title">Title:</td>
                                <td colspan="3" style="font-weight: bold;">${custTitle}</td>
                            </tr>
                        </table>
                        <div style="width: 45%;"></div>
                    </div>
                    <table class="grid-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Pr ID</th>
                                <th style="text-align:left; padding-left:5px;">Product Name</th>
                                <th>Description</th>
                                <th>Box</th>
                                <th>Piece</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${gatePassRowsHtml}
                            <tr class="totals-row">
                                <td colspan="4" style="text-align: right; padding-right: 15px;" class="double-bottom-border">Totals :</td>
                                <td class="double-bottom-border">${totalBoxes}</td>
                                <td class="double-bottom-border">${totalPieces}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="signature-tight-row">
                        <div class="sig-item"><div class="sig-line"></div>Buyer's Signature</div>
                        <div class="sig-item"><div class="sig-line"></div>Seller's Signature</div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        printWindow.document.write(documentBodyHtml);
        printWindow.document.close();
        printWindow.focus();
        
        console.log('🟢 HTML written successfully!');
        
        // ✅ Main window focus
        setTimeout(function() {
            window.focus();
        }, 100);
        
        printWindow.onunload = function() {
            window.focus();
        };
        
        console.log('✅ Print preview completed successfully!');
        
    } catch(error) {
        console.error('❌ Error in generatePrintInNewTab:', error);
        alert('Error generating print preview: ' + error.message);
    }
}

// =======================================================================
// TOAST NOTIFICATION FUNCTION
// =======================================================================
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#2980b9'
    };
    
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        cursor: default;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
