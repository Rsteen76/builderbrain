import { Bid, Expense, Project, ProjectPhase, Subcontractor } from '../types';
import { safelyParseDate } from '../utils/formatters';
import { BidService } from './bid';
import { ExpenseService } from './expense';
import { ProjectService } from './project';
import { SubcontractorService } from './subcontractor';

export interface ProjectDetailData {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
}

const ensureValidPhaseDates = (phases: ProjectPhase[]): ProjectPhase[] => {
  return phases.map(phase => {
    let startDate = phase.startDate;
    let endDate = phase.endDate;

    if (!startDate || isNaN(safelyParseDate(startDate).getTime())) {
      startDate = new Date();
    }

    if (!endDate || isNaN(safelyParseDate(endDate).getTime())) {
      const validStartDate = safelyParseDate(startDate);
      const newEndDate = new Date(validStartDate.getTime());
      newEndDate.setDate(validStartDate.getDate() + 30);
      endDate = newEndDate;
    } else {
      const validStartDate = safelyParseDate(startDate);
      const validEndDate = safelyParseDate(endDate);
      if (validEndDate < validStartDate) {
        const newEndDate = new Date(validStartDate.getTime());
        newEndDate.setDate(validStartDate.getDate() + 30);
        endDate = newEndDate;
      }
    }

    return {
      ...phase,
      startDate,
      endDate,
    };
  });
};

const referencedSubcontractorIds = (bids: Bid[], expenses: Expense[]): string[] => {
  const ids = new Set<string>();

  bids.forEach(bid => {
    if (bid.subcontractorId) ids.add(bid.subcontractorId);
  });

  expenses.forEach(expense => {
    if (expense.subcontractorId) ids.add(expense.subcontractorId);
  });

  return Array.from(ids);
};

export class ProjectDetailDataService {
  static async getProjectDetailData(userId: string, projectId: string): Promise<ProjectDetailData> {
    if (!userId || !projectId) {
      return {
        project: null,
        phases: [],
        bids: [],
        expenses: [],
        subcontractors: [],
      };
    }

    const project = await ProjectService.getProject(projectId, userId);

    if (!project) {
      return {
        project: null,
        phases: [],
        bids: [],
        expenses: [],
        subcontractors: [],
      };
    }

    const [bids, expenses] = await Promise.all([
      BidService.getBids(userId, { projectId }, undefined, Number.MAX_SAFE_INTEGER),
      ExpenseService.getProjectExpenses(userId, projectId),
    ]);

    const subcontractors = await Promise.all(
      referencedSubcontractorIds(bids, expenses).map(id =>
        SubcontractorService.getSubcontractor(userId, id)
      )
    );

    return {
      project,
      phases: ensureValidPhaseDates(project.phases || []),
      bids,
      expenses,
      subcontractors: subcontractors.filter((sub): sub is Subcontractor => Boolean(sub)),
    };
  }
}
