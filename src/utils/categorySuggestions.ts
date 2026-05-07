import { Phase } from '../types/project.types';
import { getSuggestedSubcategoriesForPhase, PHASE_CATEGORY_MAPPING } from '../data/phaseCategories';
import { getCategoryById } from '../data/hierarchicalCategories';
import { safelyParseDate } from './formatters';

/**
 * Determines the most likely phase a project is in based on phase status and dates
 * @param phases Array of project phases
 * @returns The key of the most likely current phase, or undefined if cannot be determined
 */
export const determineCurrentPhase = (phases: Phase[]): string | undefined => {
  if (!phases || phases.length === 0) {
    return undefined;
  }

  // First look for phases marked as "in_progress"
  const inProgressPhases = phases.filter(phase => phase.status === 'in_progress');
  if (inProgressPhases.length > 0) {
    // Sort by order if available, otherwise by start date
    const sortedInProgress = [...inProgressPhases].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.startDate && b.startDate) {
        return safelyParseDate(a.startDate).getTime() - safelyParseDate(b.startDate).getTime();
      }
      return 0;
    });
    
    // Map the phase name to a standard phase key
    return mapPhaseNameToKey(sortedInProgress[0].name);
  }

  // If no phases are in progress, find the earliest not started phase
  const notStartedPhases = phases.filter(phase => phase.status === 'not_started' || !phase.status);
  if (notStartedPhases.length > 0) {
    const sortedNotStarted = [...notStartedPhases].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.startDate && b.startDate) {
        return safelyParseDate(a.startDate).getTime() - safelyParseDate(b.startDate).getTime();
      }
      return 0;
    });
    return mapPhaseNameToKey(sortedNotStarted[0].name);
  }

  // Find the latest completed phase if all are completed
  const completedPhases = phases.filter(phase => phase.status === 'completed');
  if (completedPhases.length === phases.length && completedPhases.length > 0) {
    const sortedCompleted = [...completedPhases].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return b.order - a.order; // Descending order
      }
      if (a.endDate && b.endDate) {
        return safelyParseDate(b.endDate).getTime() - safelyParseDate(a.endDate).getTime(); // Latest end date first
      }
      return 0;
    });
    return mapPhaseNameToKey(sortedCompleted[0].name);
  }

  // Default to the earliest phase by order or start date
  const sortedPhases = [...phases].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.startDate && b.startDate) {
      return safelyParseDate(a.startDate).getTime() - safelyParseDate(b.startDate).getTime();
    }
    return 0;
  });

  return sortedPhases.length > 0 ? mapPhaseNameToKey(sortedPhases[0].name) : undefined;
};

/**
 * Maps a user-defined phase name to a standard phase key
 * Uses fuzzy matching to find the closest matching standard phase
 * @param phaseName The name of the phase to map
 * @returns The key of the matched standard phase or undefined
 */
export const mapPhaseNameToKey = (phaseName: string): string | undefined => {
  if (!phaseName) return undefined;

  const normalizedPhaseName = phaseName.toLowerCase().trim();

  // Direct mapping check
  const directMatch = PHASE_CATEGORY_MAPPING.find(
    phase => phase.phaseName.toLowerCase() === normalizedPhaseName
  );
  if (directMatch) return directMatch.phaseKey;

  // Fuzzy matching by keyword presence
  const keywordMatches = [
    { key: 'acquisition', keywords: ['acquisition', 'purchase', 'closing', 'buy'] },
    { key: 'planning', keywords: ['planning', 'design', 'architect', 'plan'] },
    { key: 'permits', keywords: ['permit', 'approval', 'inspection', 'code'] },
    { key: 'site-prep', keywords: ['site', 'preparation', 'prep', 'clear', 'demolition', 'demo'] },
    { key: 'foundation', keywords: ['foundation', 'concrete', 'footer', 'slab', 'base'] },
    { key: 'framing', keywords: ['fram', 'structure', 'rough carpentry', 'stud'] },
    { key: 'rough-in', keywords: ['rough', 'mechanical', 'plumbing', 'electrical', 'hvac'] },
    { key: 'exterior', keywords: ['exterior', 'siding', 'roof', 'window', 'door'] },
    { key: 'insulation', keywords: ['insulation', 'drywall', 'sheetrock', 'gypsum'] },
    { key: 'interior', keywords: ['interior', 'finish', 'paint', 'floor', 'trim'] },
    { key: 'fixtures', keywords: ['fixture', 'cabinet', 'appliance', 'counter'] },
    { key: 'landscape', keywords: ['landscape', 'yard', 'garden', 'plant', 'outdoor'] },
    { key: 'final', keywords: ['final', 'inspection', 'cleanup', 'punch', 'complete'] },
  ];

  for (const match of keywordMatches) {
    if (match.keywords.some(keyword => normalizedPhaseName.includes(keyword))) {
      return match.key;
    }
  }

  // If no match found, return undefined
  return undefined;
};

/**
 * Gets suggested categories for the current project phase
 * @param currentPhase The current phase of the project
 * @param itemDescription Optional description to help with more accurate suggestions
 * @returns Array of category objects with IDs and names
 */
export const getSuggestedCategoriesForCurrentPhase = (
  currentPhase: string | undefined,
  itemDescription?: string
) => {
  if (!currentPhase) return [];

  // Get subcategories for the current phase
  const suggestedSubcategories = getSuggestedSubcategoriesForPhase(currentPhase);

  // If we have a description, try to further refine the suggestions
  if (itemDescription && suggestedSubcategories.length > 0) {
    const normalizedDesc = itemDescription.toLowerCase();
    
    // Find categories whose keywords match the description
    const matchingCategories = suggestedSubcategories.filter(cat => {
      const category = getCategoryById(cat.id);
      if (!category || !category.keywords) return false;
      
      return category.keywords.some(keyword => 
        normalizedDesc.includes(keyword.toLowerCase())
      );
    });
    
    if (matchingCategories.length > 0) {
      return matchingCategories;
    }
  }

  return suggestedSubcategories;
};
