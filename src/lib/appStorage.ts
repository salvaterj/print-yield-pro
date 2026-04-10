type Reviver<T> = T;

export const storageKeys = {
  systemSettings: 'rocha:system-settings',
  companies: 'rocha:companies',
  carriers: 'rocha:carriers',
  salespeople: 'rocha:salespeople',
  rawProducts: 'rocha:raw-products',
  finishedProducts: 'rocha:finished-products',
  quotes: 'rocha:quotes',
  quoteItems: 'rocha:quote-items',
  workOrders: 'rocha:work-orders',
  workOrderItems: 'rocha:work-order-items',
} as const;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadStoredData<T>(key: string, fallback: Reviver<T>): T {
  if (!canUseStorage()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

export function saveStoredData<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
