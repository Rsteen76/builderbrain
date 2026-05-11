import { Subcontractor } from '../types';
import { SubcontractorService } from '../services/subcontractor';
import { logger } from './logger';

/**
 * Parse CSV data into an array of objects
 * @param csvText CSV text to parse
 * @returns Array of objects, each representing a row in the CSV
 */
export const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    
    return row;
  });
};

/**
 * Convert array of objects to CSV
 * @param data Array of objects to convert
 * @param headers Array of header names (optional, derived from first object if not provided)
 * @returns CSV string
 */
export const objectsToCSV = (data: Record<string, any>[], headers?: string[]): string => {
  if (!data.length) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  let csvString = csvHeaders.join(',') + '\n';
  
  data.forEach(item => {
    const row = csvHeaders.map(header => {
      const value = item[header];
      
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value !== undefined && value !== null ? value : '';
    });
    
    csvString += row.join(',') + '\n';
  });
  
  return csvString;
};

/**
 * Export subcontractors to CSV format
 */
export const exportSubcontractorsToCSV = (subcontractors: Subcontractor[]): string => {
  // Use fields from imported Subcontractor type
  const header = [
    'id', 'name', 'specialty', 'rating', 'totalProjects', 
    'contact_phone', 'contact_email', 'contact_location', 
    'perf_onTime', 'perf_quality', 'perf_communication',
    'info_website', 'info_founded', 'info_employees', 'info_license', 
    'notes', 'createdAt', 'updatedAt' 
    // Add userId if needed for export, though maybe not desirable?
  ];
  const rows = subcontractors.map(sub => [
    sub.id,
    sub.name,
    sub.specialty,
    sub.rating ?? '',
    sub.totalProjects ?? '',
    sub.contact?.phone ?? '',
    sub.contact?.email ?? '',
    sub.contact?.location ?? '',
    sub.performance?.onTime ?? '',
    sub.performance?.quality ?? '',
    sub.performance?.communication ?? '',
    sub.companyInfo?.website ?? '',
    sub.companyInfo?.founded ?? '',
    sub.companyInfo?.employees ?? '',
    sub.companyInfo?.license ?? '',
    sub.notes ?? '',
    sub.createdAt.toISOString(), // Format dates
    sub.updatedAt.toISOString(),
  ]);

  return [header, ...rows].map(row => 
    row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');
};

/**
 * Import subcontractors from CSV data
 */
export const importSubcontractorsFromCSV = async (file: File, userId: string): Promise<{ success: number; failed: number; errors: string[] }> => {
  const result = { success: 0, failed: 0, errors: [] as string[] };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);

      if (!parsedData || parsedData.length === 0) {
        return reject(new Error('CSV file is empty or could not be parsed.'));
      }

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        try {
          // Map CSV row to Omit<Subcontractor, ...> using imported type
          const subcontractorData: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
            name: row.name || '',
            specialty: row.specialty || '',
            rating: parseFloat(row.rating) || 0,
            totalProjects: parseInt(row.totalProjects, 10) || 0,
            contact: {
              phone: row.contact_phone || '',
              email: row.contact_email || '',
              location: row.contact_location || '',
            },
            performance: {
              onTime: parseFloat(row.perf_onTime) || 0,
              quality: parseFloat(row.perf_quality) || 0,
              communication: parseFloat(row.perf_communication) || 0,
            },
            companyInfo: {
              website: row.info_website || '',
              founded: row.info_founded || '',
              employees: parseInt(row.info_employees, 10) || 0,
              license: row.info_license || '',
            },
            projects: [], // Initialize projects array
            notes: row.notes || '',
          };
          
          // Basic validation
          if (!subcontractorData.name || !subcontractorData.specialty) {
            throw new Error(`Row ${i + 2}: Name and specialty are required.`);
          }

          // Pass userId to createSubcontractor
          await SubcontractorService.createSubcontractor(userId, subcontractorData);
          result.success++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Error processing row ${i + 2}:`, message, row);
          result.failed++;
          result.errors.push(`Row ${i + 2}: ${message}`);
        }
      }
      resolve(result);
    };

    reader.onerror = (error) => {
      logger.error("File reading error:", error);
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Download data as a file
 * @param content Content to download
 * @param fileName Name of the file
 * @param contentType MIME type of the file
 */
export const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  
  // Clean up
  URL.revokeObjectURL(a.href);
}; 