import { openDB, IDBPDatabase } from 'idb';
import { VaultData } from '../types';

const DB_NAME = 'AegisVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_store';
const KEY_VAULT = 'user_vault_data';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function loadPlainVault(): Promise<VaultData | null> {
  try {
    const db = await getDB();
    const val = await db.get(STORE_NAME, KEY_VAULT);
    if (val) return val;

    // Fallback to localStorage if any
    const local = localStorage.getItem('aegis_local_vault');
    if (local) {
      return JSON.parse(local);
    }
    return null;
  } catch (e) {
    console.error('Failed to load vault from storage:', e);
    return null;
  }
}

export async function savePlainVault(data: VaultData): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, data, KEY_VAULT);
    localStorage.setItem('aegis_local_vault', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save vault to storage:', e);
    localStorage.setItem('aegis_local_vault', JSON.stringify(data));
  }
}

export async function clearPlainVault(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, KEY_VAULT);
  localStorage.removeItem('aegis_local_vault');
}
