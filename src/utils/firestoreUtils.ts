// This file will store utility functions related to Firestore operations.

export const cleanForFirestore = (data: any): any => {
  // If null or primitive, return as is
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Handle Date objects - keep them as is for now, service will convert
  if (data instanceof Date) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    // Filter out undefined elements AND clean nested elements
    return data.filter(item => item !== undefined).map(item => cleanForFirestore(item));
  }

  // Handle objects
  const result: any = {};

  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values entirely
    if (value === undefined) {
      return;
    }

    // Recursively clean nested values
    result[key] = cleanForFirestore(value);
  });

  return result;
};
