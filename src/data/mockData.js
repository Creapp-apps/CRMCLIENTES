export const mockProjects = [
  { id: 1, name: 'GymFit System', code: 'GYM', pricingType: 'monthly', basePrice: 50000, isActive: true },
  { id: 2, name: 'Rebranding Agency', code: 'RBA', pricingType: 'one-time', basePrice: 150000, isActive: true },
  { id: 3, name: 'CreApp Dev', code: 'CRD', pricingType: 'percentage', basePrice: 0, isActive: false }
];

export const mockTeam = [
  { 
    id: 1, 
    name: 'Clau', 
    role: 'Vendedora',
    commissions: [
      { projectId: 1, type: 'percentage', value: 10 },
      { projectId: 2, type: 'fixed', value: 15000 }
    ],
    totalActiveClients: 8 
  },
  { 
    id: 2, 
    name: 'Pedro', 
    role: 'Vendedor', 
    commissions: [
      { projectId: 1, type: 'percentage', value: 10 }
    ],
    totalActiveClients: 5 
  }
];

export const mockStats = {
  salesCount: 8,
  projectedEarnings: '350.000', 
  totalContacts: 142,
  conversionRate: '5.6%'
};

export const mockLeads = [
  {
    id: 1,
    name: 'Juan Pérez',
    company: 'CrossFit Alpha',
    projectName: 'GymFit System',
    projectId: 1,
    source: 'inbound',
    channel: 'instagram',
    status: 'uncontacted',
    nextContactDate: '2026-04-02T10:00:00Z', // Needs contact today
    date: '2026-04-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'TechCorp SaaS',
    company: 'TechCorp',
    projectName: 'Rebranding Agency',
    projectId: 2,
    source: 'outbound',
    channel: 'linkedin',
    status: 'contacting',
    nextContactDate: '2026-04-03T11:30:00Z', // Follow up tomorrow
    date: '2026-04-02T11:30:00Z'
  },
  {
    id: 3,
    name: 'María Gómez',
    company: 'Pilates Flow',
    projectName: 'GymFit System',
    projectId: 1,
    source: 'inbound',
    channel: 'tiktok',
    status: 'uncontacted',
    nextContactDate: '2026-04-02T14:15:00Z', // Needs contact today
    date: '2026-04-02T14:15:00Z'
  }
];
