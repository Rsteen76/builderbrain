import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Autocomplete,
  Box,
  Chip,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Engineering as BuildingPhaseIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as BidIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CategorySelector from '../../common/CategorySelector';
import SubcontractorSelector from '../../common/SubcontractorSelector';
import VendorSelector from '../../common/VendorSelector';
import type { Bid, Expense, Project, ProjectPhase } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';
import ExpenseLineItemsSection from './ExpenseLineItemsSection';
import { availableExpenseCategories, formatCategoryName } from './expenseFormOptions';
import type { FormErrors } from './types';

interface ExpenseMainInfoSectionProps {
  formData: Partial<Expense>;
  errors: FormErrors;
  projects: Project[];
  currentProjectPhases: ProjectPhase[];
  phaseOptions: Array<{ value: string; label: string }>;
  expenseDescriptionOptions: string[];
  tags: string[];
  availableBids: Bid[];
  loadingBids: boolean;
  projectSelectDisabled: boolean;
  showLineItems: boolean;
  lineItems: ExpenseLineItemFormData[];
  totalLineItemsAmount: number;
  backendError: string | null;
  onSelectChange: (event: SelectChangeEvent) => void;
  onDateChange: (date: Date | null) => void;
  onPhaseChange: (event: SelectChangeEvent<string>) => void;
  onFieldChange: (name: string, value: any) => void;
  onVendorChange: (vendor: string) => void;
  onDetailedCategoryChange: (categoryId: string) => void;
  onSubcontractorChange: (subcontractorId: string, subcontractorName: string) => void;
  onToggleLineItems: () => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (id: string) => void;
  onLineItemChange: (
    id: string,
    field: keyof Omit<ExpenseLineItemFormData, 'id' | 'totalPrice'>,
    value: string | number
  ) => void;
  onTagsChange: (event: React.SyntheticEvent, newTags: string[]) => void;
}

