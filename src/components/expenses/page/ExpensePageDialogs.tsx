import React from 'react';
import { Expense, PaymentDetails, Project, ProjectPhase } from '../../../types';
import ExpenseFormModal from '../ExpenseFormModal';
import PaymentFormModal from '../PaymentFormModal';

interface ExpensePageDialogsProps {
  expenseModalOpen: boolean;
  paymentModalOpen: boolean;
  selectedExpense: Partial<Expense> | null;
  fullExpenseForPayment: Expense | null;
  projects: Project[];
  projectPhases: ProjectPhase[];
  onCloseExpenseModal: () => void;
  onClosePaymentModal: () => void;
  onSaveExpense: (expense: Partial<Expense>) => Promise<void> | void;
  onSavePayment: (actualAmountPaid: number, paymentDetails: PaymentDetails) => Promise<void> | void;
}

export function ExpensePageDialogs({
  expenseModalOpen,
  paymentModalOpen,
  selectedExpense,
  fullExpenseForPayment,
  projects,
  projectPhases,
  onCloseExpenseModal,
  onClosePaymentModal,
  onSaveExpense,
  onSavePayment,
}: ExpensePageDialogsProps) {
  return (
    <>
      <ExpenseFormModal
        key={`expense-form-${selectedExpense?.id || 'new'}`}
        open={expenseModalOpen}
        onClose={onCloseExpenseModal}
        expense={selectedExpense || undefined}
        onSave={onSaveExpense}
        projects={projects}
        projectPhases={projectPhases}
      />

      <PaymentFormModal
        key={`payment-form-${fullExpenseForPayment?.id || 'none'}`}
        open={paymentModalOpen}
        onClose={onClosePaymentModal}
        expense={fullExpenseForPayment}
        onSave={onSavePayment}
      />
    </>
  );
}
