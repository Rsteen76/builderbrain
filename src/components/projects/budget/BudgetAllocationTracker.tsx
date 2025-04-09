import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  useTheme,
  alpha,
  Card,
  CardHeader,
  CardContent,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Expense, Bid, ProjectPhase, Project } from '../../../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

// Define standard construction categories
const CONSTRUCTION_CATEGORIES = {
  // Pre-Construction
  'pre_construction': [
    { id: 'design_fees', name: 'Design Fees', description: 'Architectural and engineering design services' },
    { id: 'permits', name: 'Permits & Fees', description: 'Building permits, impact fees, connection fees' },
    { id: 'surveys', name: 'Surveys', description: 'Land surveys, soil testing, environmental studies' },
    { id: 'insurance', name: 'Insurance', description: 'Builder\'s risk insurance, liability insurance' },
  ],
  
  // Site Work
  'site_work': [
    { id: 'demolition', name: 'Demolition', description: 'Removal of existing structures' },
    { id: 'excavation_grading', name: 'Excavation & Grading', description: 'Site preparation, earth moving, grading' },
    { id: 'utilities', name: 'Utilities', description: 'Water, sewer, gas, electrical service connections' },
    { id: 'erosion_control', name: 'Erosion Control', description: 'Silt fencing, erosion mats, drainage' },
    { id: 'site_improvements', name: 'Site Improvements', description: 'Driveways, walkways, landscaping' },
  ],
  
  // Foundation
  'foundation': [
    { id: 'footings', name: 'Footings', description: 'Concrete footings and foundation support' },
    { id: 'foundation_walls', name: 'Foundation Walls', description: 'Poured concrete or block foundation walls' },
    { id: 'waterproofing', name: 'Waterproofing', description: 'Foundation waterproofing, drain tile' },
    { id: 'concrete_slab', name: 'Concrete Slab', description: 'Basement or main level concrete slab' },
  ],
  
  // Framing
  'framing': [
    { id: 'rough_framing', name: 'Rough Framing', description: 'Wall, floor and roof framing' },
    { id: 'roof_trusses', name: 'Roof Trusses', description: 'Engineered roof trusses or rafters' },
    { id: 'sheathing', name: 'Sheathing', description: 'Wall and roof sheathing materials' },
    { id: 'steel_framing', name: 'Steel Framing', description: 'Structural steel and metal framing' },
  ],
  
  // Exterior Envelope
  'exterior': [
    { id: 'roofing', name: 'Roofing', description: 'Roofing materials and installation' },
    { id: 'siding', name: 'Siding & Facade', description: 'Exterior cladding materials' },
    { id: 'windows', name: 'Windows', description: 'Windows, skylights, glass installations' },
    { id: 'exterior_doors', name: 'Exterior Doors', description: 'Entry doors, garage doors, patio doors' },
    { id: 'masonry', name: 'Masonry', description: 'Brick, stone, or block work' },
    { id: 'gutters', name: 'Gutters & Downspouts', description: 'Rainwater management systems' },
  ],
  
  // Mechanical Systems
  'mechanical': [
    { id: 'hvac', name: 'HVAC', description: 'Heating, ventilation, air conditioning systems' },
    { id: 'plumbing', name: 'Plumbing', description: 'Supply, waste and vent piping, fixtures' },
    { id: 'electrical', name: 'Electrical', description: 'Wiring, outlets, switches, panels' },
    { id: 'low_voltage', name: 'Low Voltage', description: 'Audio/video, security, networking' },
    { id: 'fire_protection', name: 'Fire Protection', description: 'Sprinklers, alarms, fire suppression' },
  ],
  
  // Insulation & Interior Walls
  'interior_rough': [
    { id: 'insulation', name: 'Insulation', description: 'Wall, ceiling, and floor insulation' },
    { id: 'drywall', name: 'Drywall/Plaster', description: 'Interior wall and ceiling finishes' },
    { id: 'interior_framing', name: 'Interior Framing', description: 'Non-load bearing walls and soffits' },
    { id: 'soundproofing', name: 'Soundproofing', description: 'Acoustic treatments and sound barriers' },
  ],
  
  // Interior Finishes
  'interior_finishes': [
    { id: 'flooring', name: 'Flooring', description: 'All flooring materials and installation' },
    { id: 'painting', name: 'Painting', description: 'Interior painting and wallcoverings' },
    { id: 'trim_carpentry', name: 'Trim Carpentry', description: 'Baseboards, crown molding, casings' },
    { id: 'cabinets', name: 'Cabinets', description: 'Kitchen and bathroom cabinetry' },
    { id: 'countertops', name: 'Countertops', description: 'Kitchen and bathroom countertops' },
    { id: 'tile', name: 'Tile Work', description: 'Ceramic, porcelain, stone tile installation' },
    { id: 'interior_doors', name: 'Interior Doors', description: 'Interior passage and closet doors' },
  ],
  
  // Fixtures & Appliances
  'fixtures': [
    { id: 'plumbing_fixtures', name: 'Plumbing Fixtures', description: 'Sinks, faucets, tubs, toilets' },
    { id: 'lighting_fixtures', name: 'Lighting Fixtures', description: 'Interior and exterior lighting' },
    { id: 'appliances', name: 'Appliances', description: 'Kitchen and laundry appliances' },
    { id: 'hardware', name: 'Hardware', description: 'Door hardware, bath accessories' },
  ],
  
  // Specialty Features
  'specialty': [
    { id: 'stairs', name: 'Stairs', description: 'Interior and exterior stairs and railings' },
    { id: 'fireplace', name: 'Fireplace', description: 'Fireplaces and chimneys' },
    { id: 'deck_patio', name: 'Deck/Patio', description: 'Outdoor living spaces' },
    { id: 'pool_spa', name: 'Pool/Spa', description: 'Swimming pools, hot tubs, saunas' },
    { id: 'smart_home', name: 'Smart Home', description: 'Home automation and technology' },
    { id: 'solar', name: 'Solar/Renewable', description: 'Solar panels, renewable energy systems' },
  ],
  
  // Project Management
  'management': [
    { id: 'general_conditions', name: 'General Conditions', description: 'Job site supervision, temporary utilities' },
    { id: 'project_management', name: 'Project Management', description: 'Contractor management fees' },
    { id: 'cleanup', name: 'Cleanup', description: 'Construction cleanup and waste removal' },
    { id: 'contingency', name: 'Contingency', description: 'Budget reserve for unforeseen costs' },
  ],
};

