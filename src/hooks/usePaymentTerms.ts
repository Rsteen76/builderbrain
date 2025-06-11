// src/hooks/usePaymentTerms.ts
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BidPaymentTermsFormData, BidPaymentInstallmentFormData } from '../types/form.types';
import { ProjectPhase } from '../types'; // Assuming ProjectPhase is in ../types

export interface UsePaymentTermsReturn {
  paymentTerms: BidPaymentTermsFormData;
  setPaymentTerms: React.Dispatch<React.SetStateAction<BidPaymentTermsFormData>>; // For direct initialization/override
  applyPaymentTemplate: (template: 'one-time' | 'standard' | 'trades' | 'custom') => void;
  updateDownPayment: (value: number, isFixedAmountInput: boolean) => void;
  addInstallment: () => void;
  updateInstallment: (id: string, field: keyof Omit<BidPaymentInstallmentFormData, 'id'>, value: any) => void;
  removeInstallment: (id: string) => void;
  getTotalScheduledAmount: () => number;
  getTotalScheduledPercent: (currentTotalBidAmount: number) => number;
  // syncInstallmentPhasesWithBidPhase: (bidPhaseId?: string, bidPhaseName?: string) => void; // New
}

const defaultInstallment = (bidPhaseId?: string, bidPhaseName?: string): BidPaymentInstallmentFormData => ({
  id: uuidv4(),
  name: 'Final Payment',
  percent: 80, // Default to make up 100% with default down payment
  isFixedAmount: false,
  fixedAmount: 0, // Will be calculated
  milestoneDescription: 'Upon completion',
  phaseId: bidPhaseId,
  phaseName: bidPhaseName,
  manuallyConfigured: false,
});

const defaultPaymentTermsState = (bidPhaseId?: string, bidPhaseName?: string): BidPaymentTermsFormData => ({
    downPaymentPercent: 20,
    isDownPaymentFixed: false,
    downPaymentAmount: 0, // Will be calculated by useEffect based on totalBidAmount
    installments: [defaultInstallment(bidPhaseId, bidPhaseName)],
    syncInstallmentPhases: true,
});

