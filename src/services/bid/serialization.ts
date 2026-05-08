import { Timestamp } from 'firebase/firestore';
import type { Bid, BidPaymentProgress, BidPaymentStage, BidVersion } from '../../types';
import { logger } from '../../utils/logger';
import type { FirestoreBid, FirestoreBidPaymentStage, FirestoreBidVersion } from './types';

const dateFields = ['submissionDeadline', 'startDate', 'completionDate'];

export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }

  return result;
};

export const toDate = (timestamp: any): Date | undefined => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return undefined;
};

const numberFromMaybeString = (value: unknown): unknown => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export const normalizeCreatePaymentSchedule = (
  paymentSchedule: any,
  now: Date,
  createId: () => string
): BidPaymentStage[] | undefined => {
  if (!paymentSchedule) {
    return undefined;
  }

  if (typeof paymentSchedule === 'object' && !Array.isArray(paymentSchedule)) {
    if ('0' in paymentSchedule && '1' in paymentSchedule) {
      return Object.values(paymentSchedule) as BidPaymentStage[];
    }
    return undefined;
  }

  if (!Array.isArray(paymentSchedule)) {
    return undefined;
  }

  return paymentSchedule.map(payment => {
    const cleanPayment: BidPaymentStage = {
      id: payment.id || createId(),
      name: payment.name || 'Payment',
      percentage: payment.percentage || 0,
      amount: payment.amount || 0,
      status: payment.status || 'pending',
      createdAt: payment.createdAt instanceof Date ? payment.createdAt : now,
      updatedAt: payment.updatedAt instanceof Date ? payment.updatedAt : now,
    };

    if (payment.description) cleanPayment.description = payment.description;
    if (payment.phaseId) cleanPayment.phaseId = payment.phaseId;
    if (payment.phaseName) cleanPayment.phaseName = payment.phaseName;
    if (payment.completionRequirements) cleanPayment.completionRequirements = payment.completionRequirements;
    if (payment.expenseId) cleanPayment.expenseId = payment.expenseId;
    if (payment.invoiceId) cleanPayment.invoiceId = payment.invoiceId;
    if (payment.dueDate instanceof Date) cleanPayment.dueDate = payment.dueDate;
    if (payment.paymentDate instanceof Date) cleanPayment.paymentDate = payment.paymentDate;

    return cleanPayment;
  });
};

export const normalizeTags = (tags: any): string[] => {
  if (Array.isArray(tags)) {
    return tags.filter(tag => typeof tag === 'string');
  }

  if (tags && typeof tags === 'object') {
    return Object.values(tags).filter(tag => typeof tag === 'string') as string[];
  }

  return [];
};

export const normalizeAttachments = (attachments: any): string[] => {
  const convertedAttachments: string[] = [];
  const values = Array.isArray(attachments)
    ? attachments
    : attachments && typeof attachments === 'object'
      ? Object.values(attachments)
      : [];

  for (const item of values) {
    if (typeof item === 'string') {
      convertedAttachments.push(item);
    } else if (typeof item === 'object' && item !== null && 'url' in item && typeof item.url === 'string') {
      convertedAttachments.push(item.url);
    }
  }

  return convertedAttachments;
};

const normalizePaymentScheduleArray = (paymentSchedule: any): any[] => {
  if (paymentSchedule && typeof paymentSchedule === 'object' && !Array.isArray(paymentSchedule)) {
    if ('0' in paymentSchedule && '1' in paymentSchedule) {
      return Object.values(paymentSchedule);
    }
    return [];
  }

  return Array.isArray(paymentSchedule) ? paymentSchedule : [];
};

export const convertPaymentStageToFirestoreFormat = (payment: BidPaymentStage): FirestoreBidPaymentStage => {
  const result: any = {
    id: payment.id,
    name: payment.name,
    percentage: payment.percentage || 0,
    amount: payment.amount || 0,
    status: payment.status || 'pending',
    createdAt: payment.createdAt instanceof Date ? Timestamp.fromDate(payment.createdAt) : Timestamp.now(),
    updatedAt: payment.updatedAt instanceof Date ? Timestamp.fromDate(payment.updatedAt) : Timestamp.now(),
  };

  if (payment.description) result.description = payment.description;
  if (payment.phaseId) result.phaseId = payment.phaseId;
  if (payment.phaseName) result.phaseName = payment.phaseName;
  if (payment.completionRequirements) result.completionRequirements = payment.completionRequirements;
  if (payment.expenseId) result.expenseId = payment.expenseId;
  if (payment.invoiceId) result.invoiceId = payment.invoiceId;
  if (payment.dueDate instanceof Date) result.dueDate = Timestamp.fromDate(payment.dueDate);
  if (payment.paymentDate instanceof Date) result.paymentDate = Timestamp.fromDate(payment.paymentDate);

  return result as FirestoreBidPaymentStage;
};

