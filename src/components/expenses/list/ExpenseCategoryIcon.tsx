import React from 'react';
import { Avatar } from '@mui/material';
import {
  Business as BusinessIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { ExpenseCategory } from '../../../types';

const categoryIcons: Record<ExpenseCategory, JSX.Element> = {
  labor: <Avatar sx={{ bgcolor: '#E1F5FE', color: '#0288D1' }}><BusinessIcon /></Avatar>,
  materials: <Avatar sx={{ bgcolor: '#E8F5E9', color: '#388E3C' }}><CategoryIcon /></Avatar>,
  equipment: <Avatar sx={{ bgcolor: '#FFF8E1', color: '#FFA000' }}><CategoryIcon /></Avatar>,
  permits: <Avatar sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2' }}><ReceiptIcon /></Avatar>,
  subcontractor: <Avatar sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2' }}><BusinessIcon /></Avatar>,
  other: <Avatar sx={{ bgcolor: '#ECEFF1', color: '#607D8B' }}><DescriptionIcon /></Avatar>,
};

export function getExpenseCategoryIcon(category: ExpenseCategory | string | undefined): JSX.Element {
  return categoryIcons[category as ExpenseCategory] || categoryIcons.other;
}