export const usePaymentTerms = (
  totalBidAmount: number,
  allProjectPhases: ProjectPhase[] = [],
  currentBidPhaseId?: string
): UsePaymentTermsReturn => {
  const [paymentTerms, setPaymentTerms] = useState<BidPaymentTermsFormData>(() => {
      const phase = allProjectPhases.find(p => p.id === currentBidPhaseId);
      return defaultPaymentTermsState(currentBidPhaseId, phase?.name);
  });

  // Effect to initialize/update amounts when totalBidAmount changes or fixed type changes
  useEffect(() => {
    setPaymentTerms(prev => {
      let newDownPaymentAmount = prev.downPaymentAmount;
      if (prev.isDownPaymentFixed) {
        // If fixed, percent might need recalc if totalBidAmount changed
        const newDownPaymentPercent = totalBidAmount > 0 ? (prev.downPaymentAmount / totalBidAmount) * 100 : 0;
        newDownPaymentAmount = prev.downPaymentAmount; // keep fixed amount
        return {
          ...prev,
          downPaymentPercent: newDownPaymentPercent,
          installments: prev.installments.map(inst => ({
            ...inst,
            fixedAmount: inst.isFixedAmount ? inst.fixedAmount : totalBidAmount * (inst.percent / 100),
            percent: inst.isFixedAmount && totalBidAmount > 0 ? (inst.fixedAmount / totalBidAmount) * 100 : inst.percent,
          }))
        };
      } else {
        // If percentage based, recalc amount
        newDownPaymentAmount = totalBidAmount * (prev.downPaymentPercent / 100);
        return {
          ...prev,
          downPaymentAmount: newDownPaymentAmount,
          installments: prev.installments.map(inst => ({
            ...inst,
            fixedAmount: totalBidAmount * (inst.percent / 100), // always recalc fixed if master is percentage
          }))
        };
      }
    });
  }, [totalBidAmount, paymentTerms.isDownPaymentFixed]); // Removed paymentTerms.downPaymentPercent from deps to avoid loop with updateDownPayment


  const getDefaultPhaseForInstallment = useCallback(() => {
      const phase = allProjectPhases.find(p => p.id === currentBidPhaseId);
      return {
          phaseId: phase?.id,
          phaseName: phase?.name
      };
  }, [allProjectPhases, currentBidPhaseId]);


  const updateDownPayment = useCallback((value: number, isFixedAmountInput: boolean) => {
    setPaymentTerms(prev => {
      const newTerms = { ...prev, isDownPaymentFixed: isFixedAmountInput };
      if (isFixedAmountInput) { // User is inputting a fixed amount for down payment
        newTerms.downPaymentAmount = Math.max(0, value);
        newTerms.downPaymentPercent = totalBidAmount > 0 ? (newTerms.downPaymentAmount / totalBidAmount) * 100 : 0;
      } else { // User is inputting a percentage for down payment
        newTerms.downPaymentPercent = Math.max(0, Math.min(100, value));
        newTerms.downPaymentAmount = totalBidAmount * (newTerms.downPaymentPercent / 100);
      }
      return newTerms;
    });
  }, [totalBidAmount]);

  const addInstallment = useCallback(() => {
    setPaymentTerms(prev => {
      const defaultPhaseDetails = getDefaultPhaseForInstallment();
      const newInstallment: BidPaymentInstallmentFormData = {
        id: uuidv4(),
        name: '', // Will be set below
        percent: 0,
        isFixedAmount: prev.isDownPaymentFixed,
        fixedAmount: 0,
        milestoneDescription: '',
        phaseId: prev.syncInstallmentPhases ? defaultPhaseDetails.phaseId : undefined,
        phaseName: prev.syncInstallmentPhases ? defaultPhaseDetails.phaseName : undefined,
        manuallyConfigured: !prev.syncInstallmentPhases,
      };

      let updatedInstallments = [...prev.installments];
      if (updatedInstallments.length === 0) {
        newInstallment.name = 'Final Payment';
        // If it's the first installment added (after potentially empty), it should take remaining percentage
        newInstallment.percent = 100 - prev.downPaymentPercent;
        if (prev.isDownPaymentFixed) newInstallment.fixedAmount = totalBidAmount - prev.downPaymentAmount;
        else newInstallment.fixedAmount = totalBidAmount * (newInstallment.percent / 100);

      } else {
         // Rename the previous "Final Payment" to a numbered installment if it exists
        const finalPaymentIndex = updatedInstallments.findIndex(inst => inst.name === 'Final Payment');
        if (finalPaymentIndex !== -1) {
            updatedInstallments[finalPaymentIndex].name = `Installment ${finalPaymentIndex + 1}`;
        } else {
            // If no "Final Payment", just add as next number
            updatedInstallments.forEach((inst, idx) => {
              if (!inst.name.startsWith("Installment")) inst.name = `Installment ${idx + 1}`;
            });
        }
        newInstallment.name = 'Final Payment'; // The new one is always the final payment
      }

      return { ...prev, installments: [...updatedInstallments, newInstallment] };
    });
  }, [paymentTerms.isDownPaymentFixed, paymentTerms.syncInstallmentPhases, getDefaultPhaseForInstallment, totalBidAmount]);


  const updateInstallment = useCallback((id: string, field: keyof Omit<BidPaymentInstallmentFormData, 'id'>, value: any) => {
    setPaymentTerms(prev => ({
      ...prev,
      installments: prev.installments.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          if (field === 'isFixedAmount') {
            if (value === true) { // Switching to fixed amount
              updatedItem.fixedAmount = totalBidAmount > 0 ? totalBidAmount * (updatedItem.percent / 100) : 0;
            } else { // Switching to percentage
              updatedItem.percent = totalBidAmount > 0 ? (updatedItem.fixedAmount / totalBidAmount) * 100 : 0;
            }
          } else if (field === 'fixedAmount' && updatedItem.isFixedAmount) {
              updatedItem.percent = totalBidAmount > 0 ? (Number(value) / totalBidAmount) * 100 : 0;
          } else if (field === 'percent' && !updatedItem.isFixedAmount) {
              updatedItem.fixedAmount = totalBidAmount > 0 ? totalBidAmount * (Number(value) / 100) : 0;
          }

          if (field === 'phaseId') {
            const phase = allProjectPhases.find(p => p.id === value);
            updatedItem.phaseName = phase?.name;
            updatedItem.manuallyConfigured = true;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  }, [totalBidAmount, allProjectPhases]);

  const removeInstallment = useCallback((id: string) => {
    setPaymentTerms(prev => ({
      ...prev,
      installments: prev.installments.filter(item => item.id !== id),
    }));
  }, []);

  const applyPaymentTemplate = useCallback((template: 'one-time' | 'standard' | 'trades' | 'custom') => {
    const defaultPhaseDetails = getDefaultPhaseForInstallment();
    const useFixed = paymentTerms.isDownPaymentFixed;

    let newDownPaymentPercent = 0;
    let newInstallments: BidPaymentInstallmentFormData[] = [];

    switch(template) {
      case 'one-time':
        newDownPaymentPercent = 100;
        newInstallments = [];
        break;
      case 'standard': // 50/50
        newDownPaymentPercent = 50;
        newInstallments = [
          {
            id: uuidv4(), name: 'Final Payment', percent: 50, fixedAmount: totalBidAmount * 0.5, isFixedAmount: useFixed,
            milestoneDescription: 'Upon completion', phaseId: defaultPhaseDetails.phaseId, phaseName: defaultPhaseDetails.phaseName, manuallyConfigured: !paymentTerms.syncInstallmentPhases,
          }
        ];
        break;
      case 'trades': // 30/40/30
        newDownPaymentPercent = 30;
        newInstallments = [
          {
            id: uuidv4(), name: 'Rough-In', percent: 40, fixedAmount: totalBidAmount * 0.4, isFixedAmount: useFixed,
            milestoneDescription: 'After rough-in inspection', phaseId: defaultPhaseDetails.phaseId, phaseName: defaultPhaseDetails.phaseName, manuallyConfigured: !paymentTerms.syncInstallmentPhases,
          },
          {
            id: uuidv4(), name: 'Final Payment', percent: 30, fixedAmount: totalBidAmount * 0.3, isFixedAmount: useFixed,
            milestoneDescription: 'After final inspection', phaseId: defaultPhaseDetails.phaseId, phaseName: defaultPhaseDetails.phaseName, manuallyConfigured: !paymentTerms.syncInstallmentPhases,
          }
        ];
        break;
      case 'custom':
        // For custom, we might reset to a simple 20/80 or just keep current values
        // For now, let's reset to a default 20/80 to give a clear custom starting point
        newDownPaymentPercent = 20;
        const remainingPercent = 100 - newDownPaymentPercent;
        newInstallments = [
            {
                id: uuidv4(), name: 'Final Payment', percent: remainingPercent,
                fixedAmount: totalBidAmount * (remainingPercent/100), isFixedAmount: useFixed,
                milestoneDescription: 'Upon completion', phaseId: defaultPhaseDetails.phaseId,
                phaseName: defaultPhaseDetails.phaseName, manuallyConfigured: !paymentTerms.syncInstallmentPhases,
            }
        ];
        break;
    }
    setPaymentTerms(prev => ({
        ...prev,
        downPaymentPercent: newDownPaymentPercent,
        downPaymentAmount: totalBidAmount * (newDownPaymentPercent / 100),
        isDownPaymentFixed: useFixed,
        installments: newInstallments,
      }));

}, [totalBidAmount, paymentTerms.isDownPaymentFixed, paymentTerms.syncInstallmentPhases, getDefaultPhaseForInstallment]);

  const getTotalScheduledAmount = useCallback(() => {
    const down = paymentTerms.isDownPaymentFixed ? paymentTerms.downPaymentAmount : totalBidAmount * (paymentTerms.downPaymentPercent / 100);
    const installmentsTotal = paymentTerms.installments.reduce((sum, item) => {
        return sum + (item.isFixedAmount ? item.fixedAmount : totalBidAmount * (item.percent / 100));
    }, 0);
    return down + installmentsTotal;
  }, [paymentTerms, totalBidAmount]);

  const getTotalScheduledPercent = useCallback((currentTotalBidAmount: number) => {
    if (currentTotalBidAmount === 0) return 0;
    const totalAmountScheduled = getTotalScheduledAmount(); // Uses the internal totalBidAmount
    return (totalAmountScheduled / currentTotalBidAmount) * 100;
  }, [getTotalScheduledAmount]); // Depends on getTotalScheduledAmount which depends on paymentTerms and totalBidAmount from hook args

  // Effect to sync installment phases when currentBidPhaseId or syncInstallmentPhases changes
  useEffect(() => {
    if (paymentTerms.syncInstallmentPhases && currentBidPhaseId) {
      const defaultPhaseDetails = getDefaultPhaseForInstallment();
      setPaymentTerms(prev => ({
        ...prev,
        installments: prev.installments.map(inst =>
          inst.manuallyConfigured ? inst : { // Only update if not manually configured
            ...inst,
            phaseId: defaultPhaseDetails.phaseId,
            phaseName: defaultPhaseDetails.phaseName,
          }
        )
      }));
    }
  }, [currentBidPhaseId, paymentTerms.syncInstallmentPhases, getDefaultPhaseForInstallment]);


  return {
    paymentTerms,
    setPaymentTerms,
    applyPaymentTemplate,
    updateDownPayment,
    addInstallment,
    updateInstallment,
    removeInstallment,
    getTotalScheduledAmount,
    getTotalScheduledPercent,
  };
};