// Utility function to map bids and expenses to construction categories
const mapItemToCategory = (description: string, phaseId?: string): string | null => {
  // Convert to lowercase for case-insensitive matching
  const desc = description.toLowerCase();
  
  // Map by keywords in description
  if (desc.includes('architect') || desc.includes('design') || desc.includes('engineering')) return 'design_fees';
  if (desc.includes('permit') || desc.includes('inspection') || desc.includes('fee') && desc.includes('building')) return 'permits';
  if (desc.includes('survey') || desc.includes('soil') || desc.includes('test')) return 'surveys';
  if (desc.includes('insurance') || desc.includes('bond')) return 'insurance';
  if (desc.includes('demo')) return 'demolition';
  if (desc.includes('excav') || desc.includes('grad') || desc.includes('dirt') || desc.includes('earth')) return 'excavation_grading';
  if (desc.includes('utilit') || desc.includes('sewer') || desc.includes('water line')) return 'utilities';
  if (desc.includes('erosion') || desc.includes('silt') || desc.includes('fence') && desc.includes('control')) return 'erosion_control';
  if (desc.includes('driveway') || desc.includes('walkway') || desc.includes('landscape')) return 'site_improvements';
  if (desc.includes('foot') && (desc.includes('foundation') || desc.includes('concrete'))) return 'footings';
  if (desc.includes('foundation') && desc.includes('wall')) return 'foundation_walls';
  if (desc.includes('waterproof') || desc.includes('dampproof') || desc.includes('drain tile')) return 'waterproofing';
  if (desc.includes('slab') || desc.includes('concrete') && (desc.includes('floor') || desc.includes('basement'))) return 'concrete_slab';
  if (desc.includes('fram') && !desc.includes('trim')) return 'rough_framing';
  if (desc.includes('truss') || desc.includes('rafter')) return 'roof_trusses';
  if (desc.includes('sheath') || desc.includes('plywood') || desc.includes('osb')) return 'sheathing';
  if (desc.includes('steel') || desc.includes('metal') && desc.includes('fram')) return 'steel_framing';
  if (desc.includes('roof') && !desc.includes('truss')) return 'roofing';
  if (desc.includes('siding') || desc.includes('facade') || desc.includes('cladding')) return 'siding';
  if (desc.includes('window')) return 'windows';
  if ((desc.includes('door') && desc.includes('exterior')) || desc.includes('entry') || desc.includes('garage door')) return 'exterior_doors';
  if (desc.includes('brick') || desc.includes('stone') || desc.includes('mason')) return 'masonry';
  if (desc.includes('gutter') || desc.includes('downspout')) return 'gutters';
  if (desc.includes('hvac') || desc.includes('heat') || desc.includes('air conditioning') || desc.includes('furnace')) return 'hvac';
  if (desc.includes('plumb') && !desc.includes('fixture')) return 'plumbing';
  if (desc.includes('electric') && !desc.includes('fixture')) return 'electrical';
  if (desc.includes('low voltage') || desc.includes('audio') || desc.includes('security')) return 'low_voltage';
  if (desc.includes('fire') || desc.includes('sprinkler') || desc.includes('alarm')) return 'fire_protection';
  if (desc.includes('insulat')) return 'insulation';
  if (desc.includes('drywall') || desc.includes('plaster') || desc.includes('sheet') && desc.includes('rock')) return 'drywall';
  if ((desc.includes('fram') && desc.includes('interior')) || desc.includes('partition')) return 'interior_framing';
  if (desc.includes('sound') || desc.includes('acoustic')) return 'soundproofing';
  if (desc.includes('floor') && !desc.includes('fram')) return 'flooring';
  if (desc.includes('paint') || desc.includes('wall') && desc.includes('cover')) return 'painting';
  if (desc.includes('trim') || desc.includes('baseboard') || desc.includes('crown') || desc.includes('mold')) return 'trim_carpentry';
  if (desc.includes('cabinet')) return 'cabinets';
  if (desc.includes('counter')) return 'countertops';
  if (desc.includes('tile')) return 'tile';
  if ((desc.includes('door') && desc.includes('interior')) || desc.includes('closet door')) return 'interior_doors';
  if ((desc.includes('plumb') && desc.includes('fixture')) || desc.includes('sink') || desc.includes('toilet') || desc.includes('tub')) return 'plumbing_fixtures';
  if (desc.includes('light') && desc.includes('fixture')) return 'lighting_fixtures';
  if (desc.includes('appliance') || desc.includes('refrigerator') || desc.includes('oven') || desc.includes('dishwasher')) return 'appliances';
  if (desc.includes('hardware') || desc.includes('handle') || desc.includes('knob')) return 'hardware';
  if (desc.includes('stair') || desc.includes('railing')) return 'stairs';
  if (desc.includes('fireplace') || desc.includes('chimney')) return 'fireplace';
  if (desc.includes('deck') || desc.includes('patio')) return 'deck_patio';
  if (desc.includes('pool') || desc.includes('spa') || desc.includes('hot tub')) return 'pool_spa';
  if (desc.includes('smart') || desc.includes('home automation')) return 'smart_home';
  if (desc.includes('solar') || desc.includes('renewable')) return 'solar';
  if (desc.includes('general conditions') || desc.includes('supervision') || desc.includes('job site')) return 'general_conditions';
  if (desc.includes('project management') || desc.includes('contractor fee')) return 'project_management';
  if (desc.includes('clean') || desc.includes('debris') || desc.includes('trash')) return 'cleanup';
  if (desc.includes('contingency') || desc.includes('reserve')) return 'contingency';
  
  // If no specific match, try to categorize by phase
  if (phaseId) {
    // This is a placeholder - you'll need to implement more sophisticated logic based on your phase structure
    // Ideally, you'd map each phase ID to the most relevant category
    return null;
  }
  
  // No match found
  return null;
};

