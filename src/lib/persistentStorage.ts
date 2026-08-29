import { Product, StorePhoto, INITIAL_PRODUCTS, DEFAULT_STORE_PHOTOS } from '../constants';

const DB_NAME = 'JeilHanaMedicalDB';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_PHOTOS = 'store_photos';

const LOCAL_STORAGE_PRODUCTS_KEY = 'jeil_hana_products_v2';
const LOCAL_STORAGE_PHOTOS_KEY = 'jeil_hana_store_photos_v2';
const DELETED_PRODUCT_IDS_KEY = 'jeil_hana_deleted_product_ids_v2';
const DELETED_PHOTO_IDS_KEY = 'jeil_hana_deleted_photo_ids_v2';

// Open or create IndexedDB instance
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Track deleted IDs to prevent ghost restoration
export function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCT_IDS_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Error reading deleted product ids:', e);
  }
  return new Set();
}

export function recordDeletedProductId(id: string) {
  try {
    const set = getDeletedProductIds();
    set.add(id);
    localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error recording deleted product id:', e);
  }
}

export function unrecordDeletedProductId(id: string) {
  try {
    const set = getDeletedProductIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (e) {
    console.warn('Error unrecording deleted product id:', e);
  }
}

export function getDeletedPhotoIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PHOTO_IDS_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Error reading deleted photo ids:', e);
  }
  return new Set();
}

export function recordDeletedPhotoId(id: string) {
  try {
    const set = getDeletedPhotoIds();
    set.add(id);
    localStorage.setItem(DELETED_PHOTO_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error recording deleted photo id:', e);
  }
}

export function unrecordDeletedPhotoId(id: string) {
  try {
    const set = getDeletedPhotoIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(DELETED_PHOTO_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (e) {
    console.warn('Error unrecording deleted photo id:', e);
  }
}

export function clearDeletedProductRecords() {
  try {
    localStorage.removeItem(DELETED_PRODUCT_IDS_KEY);
  } catch (e) {
    console.warn('Error clearing deleted product records:', e);
  }
}

// Save list to IndexedDB
async function saveToIDB<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Clear and put all
    store.clear();
    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn(`Failed to save to IndexedDB (${storeName}):`, e);
  }
}

// Read list from IndexedDB
async function getFromIDB<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn(`Failed to read from IndexedDB (${storeName}):`, e);
    return [];
  }
}

// 1. Initial Synchronous / Cached Load for Products
export function getInitialProducts(): Product[] {
  const deletedIds = getDeletedProductIds();
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => !deletedIds.has(p.id));
      }
    }
  } catch (e) {
    console.warn('Error reading products from localStorage:', e);
  }
  return INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id));
}

// 2. Initial Synchronous / Cached Load for Store Photos
export function getInitialStorePhotos(): StorePhoto[] {
  const deletedIds = getDeletedPhotoIds();
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => !deletedIds.has(p.id));
      }
    }
  } catch (e) {
    console.warn('Error reading store photos from localStorage:', e);
  }
  return DEFAULT_STORE_PHOTOS.filter(p => !deletedIds.has(p.id));
}

// Save products both to localStorage and IndexedDB
export async function persistProductsLocally(products: Product[]): Promise<void> {
  try {
    // Try localStorage first (fast)
    try {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded, relying on IndexedDB:', quotaError);
    }
    // Also save to IndexedDB (virtually unlimited capacity)
    await saveToIDB(STORE_PRODUCTS, products);
  } catch (err) {
    console.error('persistProductsLocally error:', err);
  }
}

// Save store photos both to localStorage and IndexedDB
export async function persistStorePhotosLocally(photos: StorePhoto[]): Promise<void> {
  try {
    // Try localStorage first (fast)
    try {
      localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(photos));
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded, relying on IndexedDB:', quotaError);
    }
    // Also save to IndexedDB (virtually unlimited capacity)
    await saveToIDB(STORE_PHOTOS, photos);
  } catch (err) {
    console.error('persistStorePhotosLocally error:', err);
  }
}

// Load full offline/IDB products if needed
export async function loadFullProductsFromDB(): Promise<Product[] | null> {
  const deletedIds = getDeletedProductIds();
  try {
    const idbProducts = await getFromIDB<Product>(STORE_PRODUCTS);
    if (idbProducts && idbProducts.length > 0) {
      return idbProducts.filter(p => !deletedIds.has(p.id));
    }
  } catch (e) {
    console.warn('IDB products load error:', e);
  }
  return null;
}

// Load full offline/IDB store photos if needed
export async function loadFullStorePhotosFromDB(): Promise<StorePhoto[] | null> {
  const deletedIds = getDeletedPhotoIds();
  try {
    const idbPhotos = await getFromIDB<StorePhoto>(STORE_PHOTOS);
    if (idbPhotos && idbPhotos.length > 0) {
      return idbPhotos.filter(p => !deletedIds.has(p.id));
    }
  } catch (e) {
    console.warn('IDB store photos load error:', e);
  }
  return null;
}

/**
 * Adaptive Image Compression Helper:
 * Compresses an image file (File or Blob) to a clean, lightweight Base64 JPEG URL.
 * Automatically resizes and scales down if necessary, ensuring the result is
 * well under Firestore's 1MB limit (< 100KB typically) while maintaining crisp visual quality.
 */
export function compressImageFile(
  file: File | Blob,
  maxDimension = 800,
  initialQuality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio bounded by maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        // Fill white background for transparent PNGs before converting to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If string size exceeds 150KB (~200,000 characters), scale quality down
        if (dataUrl.length > 200000) {
          quality = 0.65;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        // If still > 150KB, scale down dimensions
        if (dataUrl.length > 200000 && (width > 600 || height > 600)) {
          const scaledW = Math.round(width * 0.75);
          const scaledH = Math.round(height * 0.75);
          canvas.width = scaledW;
          canvas.height = scaledH;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, scaledW, scaledH);
          ctx.drawImage(img, 0, 0, scaledW, scaledH);
          dataUrl = canvas.toDataURL('image/jpeg', 0.68);
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        resolve(e.target?.result as string || '');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
