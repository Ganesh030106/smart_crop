import { openDB } from 'idb';

const DB_NAME = 'SmartCropAdvisorDB';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Farm Logs store
                if (!db.objectStoreNames.contains('logs')) {
                    const logsStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                    logsStore.createIndex('synced', 'synced');
                    logsStore.createIndex('timestamp', 'timestamp');
                }

                // Soil Health store
                if (!db.objectStoreNames.contains('soilHealth')) {
                    const soilStore = db.createObjectStore('soilHealth', { keyPath: 'id', autoIncrement: true });
                    soilStore.createIndex('synced', 'synced');
                }

                // Sync Queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                }

                // Alerts cache
                if (!db.objectStoreNames.contains('alerts')) {
                    db.createObjectStore('alerts', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
}

// ---- Farm Logs ----
export async function saveFarmLog(log) {
    const db = await getDB();
    const entry = {
        ...log,
        timestamp: new Date().toISOString(),
        synced: false,
    };
    const id = await db.add('logs', entry);
    // Add to sync queue
    await db.add('syncQueue', { type: 'log', data: { ...entry, id }, timestamp: entry.timestamp });
    return id;
}

export async function getAllLogs() {
    const db = await getDB();
    return db.getAll('logs');
}

export async function markLogSynced(id) {
    const db = await getDB();
    const log = await db.get('logs', id);
    if (log) {
        log.synced = true;
        await db.put('logs', log);
    }
}

// ---- Soil Health ----
export async function saveSoilHealth(entry) {
    const db = await getDB();
    const record = {
        ...entry,
        timestamp: new Date().toISOString(),
        synced: false,
    };
    const id = await db.add('soilHealth', record);
    await db.add('syncQueue', { type: 'soilHealth', data: { ...record, id }, timestamp: record.timestamp });
    return id;
}

export async function getAllSoilHealth() {
    const db = await getDB();
    return db.getAll('soilHealth');
}

// ---- Sync Queue ----
export async function getPendingSyncItems() {
    const db = await getDB();
    return db.getAll('syncQueue');
}

export async function clearSyncQueue() {
    const db = await getDB();
    await db.clear('syncQueue');
}

// ---- Alerts Cache ----
export async function cacheAlerts(alerts) {
    const db = await getDB();
    const tx = db.transaction('alerts', 'readwrite');
    for (const alert of alerts) {
        await tx.store.put(alert);
    }
    await tx.done;
}

export async function getCachedAlerts() {
    const db = await getDB();
    return db.getAll('alerts');
}
