import { useState, useCallback, useEffect } from 'react';

type Serializer<T> = {
  serialize:   (value: T) => string;
  deserialize: (raw: string) => T;
};

const defaultSerializer = <T>(): Serializer<T> => ({
  serialize:   (v) => JSON.stringify(v),
  deserialize: (r) => JSON.parse(r) as T,
});

/**
 * useState that persists the value in localStorage.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  serializer?: Serializer<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serialize, deserialize } = serializer ?? defaultSerializer<T>();

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? deserialize(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const next = typeof value === 'function'
          ? (value as (prev: T) => T)(storedValue)
          : value;
        setStoredValue(next);
        localStorage.setItem(key, serialize(next));
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    },
    [key, serialize, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        const next = event.newValue !== null
          ? deserialize(event.newValue)
          : initialValue;
        setStoredValue(next);
      } catch {
        // Ignore
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initialValue, deserialize]);

  return [storedValue, setValue, removeValue];
}
