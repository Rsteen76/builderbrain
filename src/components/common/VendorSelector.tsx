import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  BusinessCenter as VendorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ExpenseService } from '../../services/expense';

const DEFAULT_VENDORS = [
  'Home Depot',
  'Lowe\'s',
  'Menards',
  'Ace Hardware',
  'Ferguson',
  'Grainger',
  'McMaster-Carr',
  'Uline',
  'Capitol Building Supply',
  'Superior Walls',
];

interface VendorSelectorProps {
  value: string;
  onChange: (vendor: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({
  value,
  onChange,
  error,
  helperText,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch vendors from user's expenses
  useEffect(() => {
    console.log('VendorSelector - Fetching vendors, user:', user?.uid);
    setIsLoading(true);
    
    if (!user?.uid) {
      console.log('VendorSelector - No user ID available');
      setIsLoading(false);
      return;
    }
    
    const fetchVendorsFromExpenses = async () => {
      try {
        // Fetch all expenses for the user
        const expenses = await ExpenseService.getExpenses(user.uid);
        console.log(`VendorSelector - Fetched ${expenses.length} expenses`);
        
        // Extract unique vendor names from expenses
        const vendorNames = expenses
          .map(expense => expense.vendor)
          .filter((vendor): vendor is string => 
            vendor !== undefined && 
            vendor !== null && 
            vendor.trim() !== ''
          );
          
        const uniqueVendors = Array.from(new Set(vendorNames)).sort();
        console.log('VendorSelector - Unique vendors from expenses:', uniqueVendors);
        
        // Combine with any vendors stored in localStorage
        try {
          const storageKey = `vendors_${user.uid}`;
          const storedVendors = localStorage.getItem(storageKey);
          
          if (storedVendors) {
            const parsedVendors = JSON.parse(storedVendors);
            
            if (Array.isArray(parsedVendors) && parsedVendors.length > 0) {
              // Combine and deduplicate vendors
              const combinedVendors = Array.from(new Set([...uniqueVendors, ...parsedVendors])).sort();
              setVendors(combinedVendors);
              console.log('VendorSelector - Combined vendors:', combinedVendors);
              return;
            }
          }
        } catch (storageError) {
          console.error('VendorSelector - Error loading vendors from localStorage:', storageError);
        }
        
        // If we have vendors from expenses, use those
        if (uniqueVendors.length > 0) {
          setVendors(uniqueVendors);
          return;
        }
        
        // Fallback to default vendors if no vendors found
        console.log('VendorSelector - No vendors found, using defaults');
        setVendors(DEFAULT_VENDORS);
        
      } catch (error) {
        console.error('VendorSelector - Error fetching vendors from expenses:', error);
        setVendors(DEFAULT_VENDORS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVendorsFromExpenses();
  }, [user?.uid]);

  // Function to add new vendor to localStorage
  const saveVendorToLocalStorage = (newVendor: string) => {
    if (!user?.uid || !newVendor.trim()) return;
    
    try {
      const vendorName = newVendor.trim();
      console.log('VendorSelector - Saving new vendor:', vendorName);
      
      // Add to vendors list if not already there
      if (!vendors.some(v => v.toLowerCase() === vendorName.toLowerCase())) {
        const updatedVendors = [...vendors, vendorName].sort();
        
        // Save to localStorage
        const storageKey = `vendors_${user.uid}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedVendors));
        console.log('VendorSelector - Saved updated vendors to localStorage:', updatedVendors);
        
        // Update state
        setVendors(updatedVendors);
      } else {
        console.log('VendorSelector - Vendor already exists, not saving');
      }
    } catch (error) {
      console.error('VendorSelector - Error adding vendor:', error);
    }
  };

  return (
    <Box>
      <Autocomplete
        id="vendor-select"
        options={vendors}
        loading={isLoading}
        value={value || null}
        disabled={disabled}
        freeSolo
        autoComplete
        includeInputInList
        selectOnFocus
        clearOnBlur={false}
        handleHomeEndKeys
        autoHighlight
        getOptionLabel={(option) => option || ''}
        isOptionEqualToValue={(option, value) => option === value}
        onChange={(event, newValue) => {
          onChange(newValue || '');
          // If user entered a new value, save it to localStorage
          if (newValue && !vendors.includes(newValue)) {
            saveVendorToLocalStorage(newValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Vendor / Supplier"
            placeholder="Who provided the goods/services?"
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <VendorIcon fontSize="small" color="primary" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            error={error}
            helperText={helperText}
          />
        )}
      />
    </Box>
  );
};

export default VendorSelector; 
