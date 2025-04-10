import React, { useMemo, useState, useEffect } from 'react';
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
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Expense, Bid, ProjectPhase, Project, CategoryMappingPreferences } from '../../../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import { getProjectById, updateProject } from '../../../services/project';
import { useAuth } from '../../../contexts/AuthContext';

// Define interface for BudgetItem to fix type issues
interface BudgetItem {
  id: string;
  description?: string;
  phaseId?: string;
  // Add other common fields if needed
}

// Create a type for category mapping preferences
// REMOVED from here
// type CategoryMappingPreferences = Record<string, string>;

// Define standard construction categories
const CONSTRUCTION_CATEGORIES = {
  // Add Land Purchase category
  'land': [
    { id: 'land_purchase', name: 'Land Purchase', description: 'Cost of acquiring the building lot' },
    { id: 'land_financing', name: 'Land Financing', description: 'Costs associated with land loans' },
  ],
  
  // Add Escrow/Closing category
  'escrow': [
    { id: 'closing_costs', name: 'Closing Costs', description: 'Fees paid at property closing (title, appraisal, etc.)' },
    { id: 'escrow_fees', name: 'Escrow Fees', description: 'Fees for escrow services during closing' },
    { id: 'property_taxes_prepaid', name: 'Property Taxes (Prepaid)', description: 'Prepaid property taxes at closing' },
    { id: 'insurance_prepaid', name: 'Insurance (Prepaid)', description: "Prepaid homeowner's insurance at closing" },
  ],

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
  
  // Add uncategorized as a special section
  'uncategorized': [
    { id: 'uncategorized', name: 'Uncategorized Items', description: 'Items that could not be automatically assigned' },
  ]
};

// Utility function to map bids and expenses to construction categories
const mapItemToCategory = (item: BudgetItem, userPreferences?: Record<string, string>): string => {
  // Use the category from preferences if available
  if (userPreferences && userPreferences[item.id]) {
    return userPreferences[item.id];
  }

  // Convert to lowercase for case-insensitive matching, handle null/undefined description
  const desc = (item.description || '').toLowerCase();
  
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
  if (desc.includes('foundation')) return 'foundation_walls';
  
  // Framing checks
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
  if (item.phaseId) {
    // This is a placeholder - you'll need to implement more sophisticated logic based on your phase structure
    // Ideally, you'd map each phase ID to the most relevant category
    // Returning uncategorized for now to satisfy type requirements
    return 'uncategorized';
  }
  
  // No match found
  return 'uncategorized';
};

// Add interfaces for projections
interface BudgetProjection {
  id: string;
  categoryId: string;
  amount: number;
  notes?: string;
  createdAt: Date;
}