export const convertVersionToFirestoreFormat = (version: BidVersion): FirestoreBidVersion => {
  const { createdAt, lineItems, ...rest } = version;

  const cleanVersion: FirestoreBidVersion = {
    ...(removeUndefined(rest) as Omit<FirestoreBidVersion, 'createdAt' | 'lineItems'>),
    createdAt: Timestamp.fromDate(createdAt || new Date()),
  };

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    cleanVersion.lineItems = lineItems.map(item => removeUndefined(item) as any);
  } else {
    cleanVersion.lineItems = [];
  }

  return cleanVersion;
};

export const convertToFirestoreFormat = (bid: Omit<Bid, 'id'>): FirestoreBid => {
  const {
    versions,
    createdAt,
    updatedAt,
    submissionDeadline,
    startDate,
    completionDate,
    paymentSchedule,
    tags,
    attachments,
    categoryId,
    ...rest
  } = bid;

  const convertedPaymentSchedule = normalizePaymentScheduleArray(paymentSchedule)
    .map(payment => convertPaymentStageToFirestoreFormat(payment));

  const firestoreBid: FirestoreBid = {
    ...removeUndefined(rest),
    userId: rest.userId,
    projectId: rest.projectId,
    totalAmount: rest.totalAmount || 0,
    status: rest.status || 'draft',
    createdAt: createdAt instanceof Date ? Timestamp.fromDate(createdAt) : Timestamp.now(),
    updatedAt: updatedAt instanceof Date ? Timestamp.fromDate(updatedAt) : Timestamp.now(),
    submissionDeadline: submissionDeadline ? (submissionDeadline instanceof Date ? Timestamp.fromDate(submissionDeadline) : null) : null,
    startDate: startDate ? (startDate instanceof Date ? Timestamp.fromDate(startDate) : null) : null,
    completionDate: completionDate ? (completionDate instanceof Date ? Timestamp.fromDate(completionDate) : null) : null,
    versions: versions ? versions.map(v => convertVersionToFirestoreFormat(v)) : [],
    tags: normalizeTags(tags),
    attachments: normalizeAttachments(attachments),
  };

  if (convertedPaymentSchedule.length > 0) {
    firestoreBid.paymentSchedule = convertedPaymentSchedule;
  }

  if (categoryId) {
    firestoreBid.categoryId = categoryId;
  }

  delete (firestoreBid as any).paymentTerms;
  delete (firestoreBid as any).description;

  return firestoreBid;
};

export const serializePaymentScheduleForUpdate = (paymentSchedule: BidPaymentStage[]): any[] => {
  return paymentSchedule.map(stage => {
    const processedStage = {
      ...stage,
      amount: numberFromMaybeString(stage.amount),
      percentage: numberFromMaybeString(stage.percentage),
    };

    const firestoreStage: any = { ...processedStage };

    if (stage.createdAt instanceof Date) {
      firestoreStage.createdAt = Timestamp.fromDate(stage.createdAt);
    }
    if (stage.updatedAt instanceof Date) {
      firestoreStage.updatedAt = Timestamp.fromDate(stage.updatedAt);
    }
    if (stage.dueDate instanceof Date) {
      firestoreStage.dueDate = Timestamp.fromDate(stage.dueDate);
    } else if (stage.dueDate === null) {
      firestoreStage.dueDate = null;
    } else if (stage.dueDate === undefined) {
      delete firestoreStage.dueDate;
    }

    if (stage.paymentDate instanceof Date) {
      firestoreStage.paymentDate = Timestamp.fromDate(stage.paymentDate);
    } else if (stage.paymentDate === null) {
      firestoreStage.paymentDate = null;
    } else if (stage.paymentDate === undefined) {
      delete firestoreStage.paymentDate;
    }

    if (stage.phaseId === undefined) {
      delete firestoreStage.phaseId;
    }

    if (stage.phaseName === undefined) {
      delete firestoreStage.phaseName;
    }

    return removeUndefined(firestoreStage);
  });
};

