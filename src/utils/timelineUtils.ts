import { Project } from '../types'; // Adjust path if needed
import { safelyParseDate } from './formatters'; // Assuming formatters are in the same utils folder

/**
 * Represents the calculated timeline data.
 */
export interface TimelineData {
  startDate: Date;
  endDate: Date;
  elapsedDays: number;
  totalDays: number;
  percentComplete: number;
}

/**
 * Calculates project timeline metrics based on start and end dates.
 * 
 * @param project The project object (or null).
 * @returns A TimelineData object with calculated metrics.
 */
export const calculateTimelineData = (project: Project | null): TimelineData => {
  const defaultDate = new Date(0); // Use epoch time as a fallback
  const startDate = safelyParseDate(project?.startDate ?? null) || defaultDate;
  const endDate = safelyParseDate(project?.endDate ?? null) || defaultDate;
  
  const today = new Date();
  
  let totalDays = 0;
  let elapsedDays = 0;
  let percentComplete = 0;

  if (startDate !== defaultDate && endDate !== defaultDate && startDate < endDate) {
    totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    const effectiveToday = today > endDate ? endDate : today;
    if (effectiveToday > startDate) {
      elapsedDays = Math.round((effectiveToday.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    }
    
    if (totalDays > 0) {
      percentComplete = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    }
  } else if (startDate !== defaultDate && endDate === defaultDate) {
    const effectiveToday = today;
     if (effectiveToday > startDate) {
        elapsedDays = Math.round((effectiveToday.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
     }
  }

  return {
    startDate: startDate,
    endDate: endDate,
    elapsedDays: elapsedDays,
    totalDays: totalDays,
    percentComplete: percentComplete,
  };
}; 