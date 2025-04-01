import { Subcontractor } from '../types';
import { SubcontractorService } from '../services/subcontractor';

/**
 * Seed data for testing subcontractors
 */
const seedSubcontractors: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ACME Electrical',
    specialty: 'Electrical',
    rating: 4.5,
    totalProjects: 25,
    contact: {
      phone: '555-123-4567',
      email: 'contact@acmeelectric.com',
      location: '123 Main St, Anytown',
    },
    performance: {
      onTime: 95,
      quality: 92,
      communication: 88,
    },
    companyInfo: {
      website: 'acmeelectric.com',
      founded: '1998',
      employees: 15,
      license: 'ELEC12345',
    },
    projects: [],
    notes: 'Reliable team, good for large commercial jobs.',
  },
  {
    name: 'Elite Electrical',
    specialty: 'Electrical',
    rating: 4.5,
    totalProjects: 8,
    lastBid: {
      date: new Date('2024-03-15'),
      amount: 45000,
    },
    contact: {
      phone: '(555) 123-4567',
      email: 'contact@eliteelectrical.com',
      location: 'New York, NY',
    },
    performance: {
      onTime: 95,
      quality: 92,
      communication: 88,
    },
    companyInfo: {
      website: 'www.eliteelectrical.com',
      founded: '2005',
      employees: 24,
      license: 'EL-123456',
    },
    notes: 'Great electrical contractor with experience in commercial projects',
  },
  {
    name: 'Premier Plumbing',
    specialty: 'Plumbing',
    rating: 4.8,
    totalProjects: 12,
    lastBid: {
      date: new Date('2024-03-20'),
      amount: 78000,
    },
    contact: {
      phone: '(555) 234-5678',
      email: 'info@premierplumbing.com',
      location: 'Brooklyn, NY',
    },
    performance: {
      onTime: 98,
      quality: 95,
      communication: 92,
    },
    companyInfo: {
      website: 'www.premierplumbing.com',
      founded: '2010',
      employees: 18,
      license: 'PL-789012',
    },
    notes: 'Reliable plumbing contractor with expertise in residential and commercial projects',
  },
  {
    name: 'Quality Concrete',
    specialty: 'Concrete',
    rating: 4.2,
    totalProjects: 15,
    lastBid: {
      date: new Date('2024-03-25'),
      amount: 120000,
    },
    contact: {
      phone: '(555) 345-6789',
      email: 'bids@qualityconcrete.com',
      location: 'Queens, NY',
    },
    performance: {
      onTime: 90,
      quality: 88,
      communication: 85,
    },
    companyInfo: {
      website: 'www.qualityconcrete.com',
      founded: '2000',
      employees: 35,
      license: 'CC-345678',
    },
    notes: 'Specialized in foundation work and concrete structures',
  },
  {
    name: 'HVAC Masters',
    specialty: 'HVAC',
    rating: 4.6,
    totalProjects: 10,
    lastBid: {
      date: new Date('2024-03-18'),
      amount: 65000,
    },
    contact: {
      phone: '(555) 456-7890',
      email: 'service@hvacmasters.com',
      location: 'Manhattan, NY',
    },
    performance: {
      onTime: 94,
      quality: 93,
      communication: 90,
    },
    companyInfo: {
      website: 'www.hvacmasters.com',
      founded: '2008',
      employees: 20,
      license: 'HC-567890',
    },
    notes: 'Excellent HVAC contractor with experience in high-rise buildings',
  },
  {
    name: 'Precision Carpentry',
    specialty: 'Carpentry',
    rating: 4.7,
    totalProjects: 9,
    lastBid: {
      date: new Date('2024-03-22'),
      amount: 35000,
    },
    contact: {
      phone: '(555) 567-8901',
      email: 'info@precisioncarpentry.com',
      location: 'Staten Island, NY',
    },
    performance: {
      onTime: 96,
      quality: 97,
      communication: 89,
    },
    companyInfo: {
      website: 'www.precisioncarpentry.com',
      founded: '2012',
      employees: 15,
      license: 'CP-678901',
    },
    notes: 'Specialized in custom woodwork and finish carpentry',
  },
];

/**
 * Function to seed subcontractors into Firestore
 * REQUIRES a userId to associate the data
 */
export const seedSubcontractorData = async (userId: string): Promise<void> => {
  if (!userId) {
    console.error('Seed Error: userId is required to seed subcontractor data.');
    return;
  }
  console.log('Attempting to seed subcontractor data...');
  
  try {
    // Check if subcontractors exist FOR THIS USER
    const existingSubcontractors = await SubcontractorService.getSubcontractors(userId);
    
    if (existingSubcontractors.length === 0) {
      console.log('No existing subcontractors found for this user. Seeding data...');
      // Add subcontractors with the provided userId
      for (const subcontractor of seedSubcontractors) {
        await SubcontractorService.createSubcontractor(userId, subcontractor);
      }
      console.log('Subcontractor database seeded successfully!');
    } else {
      console.log('Subcontractors already exist for this user. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding subcontractor data:', error);
  }
}; 