// Update interface to include projections
interface BudgetAllocationTrackerProps {
  project: Project | null;
  phases: ProjectPhase[];
  expenses: Expense[];
  bids: Bid[];
  onAddProjection?: (projection: BudgetProjection) => void;
  // Add callback for preference changes if persistence is needed later
  // onCategoryPreferenceChange?: (itemId: string, categoryId: string) => void;
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  project,
  phases,
  expenses,
  bids,
  onAddProjection
  // onCategoryPreferenceChange
}) => {
  const theme = useTheme();
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'expenses' | 'bids' | 'consolidated'>('consolidated');
  
  // Add state for projections
  const [projections, setProjections] = useState<BudgetProjection[]>([]);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [currentProjectionCategory, setCurrentProjectionCategory] = useState<{id: string, name: string} | null>(null);
  const [projectionAmount, setProjectionAmount] = useState<number | ''>('');
  const [projectionNotes, setProjectionNotes] = useState('');
  
  // Add state for category mapping preferences
  const [categoryMappingPreferences, setCategoryMappingPreferences] = useState<Record<string, string>>({});
  // Add state to track which item is being edited
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // Add loading state for preferences
  const [prefsLoading, setPrefsLoading] = useState<boolean>(true);
  
  const { user } = useAuth(); // Get user from auth context
  
  // Effect to load preferences
  useEffect(() => {
    // Ensure we have both project ID and user ID
    if (project?.id && user?.uid) {
      setPrefsLoading(true);
      // Explicitly pass projectId and userId
      getProjectById(project.id as string, user.uid as string) 
        .then((fetchedProject: Project | null) => {
          if (fetchedProject && fetchedProject.budgetPreferences) {
            setCategoryMappingPreferences(fetchedProject.budgetPreferences as CategoryMappingPreferences);
          }
        })
        .catch((error: Error) => {
          console.error("Error loading project data for budget preferences:", error);
        })
        .finally(() => {
          setPrefsLoading(false);
        });
    } else {
      setCategoryMappingPreferences({});
      setPrefsLoading(false);
    }
  }, [project?.id, user?.uid]); // Add user.uid to dependency array
  
  // Toggle expansion of a category section
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Function to open the projection dialog
  const handleOpenProjectionDialog = (categoryId: string, categoryName: string) => {
    setCurrentProjectionCategory({id: categoryId, name: categoryName});
    setProjectionAmount('');
    setProjectionNotes('');
    setProjectionDialogOpen(true);
  };
  
  // Function to add a projection
  const handleAddProjection = () => {
    if (!currentProjectionCategory || projectionAmount === '') return;
    
    const newProjection: BudgetProjection = {
      id: `projection-${Date.now()}`,
      categoryId: currentProjectionCategory.id,
      amount: typeof projectionAmount === 'number' ? projectionAmount : Number(projectionAmount),
      notes: projectionNotes || undefined,
      createdAt: new Date()
    };
    
    // Add to local state
    setProjections([...projections, newProjection]);
    
    // Call callback if provided
    if (onAddProjection) {
      onAddProjection(newProjection);
    }
    
    setProjectionDialogOpen(false);
  };
  
  // Calculate allocated amounts for each construction category
  const categoryAllocations = useMemo(() => {
    const allocations: Record<string, {
      categoryId: string;
      allocated: number;
      paid: number;
      pending: number;
      projected: number;
      items: Array<{
        id: string;
        description: string;
        amount: number;
        type: 'expense' | 'bid' | 'payment' | 'projection';
        status: string;
        phaseId?: string;
        date?: string | Date;
        bidId?: string | null;
        sourceId?: string;
        itemTitle?: string;
        isPaymentItem?: boolean;
        parentItemId?: string;
        isCategoryItem?: boolean;
        notes?: string;
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
          projected: 0,
          items: []
        };
      });
    });
    
    // Create a set to track processed bid IDs (for consolidated view)
    const processedBidIds = new Set<string>();
    
    // Track payment schedule items by category to avoid duplication
    const categoriesWithPaymentItems = new Set<string>();
    
    // Only process items for the selected phase or all phases
    const filteredExpenses = expenses.filter(e => 
      selectedPhase === 'all' || e.phaseId === selectedPhase
    );
    
    const filteredBids = bids.filter(b => 
      selectedPhase === 'all' || b.phaseId === selectedPhase
    );
    
    // Process expenses
    if (displayMode === 'expenses' || displayMode === 'consolidated') {
      filteredExpenses.filter(e => e.id !== undefined).forEach(expense => {
        // Check if this is a payment item
        const isPaymentItem = expense.description.toLowerCase().includes('payment') && 
                             (expense.description.toLowerCase().includes('down') || 
                              expense.description.toLowerCase().includes('final') ||
                              expense.description.toLowerCase().includes('stage') ||
                              expense.description.toLowerCase().includes('deposit'));
        
        // Determine the category, passing preferences
        const categoryId = mapItemToCategory(expense as BudgetItem, categoryMappingPreferences);
        
        // Initialize category if needed
        if (!allocations[categoryId]) {
          allocations[categoryId] = {
            categoryId,
            allocated: 0,
            paid: 0,
            pending: 0,
            projected: 0,
            items: []
          };
        }
        
        // If this is a payment item, mark its category
        if (isPaymentItem) {
          categoriesWithPaymentItems.add(categoryId);
        }
        
        // Add expense to items
        allocations[categoryId].items.push({
          id: expense.id!,
          description: expense.description || 'Unnamed expense',
          amount: expense.amount,
          type: isPaymentItem ? 'payment' : 'expense',
          status: expense.status,
          phaseId: expense.phaseId,
          date: expense.date,
          bidId: expense.bidId,
          sourceId: expense.id,
          isPaymentItem,
          // Identify whether this expense is related to a specific category
          isCategoryItem: expense.description.toLowerCase() === 
            Object.values(CONSTRUCTION_CATEGORIES)
              .flatMap(cats => cats)
              .find(cat => cat.id === categoryId)?.name.toLowerCase()
        });
        
        // If this expense was created from a bid, track the bid ID
        if (expense.bidId && displayMode === 'consolidated') {
          processedBidIds.add(expense.bidId);
        }
      });
    }
    
    // Process bids (assuming bid.id is always present - now ensuring it)
    if (displayMode === 'bids' || displayMode === 'consolidated') {
      filteredBids
        .filter(bid => bid.status === 'accepted' && bid.id) // Add check for bid.id
        .forEach(bid => {
          // In consolidated mode, skip bids that have expenses created from them
          if (displayMode === 'consolidated' && processedBidIds.has(bid.id)) { // bid.id is now guaranteed
            return;
          }
          
          const bidTitle = bid.title || 'Unnamed bid';
          // Determine the category, passing preferences (bid.id is now guaranteed)
          const categoryId = mapItemToCategory({ id: bid.id, description: bidTitle, phaseId: bid.phaseId }, categoryMappingPreferences);
          
           // Initialize category if needed
          if (!allocations[categoryId]) {
             allocations[categoryId] = {
               categoryId,
               allocated: 0,
               paid: 0,
               pending: 0,
               projected: 0,
               items: []
             };
          }
          
          // Skip adding the main bid item if there are payment items for the same category
          // This prevents duplication of the total amount
          if (categoriesWithPaymentItems.has(categoryId) && displayMode === 'consolidated') {
            return;
          }
          
          // Check if this bid is likely referring to the category itself
          const category = Object.values(CONSTRUCTION_CATEGORIES)
            .flatMap(cats => cats)
            .find(cat => cat.id === categoryId);
          
          const isCategoryBid = category && 
            (bidTitle.toLowerCase() === category.name.toLowerCase() ||
             bidTitle.toLowerCase().includes(category.name.toLowerCase() + ' installation') ||
             bidTitle.toLowerCase().includes(category.name.toLowerCase() + ' work'));
          
          // Add bid to items
          allocations[categoryId].items.push({
            id: bid.id, // Use the guaranteed ID
            description: `${bidTitle} ${displayMode === 'consolidated' ? '(Bid)' : ''}`,
            amount: bid.totalAmount,
            type: 'bid',
            status: bid.status,
            phaseId: bid.phaseId,
            date: bid.submissionDeadline || undefined,
            bidId: bid.id,
            sourceId: bid.id,
            isCategoryItem: isCategoryBid
          });
        });
    }
    
    // Process projections
    projections.forEach(projection => {
      const categoryId = projection.categoryId;
      
      // Skip if we don't have this category
      if (!allocations[categoryId]) return;
      
      // Add projection to items
      allocations[categoryId].items.push({
        id: projection.id,
        description: `Projected Cost${projection.notes ? `: ${projection.notes}` : ''}`,
        amount: projection.amount,
        type: 'projection',
        status: 'projected',
        date: projection.createdAt
      });
      
      // Update projected amount
      allocations[categoryId].projected += projection.amount;
    });
    
    // Special processing for consolidated view to remove duplicate items
    if (displayMode === 'consolidated') {
      Object.keys(allocations).forEach(categoryId => {
        const category = Object.values(CONSTRUCTION_CATEGORIES)
          .flatMap(cats => cats)
          .find(cat => cat.id === categoryId);
          
        if (!category) return;
        
        // Get all items in this category
        const allItems = [...allocations[categoryId].items];
        if (allItems.length <= 1) {
          return; // No duplicates if there's only one item
        }
        
        // Get items by type for easier processing
        const paymentItems = allItems.filter(item => 
          item.isPaymentItem || item.description.toLowerCase().includes('payment')
        );
        
        const nonPaymentItems = allItems.filter(item => 
          !(item.isPaymentItem || item.description.toLowerCase().includes('payment'))
        );
        
        const categoryName = category.name.toLowerCase();
        
        // Group items by how they relate to the category
        const categoryItems = allItems.filter(item => 
          item.description.toLowerCase() === categoryName || 
          item.description.toLowerCase() === categoryName + ' (bid)'
        );
        
        const installationItems = allItems.filter(item => 
          item.description.toLowerCase().includes(categoryName + ' installation') || 
          item.description.toLowerCase().includes('install ' + categoryName)
        );
        
        const otherItems = allItems.filter(item => 
          !categoryItems.includes(item) && !installationItems.includes(item)
        );
        
        // CASE 1: If we have payment items, prefer those and remove duplicates
        if (paymentItems.length > 0 && nonPaymentItems.length > 0) {
          const paymentItemsSum = paymentItems.reduce((sum, item) => sum + item.amount, 0);
          
          // Find non-payment items with matching amounts and remove them
          const nonMatchingItems = nonPaymentItems.filter(item => 
            Math.abs(item.amount - paymentItemsSum) > 0.01
          );
          
          // Update items to only keep non-matching items and payment items
          allocations[categoryId].items = [...nonMatchingItems, ...paymentItems];
          return; // Skip other processing if we've handled payment items
        }
        
        // CASE 2: If we have both category and installation items with same amount
        if (categoryItems.length > 0 && installationItems.length > 0) {
          const categoryTotal = categoryItems.reduce((sum, item) => sum + item.amount, 0);
          const installTotal = installationItems.reduce((sum, item) => sum + item.amount, 0);
          
          // If amounts match (within 1 cent), they're duplicates
          if (Math.abs(categoryTotal - installTotal) < 0.01) {
            // Choose which set to keep based on status priority
            const paidExpenses = allItems.filter(item => 
              item.type === 'expense' && item.status === 'paid'
            );
            
            const pendingExpenses = allItems.filter(item => 
              item.type === 'expense' && item.status !== 'paid'
            );
            
            const bidItems = allItems.filter(item => item.type === 'bid');
            
            // Keep the highest priority items available
            if (paidExpenses.length > 0) {
              allocations[categoryId].items = [...paidExpenses, ...otherItems];
            }
            else if (pendingExpenses.length > 0) {
              allocations[categoryId].items = [...pendingExpenses, ...otherItems];
            }
            else if (bidItems.length > 0) {
              // Get the first bid only to avoid duplicates
              allocations[categoryId].items = [bidItems[0], ...otherItems];
            }
          }
        }
      });
    }
    
    // Calculate totals for each category
    Object.keys(allocations).forEach(categoryId => {
      // Reset totals
      allocations[categoryId].allocated = 0;
      allocations[categoryId].paid = 0;
      allocations[categoryId].pending = 0;
      
      // Calculate based on items
      allocations[categoryId].items.forEach((item) => {
        allocations[categoryId].allocated += item.amount;
        
        if ((item.type === 'expense' || item.type === 'payment') && item.status === 'paid') {
          allocations[categoryId].paid += item.amount;
        } else {
          allocations[categoryId].pending += item.amount;
        }
      });
    });
    
    // When calculating totals, include projections in the allocated amount
    Object.keys(allocations).forEach(categoryId => {
      allocations[categoryId].allocated += allocations[categoryId].projected;
    });
    
    return allocations;
  }, [expenses, bids, selectedPhase, displayMode, projections, categoryMappingPreferences]);
  
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
      projected: number;
      totalWithProjections: number;
      items: any[];
      hasCosts: boolean;
      hasProjections: boolean;
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
          projected: 0,
          items: []
        };
        
        const actualAllocated = allocation.allocated - allocation.projected;
        
        result.push({
          section,
          sectionName,
          id: category.id,
          name: category.name,
          description: category.description,
          allocated: actualAllocated,
          paid: allocation.paid,
          pending: allocation.pending,
          projected: allocation.projected,
          totalWithProjections: allocation.allocated,
          items: allocation.items,
          hasCosts: actualAllocated > 0,
          hasProjections: allocation.projected > 0
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
      totalProjected: number;
      coveragePercentage: number;
    }> = {};
    
    categoriesWithAllocations.forEach(category => {
      if (!sections[category.section]) {
        sections[category.section] = {
          sectionName: category.sectionName,
          categories: [],
          totalAllocated: 0,
          totalWithCosts: 0,
          totalProjected: 0,
          coveragePercentage: 0
        };
      }
      
      sections[category.section].categories.push(category);
      sections[category.section].totalAllocated += category.allocated;
      sections[category.section].totalProjected += category.projected;
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
  
  // Add a function to determine if a category has projections but no actual costs
  const hasCategoryOnlyProjections = (category: any) => !category.hasCosts && category.hasProjections;

  // Update the empty category row rendering to handle projected-only categories
  const renderEmptyCategoryRow = (category: any) => (
    <TableRow 
      key={category.id}
      sx={{ 
        backgroundColor: hasCategoryOnlyProjections(category) 
          ? alpha(theme.palette.info.light, 0.1) 
          : alpha(theme.palette.warning.light, 0.1) 
      }}
    >
      <TableCell>{category.name}</TableCell>
      <TableCell>{category.description}</TableCell>
      <TableCell align="right">
        {hasCategoryOnlyProjections(category) ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(0)}
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ ml: 1 }}>
              (+{formatCurrency(category.projected)})
            </Typography>
          </Box>
        ) : (
          formatCurrency(0)
        )}
      </TableCell>
      <TableCell align="right">{formatCurrency(0)}</TableCell>
      <TableCell align="right">{formatCurrency(0)}</TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {hasCategoryOnlyProjections(category) ? (
            <Chip 
              label="Projected" 
              size="small"
              color="info"
              icon={<InfoIcon />} 
            />
          ) : (
            <Chip 
              label="No Funds" 
              size="small"
              color="warning"
              icon={<FlagIcon />} 
            />
          )}
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{ ml: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProjectionDialog(category.id, category.name);
            }}
          >
            {hasCategoryOnlyProjections(category) ? 'Update' : 'Add'} Projection
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
  
  // Add handler for changing category preference
  const handleRecategorizeItem = async (itemId: string, newCategoryId: string) => {
    if (!project?.id) {
      console.error("Project ID is missing, cannot save preferences.");
      return; // Exit if no project ID
    }

    const updatedPrefs = {
      ...categoryMappingPreferences,
      [itemId]: newCategoryId
    };
    
    // Optimistically update local state
    setCategoryMappingPreferences(updatedPrefs);

    try {
      // Call Firebase service to update the project document
      await updateProject(project.id, { budgetPreferences: updatedPrefs });
      console.log(`Budget preference saved for item ${itemId}`);
    } catch (error) { 
      console.error("Error saving budget preferences:", error);
      // Optionally: Revert local state change if save fails
      setCategoryMappingPreferences(prev => {
        const reverted = { ...prev };
        // How to revert depends on whether the item previously had a preference
        // For simplicity, just removing the failed key might be okay 
        // or you might need to store the previous state temporarily
        // delete reverted[itemId]; 
        return reverted; // For now, just log error, don't revert UI optimistically
      });
      // Optionally: Show error to user
    }
  };

  // Prepare category options for the dropdown
  const categoryOptions = useMemo(() => {
    return Object.entries(CONSTRUCTION_CATEGORIES)
      .flatMap(([sectionKey, sectionCategories]) => 
        sectionCategories.map(cat => ({ 
          value: cat.id, 
          label: cat.name, 
          section: sectionKey 
        }))
      )
      .filter(cat => cat.value !== 'uncategorized'); // Don't allow assigning *to* uncategorized
  }, []);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Projection Dialog */}
      <Dialog 
        open={projectionDialogOpen} 
        onClose={() => setProjectionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Add Projected Cost: {currentProjectionCategory?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Projected Amount"
              type="number"
              fullWidth
              margin="normal"
              value={projectionAmount}
              onChange={(e) => setProjectionAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Notes (optional)"
              fullWidth
              margin="normal"
              value={projectionNotes}
              onChange={(e) => setProjectionNotes(e.target.value)}
              placeholder="e.g., Based on contractor estimate"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProjection} 
            variant="contained" 
            disabled={projectionAmount === '' || (typeof projectionAmount === 'number' && projectionAmount <= 0)}
          >
            Add Projection
          </Button>
        </DialogActions>
      </Dialog>

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
            
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="display-mode-label">Display</InputLabel>
              <Select
                labelId="display-mode-label"
                value={displayMode}
                label="Display"
                onChange={(e) => setDisplayMode(e.target.value as 'expenses' | 'bids' | 'consolidated')}
              >
                <MenuItem value="expenses">Expenses Only</MenuItem>
                <MenuItem value="bids">Bids Only</MenuItem>
                <MenuItem value="consolidated">Consolidated View</MenuItem>
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
          
          {/* Display info about the current view mode */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {displayMode === 'expenses' && 
                "Showing expenses only. This view displays actual expenses recorded in the system."}
              {displayMode === 'bids' && 
                "Showing accepted bids only. This view displays bid amounts that have been approved."}
              {displayMode === 'consolidated' && 
                "Showing consolidated view. Expenses created from bids replace the original bids to avoid duplication."}
            </Typography>
          </Alert>
          
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
                  
                  {/* Special badge for Uncategorized section showing item count */} 
                  {sectionKey === 'uncategorized' ? (
                    <Chip 
                      label={`${section.categories[0]?.items?.length || 0} items`} // Show item count
                      size="small"
                      color={section.categories[0]?.items?.length > 0 ? 'warning' : 'default'} // Warning if items exist
                      icon={section.categories[0]?.items?.length > 0 ? <WarningIcon fontSize="inherit" /> : undefined}
                    />
                  ) : (
                    // Original badge for other sections
                    <Chip 
                      label={`${section.totalWithCosts}/${section.categories.length}`}
                      size="small"
                      color={
                        section.coveragePercentage === 100 ? 'success' :
                        section.coveragePercentage >= 50 ? 'info' : 'warning'
                      }
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {formatCurrency(section.totalAllocated)}
                  </Typography>
                  {section.totalProjected > 0 && (
                    <Typography variant="body2" color="info.main" sx={{ fontSize: '0.8rem' }}>
                      (+{formatCurrency(section.totalProjected)})
                    </Typography>
                  )}
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
                      {section.categories.map((category) => {
                        // Skip empty categories or render empty row
                        if (!category.hasCosts && !category.hasProjections) {
                          return renderEmptyCategoryRow(category);
                        }
                        if (!category.hasCosts && category.hasProjections) {
                          return renderEmptyCategoryRow(category); // Render row showing only projections
                        }
                        
                        // ********** FIX SCOPE ISSUE: Define itemsToDisplay here **********
                        let itemsToDisplay = category.items; // Default to all items

                        // Apply consolidation/filtering logic if needed (add back if removed)
                        if (displayMode === 'consolidated') {
                          const paidExpenses = category.items.filter(item => 
                            (item.type === 'expense' || item.type === 'payment') && item.status === 'paid'
                          );
                          const pendingExpenses = category.items.filter(item => 
                            (item.type === 'expense' || item.type === 'payment') && item.status !== 'paid'
                          );
                          const bidItems = category.items.filter(item => item.type === 'bid');
                          
                          // Example: prioritize paid, then pending, then bids
                          if (paidExpenses.length > 0) itemsToDisplay = paidExpenses;
                          else if (pendingExpenses.length > 0) itemsToDisplay = pendingExpenses;
                          else if (bidItems.length > 0) itemsToDisplay = bidItems;
                          // If none of the prioritized types exist, itemsToDisplay keeps default (all items)
                          // Correction: If none match, it should perhaps be empty for consolidated view?
                          // Let's refine: only show prioritized, otherwise empty if no projections exist
                          else { itemsToDisplay = []; }
                        }
                        // Apply search term filtering if necessary (might be handled earlier)
                        // *****************************************************************

                        // *** ADD FALLBACK RENDER ***
                        // If items got filtered out completely, but the category had costs initially
                        // and has no projections to show instead, render the empty row.
                        if (itemsToDisplay.length === 0 && !category.hasProjections && category.hasCosts) {
                          return renderEmptyCategoryRow(category);
                        }
                        // **************************

                        return (
                          <React.Fragment key={category.id}>
                            {/* Item rows - Render only if itemsToDisplay is not empty */}
                            {itemsToDisplay.length > 0 && itemsToDisplay.map((item, idx) => (
                              <TableRow 
                                key={`${category.id}-item-${item.id || idx}`}
                                sx={{
                                  backgroundColor: idx % 2 === 1 ? alpha(theme.palette.action.hover, 0.02) : 'inherit',
                                  '& td': { py: 0.75, fontSize: '0.875rem', borderBottom: 'none' },
                                  '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.1) }
                                }}
                              >
                                {/* Standard Cells */} 
                                <TableCell sx={{ borderLeft: `3px solid ${idx === 0 ? theme.palette.divider : 'transparent'}` }}>
                                  {idx === 0 ? category.name : ''}
                                </TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                <TableCell align="right">
                                  {(item.type === 'expense' || item.type === 'payment') && item.status === 'paid' ? formatCurrency(item.amount) : '-'}
                                </TableCell>
                                <TableCell align="right">
                                  {/* Pending Amount Logic */}
                                  {(item.type === 'expense' || item.type === 'payment') && item.status === 'paid' ? '-' : item.type === 'projection' ? '-' : formatCurrency(item.amount)}
                                </TableCell>
                                <TableCell align="right">
                                  <Chip /* Status Chip */ 
                                     label={item.type === 'bid' ? 'Bid' : item.type === 'projection' ? 'Projected' : item.status}
                                     size="small"
                                     color={item.type === 'bid' ? 'primary' : item.type === 'projection' ? 'info' : item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warning' : 'default'}
                                     sx={{ height: '20px', fontSize: '0.7rem' }}
                                   />
                                </TableCell>
                                
                                {/* NEW Edit Category Cell (Applies to all items) */} 
                                <TableCell align="center" sx={{ width: '50px', padding: '0 4px' }}>
                                  {editingItemId === item.id ? (
                                    // Show Autocomplete when editing this item
                                    <Autocomplete
                                      options={categoryOptions} 
                                      getOptionLabel={(option) => option.label || ''}
                                      value={categoryOptions.find(opt => opt.value === categoryMappingPreferences[item.id]) || null} 
                                      onChange={(event, newValue) => {
                                        if (newValue) {
                                          handleRecategorizeItem(item.id, newValue.value);
                                        }
                                        setEditingItemId(null); // Close autocomplete after selection or if cleared
                                      }}
                                      onBlur={() => setTimeout(() => setEditingItemId(null), 150)} // Delay blur slightly to allow selection
                                      renderInput={(params) => (
                                        <TextField {...params} label="Category" size="small" variant="standard" autoFocus />
                                      )}
                                      renderOption={(props, option) => (
                                        <li {...props} key={option.value}>
                                          {option.label}
                                        </li>
                                      )}
                                      isOptionEqualToValue={(option, value) => option.value === value.value}
                                      size="small"
                                      sx={{ minWidth: 220 }} // Ensure dropdown has enough width
                                      open // Keep dropdown open immediately
                                    />
                                  ) : (
                                    // Show Edit button when not editing
                                    <Tooltip title="Change Category">
                                      <IconButton size="small" onClick={() => setEditingItemId(item.id)}>
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Projection summary row - Renders if category.hasProjections is true */} 
                            {category.hasProjections && (
                              <TableRow
                                sx={{ 
                                  backgroundColor: alpha(theme.palette.info.light, 0.05),
                                  '& td': { py: 0.75, fontSize: '0.75rem', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }
                                }}
                              >
                                 <TableCell sx={{ borderLeft: `3px solid ${theme.palette.divider}` }}>{itemsToDisplay.length === 0 ? category.name : ''}</TableCell> 
                                <TableCell colSpan={3}> {/* Spans Desc, Alloc, Paid */}
                                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" color="info.main">Includes projected costs</Typography>
                                    <Button size="small" startIcon={<AddIcon />} sx={{ ml: 2 }} onClick={(e) => { e.stopPropagation(); handleOpenProjectionDialog(category.id, category.name); }}>Update Projection</Button>
                                   </Box>
                                </TableCell>
                                <TableCell align="right">{/* Spans Pending */}
                                   <Typography variant="body2" color="info.main">+{formatCurrency(category.projected)}</Typography>
                                </TableCell>
                                <TableCell align="right">{/* Spans Status */}
                                   <Chip label="Projected" size="small" color="info" sx={{ height: '18px', fontSize: '0.65rem' }}/>
                                </TableCell>
                                <TableCell /> {/* Add empty cell for the Edit column */} 
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
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