const ExpenseMainInfoSection: React.FC<ExpenseMainInfoSectionProps> = ({
  formData,
  errors,
  projects,
  currentProjectPhases,
  phaseOptions,
  expenseDescriptionOptions,
  tags,
  availableBids,
  loadingBids,
  projectSelectDisabled,
  showLineItems,
  lineItems,
  totalLineItemsAmount,
  backendError,
  onSelectChange,
  onDateChange,
  onPhaseChange,
  onFieldChange,
  onVendorChange,
  onDetailedCategoryChange,
  onSubcontractorChange,
  onToggleLineItems,
  onAddLineItem,
  onRemoveLineItem,
  onLineItemChange,
  onTagsChange,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'block', p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.projectId} variant="outlined" size="small">
            <InputLabel id="project-label">Project</InputLabel>
            <Select
              labelId="project-label"
              id="projectId"
              name="projectId"
              value={formData.projectId || ''}
              onChange={onSelectChange}
              label="Project"
              disabled={projectSelectDisabled}
              startAdornment={
                <InputAdornment position="start">
                  <ProjectIcon fontSize="small" color="primary" />
                </InputAdornment>
              }
            >
              <MenuItem value="" disabled>
                <Typography variant="body2" color="text.secondary">Select a project</Typography>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
            {errors.projectId && (
              <FormHelperText error>{errors.projectId}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={typeof formData.date === 'string' ? new Date(formData.date) : formData.date || null}
              onChange={onDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.date,
                  helperText: errors.date,
                  size: 'small',
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.phaseId}>
            <InputLabel id="phase-label">Phase</InputLabel>
            <Select
              labelId="phase-label"
              id="phaseId"
              name="phaseId"
              value={formData.phaseId || ''}
              onChange={onPhaseChange}
              label="Phase"
              startAdornment={
                <InputAdornment position="start">
                  <BuildingPhaseIcon fontSize="small" color="action" />
                </InputAdornment>
              }
              disabled={!formData.projectId || currentProjectPhases.length === 0}
            >
              <MenuItem value="">
                <em>{formData.projectId ? (currentProjectPhases.length > 0 ? 'Select Phase' : 'No Phases Available') : 'Select Project First'}</em>
              </MenuItem>
              {phaseOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.phaseId && <FormHelperText>{errors.phaseId}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.category}>
            <InputLabel id="category-label">General Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={(e) => onFieldChange('category', e.target.value as Expense['category'])}
              label="General Category"
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon fontSize="small" color="primary" />
                </InputAdornment>
              }
            >
              {availableExpenseCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {formatCategoryName(category)}
                </MenuItem>
              ))}
            </Select>
            {errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <CategorySelector
            value={formData.categoryId || ''}
            onCategorySelected={onDetailedCategoryChange}
            label="Specific Construction Category"
            size="small"
            phaseId={formData.phaseId}
            projectPhases={currentProjectPhases}
          />
          <Typography variant="caption" color="text.secondary">
            Select a construction-specific classification
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            fullWidth
            freeSolo
            id="expense-description"
            options={expenseDescriptionOptions}
            value={formData.description || ''}
            onChange={(_event, newValue) => {
              onFieldChange('description', newValue || '');
            }}
            inputValue={formData.description || ''}
            onInputChange={(_event, newInputValue) => {
              onFieldChange('description', newInputValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Description"
                required
                size="small"
                placeholder="Select or type a description..."
                error={!!errors.description}
                helperText={errors.description}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <VendorSelector
            value={formData.vendor || ''}
            onChange={onVendorChange}
            error={!!errors.vendor}
            helperText={errors.vendor}
          />
        </Grid>

        {formData.category === 'subcontractor' && (
          <Grid item xs={12} sm={6}>
            <SubcontractorSelector
              value={formData.subcontractorId || ''}
              onChange={onSubcontractorChange}
              error={!!errors.subcontractorId}
              helperText={errors.subcontractorId}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <ExpenseLineItemsSection
            amount={formData.amount}
            amountPaid={formData.amountPaid}
            status={formData.status}
            showLineItems={showLineItems}
            amountError={errors.amount}
            lineItemErrors={errors.lineItems}
            lineItems={lineItems}
            totalLineItemsAmount={totalLineItemsAmount}
            onToggleLineItems={onToggleLineItems}
            onAmountChange={(amount) => onFieldChange('amount', amount)}
            onAddLineItem={onAddLineItem}
            onRemoveLineItem={onRemoveLineItem}
            onLineItemChange={onLineItemChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={!!errors.bidId}>
            <InputLabel id="bid-label">Link to Bid</InputLabel>
            <Select
              labelId="bid-label"
              id="bidId"
              name="bidId"
              value={formData.bidId || ''}
              onChange={(e) => onFieldChange('bidId', e.target.value)}
              label="Link to Bid"
              startAdornment={
                <InputAdornment position="start">
                  <BidIcon fontSize="small" color="primary" />
                </InputAdornment>
              }
              disabled={!formData.projectId || availableBids.length === 0 || loadingBids}
            >
              <MenuItem value="">
                <em>{loadingBids ? 'Loading bids...' :
                  formData.projectId ?
                    (availableBids.length > 0 ? 'Select a Bid (Optional)' : 'No Accepted Bids Available') :
                    'Select Project First'}</em>
              </MenuItem>
              {availableBids.map((bid) => (
                <MenuItem key={bid.id} value={bid.id}>
                  {bid.title || 'Bid'} - {bid.subcontractorName || 'Unknown'} (${bid.totalAmount?.toFixed(2)})
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {formData.bidId ? 'This expense will be linked to the selected bid' : 'Linking to a bid will update its payment progress'}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mt: 1,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Additional Notes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                placeholder="Enter any additional notes here..."
                size="small"
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Tags
          </Typography>
          <Autocomplete
            multiple
            id="tags"
            options={[]}
            value={tags}
            onChange={onTagsChange}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder="Add tags (press Enter after each tag)"
                fullWidth
              />
            )}
          />
          <Typography variant="caption" color="text.secondary">
            Add tags to categorize this expense
          </Typography>
        </Grid>

        {backendError && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              color="error"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                p: 1,
                borderRadius: 1,
              }}
            >
              {backendError}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ExpenseMainInfoSection;
