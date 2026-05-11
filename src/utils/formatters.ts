import { logger } from './logger';
/**
 * Format a number as currency (USD)
 * @param value The number to format
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format a date string or Date object to a localized date string
 * @param date The date to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined | null | any,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
  } = {}
): string => {
  if (!date) return '';
  
  try {
    // Try to convert to a Date object if it's not already one
    const dateObj = 
        typeof date === 'string' ? new Date(date) : 
        date instanceof Date ? date : 
        // Handle objects with toDate() method (e.g., Firebase Timestamps)
        (date && typeof date === 'object' && typeof date.toDate === 'function') ? date.toDate() :
        // Handle plain objects with seconds/nanoseconds (e.g., serialized Timestamps)
        (date && typeof date === 'object' && typeof date.seconds === 'number' && typeof date.nanoseconds === 'number') ? new Date(date.seconds * 1000) :
        // Fallback for other types (including direct numbers which might be timestamps)
        new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      logger.warn(`Invalid date value encountered: ${JSON.stringify(date)}`);
      return '';
    }
    
    const { locale = 'en-US', format = 'medium' } = options;
    
    return dateObj.toLocaleDateString(locale, {
      dateStyle: format
    } as Intl.DateTimeFormatOptions);
  } catch (error) {
    logger.error('Error formatting date:', error, date);
    return '';
  }
};

/**
 * Format a number with thousand separators and decimal places
 * @param value The number to format
 * @param options Formatting options
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0';
  }
  
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);
};

/**
 * Format a file size in bytes to a human-readable string (KB, MB, GB)
 * @param bytes The file size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a number as a percentage
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Format a phone number in (XXX) XXX-XXXX format
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
};

/**
 * Truncate text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Safely parse a date value from any of the possible Phase date types
 * Handles Date objects, strings, Firestore Timestamps, nulls and undefined
 */
export const safelyParseDate = (dateInput: Date | string | { toDate(): Date } | null | undefined): Date => {
  if (!dateInput) return new Date(); // Default to current date if null or undefined
  
  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }
    
    // If it's a Firestore Timestamp or has a toDate method
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    // If it's a string, try to parse it
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    return new Date(); // Fallback
  } catch (error) {
    logger.error('Error parsing date:', error, dateInput);
    return new Date(); // Fallback to current date on error
  }
}; 