interface BudgetAllocationTrackerProps {
  project: Project | null;
  phases: ProjectPhase[];
  expenses: Expense[];
  bids: Bid[];
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  project,
  phases,
  expenses,
  bids
}) => {
  const theme = useTheme();
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Toggle expansion of a category section
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Calculate allocated amounts for each construction category
  const categoryAllocations = useMemo(() => {
    // Create an map to store allocation data for each category
    const allocations: Record<string, {
      categoryId: string;
      allocated: number;
      paid: number;
      pending: number;
      items: Array<{
        id: string;
        description: string;
        amount: number;
        type: 'expense' | 'bid';
        status: string;
        phaseId?: string;
        date?: string | Date;
      }>;
    }> = {};
    
    // Initialize all categories
    Object.entries(CONSTRUCTION_CATEGORIES).forEach(([section, categories]) => {
      categories.forEach(category => {
        allocations[category.id] = {
          categoryId: category.id,
          allocated: 0,
          paid: 0,
          pending: 0,
          items: []
        };
      });
    });
    
    // Only process items for the selected phase or all phases
    const filteredExpenses = expenses.filter(e => 
      selectedPhase === 'all' || e.phaseId === selectedPhase
    );
    
    const filteredBids = bids.filter(b => 
      selectedPhase === 'all' || b.phaseId === selectedPhase
    );
    
    // Process expenses
    filteredExpenses.forEach(expense => {
      const categoryId = mapItemToCategory(expense.description, expense.phaseId) || 'uncategorized';
      
      // Skip if we don't have this category (should not happen as we have 'uncategorized')
      if (!allocations[categoryId]) {
        allocations[categoryId] = {
          categoryId,
          allocated: 0,
          paid: 0,
          pending: 0,
          items: []
        };
      }
      
      // Update allocation data
      allocations[categoryId].allocated += expense.amount;
      
      // Update paid/pending amounts based on status
      if (expense.status === 'paid') {
        allocations[categoryId].paid += expense.amount;
      } else {
        allocations[categoryId].pending += expense.amount;
      }
      
      // Add to items
      allocations[categoryId].items.push({
        id: expense.id || `expense-${Date.now()}-${Math.random()}`,
        description: expense.description || 'Unnamed expense',
        amount: expense.amount,
        type: 'expense',
        status: expense.status,
        phaseId: expense.phaseId,
        date: expense.date
      });
    });
    
    // Process bids (only accepted ones should count toward allocation)
    filteredBids
      .filter(bid => bid.status === 'accepted')
      .forEach(bid => {
        const categoryId = mapItemToCategory(bid.title || 'Unnamed bid', bid.phaseId) || 'uncategorized';
        
        // Skip if we don't have this category
        if (!allocations[categoryId]) {
          allocations[categoryId] = {
            categoryId,
            allocated: 0,
            paid: 0,
            pending: 0,
            items: []
          };
        }
        
        // Update allocation data
        allocations[categoryId].allocated += bid.totalAmount;
        
        // Bids are considered pending until converted to expenses
        allocations[categoryId].pending += bid.totalAmount;
        
        // Add to items
        allocations[categoryId].items.push({
          id: bid.id || `bid-${Date.now()}-${Math.random()}`,
          description: bid.title || 'Unnamed bid',
          amount: bid.totalAmount,
          type: 'bid',
          status: bid.status,
          phaseId: bid.phaseId,
          date: bid.submissionDeadline || undefined
        });
      });
    
    return allocations;
  }, [expenses, bids, selectedPhase]);
  
  // Create a list of all categories with their section info and allocation data
  const categoriesWithAllocations = useMemo(() => {
    const result: Array<{
      section: string;
      sectionName: string;
      id: string;
      name: string;
      description: string;
      allocated: number;
      paid: number;
      pending: number;
      items: any[];
      hasCosts: boolean;
    }> = [];
    
    Object.entries(CONSTRUCTION_CATEGORIES).forEach(([section, categories]) => {
      const sectionName = section
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      categories.forEach(category => {
        const allocation = categoryAllocations[category.id] || {
          allocated: 0,
          paid: 0,
          pending: 0,
          items: []
        };
        
        result.push({
          section,
          sectionName,
          id: category.id,
          name: category.name,
          description: category.description,
          allocated: allocation.allocated,
          paid: allocation.paid,
          pending: allocation.pending,
          items: allocation.items,
          hasCosts: allocation.allocated > 0
        });
      });
    });
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return result.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term) ||
        item.items.some(i => i.description.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [categoryAllocations, searchTerm]);
  
  // Group categories by section
  const categoriesBySection = useMemo(() => {
    const sections: Record<string, {
      sectionName: string;
      categories: typeof categoriesWithAllocations;
      totalAllocated: number;
      totalWithCosts: number;
      coveragePercentage: number;
    }> = {};
    
    categoriesWithAllocations.forEach(category => {
      if (!sections[category.section]) {
        sections[category.section] = {
          sectionName: category.sectionName,
          categories: [],
          totalAllocated: 0,
          totalWithCosts: 0,
          coveragePercentage: 0
        };
      }
      
      sections[category.section].categories.push(category);
      sections[category.section].totalAllocated += category.allocated;
      if (category.hasCosts) {
        sections[category.section].totalWithCosts += 1;
      }
    });
    
    // Calculate coverage percentage for each section
    Object.values(sections).forEach(section => {
      section.coveragePercentage = (section.totalWithCosts / section.categories.length) * 100;
    });
    
    return sections;
  }, [categoriesWithAllocations]);
  
  // Calculate overall budget statistics
  const stats = useMemo(() => {
    const totalCategories = categoriesWithAllocations.length;
    const categoriesWithCosts = categoriesWithAllocations.filter(c => c.hasCosts).length;
    const coveragePercentage = (categoriesWithCosts / totalCategories) * 100;
    
    return {
      totalCategories,
      categoriesWithCosts,
      categoriesWithoutCosts: totalCategories - categoriesWithCosts,
      coveragePercentage
    };
  }, [categoriesWithAllocations]);
  
  return (
    <Box sx={{ mb: 4 }}>
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardHeader 
          title="Budget Allocation Completeness"
          subheader="Track budget allocation across all standard construction categories"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="This tool helps identify potential budget gaps">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
            {/* Category coverage stat */}
            <Paper 
              elevation={0} 
              sx={{ 
                flex: 1, 
                p: 2, 
                backgroundColor: theme.palette.background.default,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom>Category Coverage</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1, width: '80px', height: '80px' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.coveragePercentage} 
                  sx={{ 
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    color: stats.coveragePercentage > 70 
                      ? theme.palette.success.main 
                      : stats.coveragePercentage > 40
                        ? theme.palette.warning.main
                        : theme.palette.error.main
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div">
                    {Math.round(stats.coveragePercentage)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.categoriesWithCosts} of {stats.totalCategories} categories have allocated funds
              </Typography>
            </Paper>
            
            {/* Categories without costs */}
            <Paper 
              elevation={0} 
              sx={{ 
                flex: 2, 
                p: 2, 
                backgroundColor: theme.palette.background.default,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>Potential Budget Gaps</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {stats.categoriesWithoutCosts} categories have no allocated costs
              </Typography>
              
              {stats.categoriesWithoutCosts > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {categoriesWithAllocations
                    .filter(c => !c.hasCosts)
                    .slice(0, 8)
                    .map(category => (
                      <Chip 
                        key={category.id}
                        label={category.name} 
                        color="warning" 
                        size="small"
                        icon={<WarningIcon />}
                      />
                    ))}
                  {stats.categoriesWithoutCosts > 8 && (
                    <Chip 
                      label={`+${stats.categoriesWithoutCosts - 8} more`} 
                      variant="outlined" 
                      size="small"
                    />
                  )}
                </Box>
              ) : (
                <Alert severity="success" sx={{ mt: 1 }}>
                  All standard categories have allocated funds
                </Alert>
              )}
            </Paper>
          </Box>
          
          {/* Filters and search */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="phase-filter-label">Filter by Phase</InputLabel>
              <Select
                labelId="phase-filter-label"
                value={selectedPhase}
                label="Filter by Phase"
                onChange={(e) => setSelectedPhase(e.target.value as string)}
              >
                <MenuItem value="all">All Phases</MenuItem>
                {phases.map(phase => (
                  <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              placeholder="Search categories or descriptions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {/* Category sections */}
          {Object.entries(categoriesBySection).map(([sectionKey, section]) => (
            <Paper 
              key={sectionKey} 
              elevation={0} 
              sx={{ 
                mb: 2, 
                overflow: 'hidden', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              {/* Section header */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  cursor: 'pointer',
                  backgroundColor: theme.palette.background.default,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
                onClick={() => toggleSection(sectionKey)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{section.sectionName}</Typography>
                  <Chip 
                    label={`${section.totalWithCosts}/${section.categories.length}`}
                    size="small"
                    color={
                      section.coveragePercentage === 100 ? 'success' :
                      section.coveragePercentage >= 50 ? 'info' : 'warning'
                    }
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {formatCurrency(section.totalAllocated)}
                  </Typography>
                </Box>
              </Box>
              
              {/* Expandable section content */}
              {expandedSection === sectionKey && (
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell>Category</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Allocated</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Pending</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {section.categories.map((category) => (
                        <TableRow 
                          key={category.id}
                          sx={{ 
                            backgroundColor: !category.hasCosts 
                              ? alpha(theme.palette.warning.light, 0.1)
                              : 'inherit'
                          }}
                        >
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell align="right">{formatCurrency(category.allocated)}</TableCell>
                          <TableCell align="right">{formatCurrency(category.paid)}</TableCell>
                          <TableCell align="right">{formatCurrency(category.pending)}</TableCell>
                          <TableCell align="right">
                            {category.hasCosts ? (
                              <Chip 
                                label="Funded" 
                                size="small"
                                color="success"
                                icon={<CheckCircleIcon />} 
                              />
                            ) : (
                              <Chip 
                                label="No Funds" 
                                size="small"
                                color="warning"
                                icon={<FlagIcon />} 
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          ))}
          
          {/* Guidance note */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Categories with no allocated funds might indicate budget gaps or these costs may be included in other line items.
              Review each category marked "No Funds" to ensure important elements haven't been overlooked.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BudgetAllocationTracker; 