/**
 * src/data/mockData.js
 * Core mock dataset representing operational pods, processes, brands, and employees.
 */

export const OPERATING_PROCESSES = {
  CUSTOMER_SUPPORT: 'CS',
  ACCOUNT_MANAGEMENT: 'ACC',
  NON_DELIVERY_REPORTS: 'NDR'
};

export const PODS = [
  { id: 'pod-1', name: 'Pod Alpha', leadEmployeeId: 'emp-1' },
  { id: 'pod-2', name: 'Pod Beta', leadEmployeeId: 'emp-9' },
  { id: 'pod-3', name: 'Pod Gamma', leadEmployeeId: 'emp-17' },
  { id: 'pod-4', name: 'Pod Delta', leadEmployeeId: 'emp-25' }
];

/**
 * 10 Brands distributed across the 4 Pods:
 * - 8 Single-Resource brands (~80%)
 * - 2 Multi-Resource brands (~20%)
 */
export const BRANDS = [
  // Pod Alpha
  {
    id: 'brand-1',
    name: 'Nova D2C',
    podId: 'pod-1',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'EVERYDAY_365',
    supportedProcesses: ['CS', 'ACC', 'NDR'],
    assignedEmployeeIds: ['emp-2']
  },
  {
    id: 'brand-2',
    name: 'Aura Living',
    podId: 'pod-1',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'DAILY_EXCEPT_HOLIDAYS',
    supportedProcesses: ['CS', 'ACC'],
    assignedEmployeeIds: ['emp-3']
  },
  {
    id: 'brand-3',
    name: 'Zenith Retail',
    podId: 'pod-1',
    modelType: 'MULTI_RESOURCE',
    operatingSchedule: 'EVERYDAY_365',
    supportedProcesses: ['CS', 'ACC', 'NDR'],
    assignedEmployeeIds: ['emp-4', 'emp-5', 'emp-6']
  },

  // Pod Beta
  {
    id: 'brand-4',
    name: 'Pulse Apparel',
    podId: 'pod-2',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'EVERYDAY_365',
    supportedProcesses: ['CS', 'ACC', 'NDR'],
    assignedEmployeeIds: ['emp-10']
  },
  {
    id: 'brand-5',
    name: 'Kuro Tech',
    podId: 'pod-2',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'WEEKDAYS_ONLY',
    supportedProcesses: ['CS', 'NDR'],
    assignedEmployeeIds: ['emp-11']
  },
  {
    id: 'brand-6',
    name: 'Verve Health',
    podId: 'pod-2',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'DAILY_EXCEPT_HOLIDAYS',
    supportedProcesses: ['CS', 'ACC'],
    assignedEmployeeIds: ['emp-12']
  },

  // Pod Gamma
  {
    id: 'brand-7',
    name: 'Summit Gear',
    podId: 'pod-3',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'EVERYDAY_365',
    supportedProcesses: ['CS', 'ACC', 'NDR'],
    assignedEmployeeIds: ['emp-18']
  },
  {
    id: 'brand-8',
    name: 'Orbit Worldwide',
    podId: 'pod-3',
    modelType: 'MULTI_RESOURCE',
    operatingSchedule: 'EVERYDAY_365',
    supportedProcesses: ['CS', 'ACC', 'NDR'],
    assignedEmployeeIds: ['emp-19', 'emp-20', 'emp-21']
  },

  // Pod Delta
  {
    id: 'brand-9',
    name: 'Lumina Care',
    podId: 'pod-4',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'DAILY_EXCEPT_HOLIDAYS',
    supportedProcesses: ['CS', 'ACC'],
    assignedEmployeeIds: ['emp-26']
  },
  {
    id: 'brand-10',
    name: 'Strata Cloud',
    podId: 'pod-4',
    modelType: 'SINGLE_RESOURCE',
    operatingSchedule: 'WEEKDAYS_ONLY',
    supportedProcesses: ['CS', 'NDR'],
    assignedEmployeeIds: ['emp-27']
  }
];

const RAW_EMPLOYEE_NAMES = [
  'Sarah Jenkins', 'Rahul Sharma', 'Elena Rostova', 'Liam Patel', 'Aria Tan',
  'Devendra Rao', 'Maya Lin', 'Lucas Silva', 'Marcus Vance', 'Priya Mehta',
  'Tariq Al-Mansoor', 'Chloe Bennett', 'Rohan Joshi', 'Zoe Saldana', 'Karan Kapoor',
  'Nina Gomez', 'David Kim', 'Ananya Verma', 'Oliver Brown', 'Sophia Wang',
  'Vikram Malhotra', 'Isabella Rossi', 'Arjun Nair', 'Emma Watson', 'Alex Carter',
  'Neha Gupta', 'Felix Zhang', 'Fatima Zahra', 'Siddharth Sen', 'Grace Hopper',
  'Aditya Roy', 'Kavita Reddy'
];

const STAGGERED_WEEKDAY_OFFS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * 32 Employees mapped to 4 pods (8 employees per pod).
 * Rule: Sunday is fixed weekly off; second weekly off is staggered across weekdays.
 */
export const EMPLOYEES = RAW_EMPLOYEE_NAMES.map((name, index) => {
  const id = `emp-${index + 1}`;
  const podIndex = Math.floor(index / 8);
  const podId = `pod-${podIndex + 1}`;
  const isLead = index % 8 === 0;

  return {
    id,
    name,
    podId,
    role: isLead ? 'LEAD' : 'MEMBER',
    skills: ['CS', 'ACC', 'NDR'],
    fixedOffDay: 'Sunday',
    staggeredOffDay: STAGGERED_WEEKDAY_OFFS[index % STAGGERED_WEEKDAY_OFFS.length],
    compOffBalance: index % 4 === 0 ? 1 : 0
  };
});

export const DEMO_USERS = {
  manager: {
    role: 'MANAGER',
    name: 'Operations Lead (Alex K.)',
    passcode: 'admin123'
  },
  singleResourceEmployee: {
    role: 'EMPLOYEE',
    employeeId: 'emp-2',
    name: 'Rahul Sharma',
    brandName: 'Nova D2C'
  },
  multiResourceEmployee: {
    role: 'EMPLOYEE',
    employeeId: 'emp-4',
    name: 'Liam Patel',
    brandName: 'Zenith Retail'
  }
};