export const serializePaymentStageForScheduleUpdate = (stage: BidPaymentStage): any => {
  const firestoreStage: any = { ...stage };

  if (stage.dueDate instanceof Date) {
    firestoreStage.dueDate = Timestamp.fromDate(stage.dueDate);
  } else if (typeof stage.dueDate === 'string') {
    firestoreStage.dueDate = Timestamp.fromDate(new Date(stage.dueDate));
  }

  if (stage.paymentDate instanceof Date) {
    firestoreStage.paymentDate = Timestamp.fromDate(stage.paymentDate);
  } else if (typeof stage.paymentDate === 'string') {
    firestoreStage.paymentDate = Timestamp.fromDate(new Date(stage.paymentDate));
  }

  return firestoreStage;
};

export const normalizePaymentProgress = (progress: BidPaymentProgress): BidPaymentProgress => ({
  paid: numberFromMaybeString(progress.paid) as number,
  pending: numberFromMaybeString(progress.pending) as number,
  remaining: numberFromMaybeString(progress.remaining) as number,
});

export const serializeBidUpdatePayload = (bidData: Partial<Omit<Bid, 'id' | 'userId' | 'versions' | 'currentVersionId' | 'createdAt' | 'updatedAt'>>): any => {
  const updatePayload: any = {
    ...bidData,
    updatedAt: Timestamp.fromDate(new Date()),
  };

  if (bidData.paymentSchedule && Array.isArray(bidData.paymentSchedule)) {
    updatePayload.paymentSchedule = serializePaymentScheduleForUpdate(bidData.paymentSchedule);
  }

  if (bidData.paymentProgress) {
    updatePayload.paymentProgress = normalizePaymentProgress(bidData.paymentProgress);
  }

  for (const key in updatePayload) {
    if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
      if (updatePayload[key] instanceof Date && dateFields.includes(key)) {
        updatePayload[key] = Timestamp.fromDate(updatePayload[key]);
      } else if (updatePayload[key] === null && dateFields.includes(key)) {
        updatePayload[key] = null;
      }
    }
  }

  return removeUndefined(updatePayload);
};

export const convertFromFirestoreFormat = (data: FirestoreBid, id: string): Bid => {
  try {
    const { versions: firestoreVersions, paymentTerms, description, ...otherData } = data;

    const versions = firestoreVersions?.map(v => ({
      ...v,
      createdAt: toDate(v.createdAt) || new Date(),
      lineItems: Array.isArray(v.lineItems) ? v.lineItems : [],
    })) || [];

    let paymentSchedule: BidPaymentStage[] | undefined = undefined;
    if (data.paymentSchedule && Array.isArray(data.paymentSchedule)) {
      paymentSchedule = data.paymentSchedule.map(payment => {
        const converted: BidPaymentStage = {
          id: payment.id,
          name: payment.name,
          description: payment.description,
          percentage: payment.percentage,
          amount: payment.amount,
          status: payment.status,
          phaseId: payment.phaseId,
          phaseName: payment.phaseName,
          completionRequirements: payment.completionRequirements,
          expenseId: payment.expenseId,
          invoiceId: payment.invoiceId,
          createdAt: toDate(payment.createdAt) || new Date(),
          updatedAt: toDate(payment.updatedAt) || new Date(),
          dueDate: payment.dueDate ? toDate(payment.dueDate) : undefined,
        };

        if (payment.paymentDate) {
          converted.paymentDate = toDate(payment.paymentDate);
        }

        return converted;
      });
    }

    const paymentProgress = data.paymentProgress || {
      paid: 0,
      pending: data.totalAmount || 0,
      remaining: data.totalAmount || 0,
    };

    return {
      id,
      ...otherData,
      submissionDeadline: toDate(data.submissionDeadline),
      startDate: toDate(data.startDate),
      completionDate: toDate(data.completionDate),
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      versions,
      paymentSchedule,
      paymentProgress,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      attachments: Array.isArray(data.attachments) ? data.attachments : (data.attachments ? [data.attachments] : []),
    };
  } catch (err) {
    logger.error('Error converting bid from Firestore format:', err, data);
    throw new Error('Failed to process bid data');
  }
};
