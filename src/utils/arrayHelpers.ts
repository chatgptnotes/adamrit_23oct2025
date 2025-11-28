
// Helper functions for safe array access
type ArrayOrObject = unknown[] | Record<string, unknown> | undefined | null;

export const getFirstItemProperty = (array: ArrayOrObject, property: string): unknown => {
  if (Array.isArray(array) && array.length > 0) {
    return (array[0] as Record<string, unknown>)?.[property];
  }
  return (array as Record<string, unknown>)?.[property] || '';
};

export const safeArrayAccess = (data: ArrayOrObject, property: string): unknown => {
  if (Array.isArray(data)) {
    return data.length > 0 ? (data[0] as Record<string, unknown>)?.[property] : '';
  }
  return (data as Record<string, unknown>)?.[property] || '';
};
