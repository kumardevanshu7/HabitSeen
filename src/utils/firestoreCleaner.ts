/**
 * Helper to recursively clean objects for Firestore writes.
 * Firestore strictly throws errors when fields are `undefined`.
 * This function removes any `undefined` values and replaces them or omits the key.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map(cleanFirestoreData) as unknown as T;
  }

  // Only recurse plain JavaScript objects (prototype is Object.prototype or null)
  // Preserves Date, Firestore Timestamp, FieldValue (serverTimestamp, increment, etc.)
  if (typeof obj === 'object') {
    const proto = Object.getPrototypeOf(obj);
    if (proto === Object.prototype || proto === null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanFirestoreData(value);
        }
      }
      return cleaned as T;
    }
  }

  return obj;
}
