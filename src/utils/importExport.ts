import { Subcontractor, SubcontractorService } from '../services/subcontractor';

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
 * Import subcontractors from CSV data
 * @param csvText CSV text containing subcontractor data
 * @returns Promise with the results of the import operation
 */
export const importSubcontractorsFromCSV = async (csvText: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  const parsedData = parseCSV(csvText);
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  for (const row of parsedData) {
    try {
      // Transform CSV row into a subcontractor object
      const subcontractor: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt'> = {
        name: row.name || '',
        specialty: row.specialty || '',
        rating: parseFloat(row.rating) || 0,
        totalProjects: parseInt(row.totalProjects, 10) || 0,
        contact: {
          phone: row.phone || '',
          email: row.email || '',
          location: row.location || '',
        },
        performance: {
          onTime: parseInt(row.onTime, 10) || 0,
          quality: parseInt(row.quality, 10) || 0,
          communication: parseInt(row.communication, 10) || 0,
        },
        companyInfo: {
          website: row.website,
          founded: row.founded,
          employees: parseInt(row.employees, 10) || 0,
          license: row.license,
        },
        notes: row.notes,
      };
      
      // Add lastBid if both date and amount exist
      if (row.lastBidDate && row.lastBidAmount) {
        subcontractor.lastBid = {
          date: new Date(row.lastBidDate),
          amount: parseFloat(row.lastBidAmount) || 0,
        };
      }
      
      // Validate required fields
      if (!subcontractor.name) {
        throw new Error(`Missing required field: name`);
      }
      
      // Save to Firestore
      await SubcontractorService.createSubcontractor(subcontractor);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Error importing row ${parsedData.indexOf(row) + 2}: ${error}`);
    }
  }
  
  return result;
};

/**
 * Export subcontractors to CSV
 * @param subcontractors Array of subcontractor objects
 * @returns CSV string
 */
export const exportSubcontractorsToCSV = (subcontractors: Subcontractor[]): string => {
  const headers = [
    'name',
    'specialty',
    'rating',
    'totalProjects',
    'phone',
    'email',
    'location',
    'onTime',
    'quality',
    'communication',
    'website',
    'founded',
    'employees',
    'license',
    'lastBidDate',
    'lastBidAmount',
    'notes',
  ];
  
  const flattenedData = subcontractors.map(sub => ({
    name: sub.name,
    specialty: sub.specialty,
    rating: sub.rating,
    totalProjects: sub.totalProjects,
    phone: sub.contact.phone,
    email: sub.contact.email,
    location: sub.contact.location,
    onTime: sub.performance.onTime,
    quality: sub.performance.quality,
    communication: sub.performance.communication,
    website: sub.companyInfo?.website || '',
    founded: sub.companyInfo?.founded || '',
    employees: sub.companyInfo?.employees || '',
    license: sub.companyInfo?.license || '',
    lastBidDate: sub.lastBid ? new Date(sub.lastBid.date).toISOString().split('T')[0] : '',
    lastBidAmount: sub.lastBid ? sub.lastBid.amount : '',
    notes: sub.notes || '',
  }));
  
  return objectsToCSV(flattenedData, headers);
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