
export interface Employee {
  id: string;
  name: string;
  address: string;
}

export interface Component {
  id: string;
  name: string;
  price: number;
}

export interface ProductionLog {
  id: string;
  date: string;
  employeeId: string;
  componentId: string;
  qty: number;
  priceSnapshot: number; // Price at time of entry
  total: number;
}

export interface Payment {
  id: string;
  date: string;
  employeeId: string;
  amount: number;
  type: 'KASBON' | 'SALARY'; // KASBON = Loan, SALARY = Wage Payment
  note?: string;
}

export interface LedgerItem {
  id: string; // Ref ID
  date: string;
  employeeId: string;
  employeeName: string;
  description: string;
  type: 'IN' | 'OUT'; // IN = Production (Wage Liability Increases), OUT = Payment/Kasbon (Liability Decreases)
  amount: number;
  balance: number; // Running balance
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EMPLOYEES = 'EMPLOYEES',
  COMPONENTS = 'COMPONENTS',
  PRODUCTION = 'PRODUCTION',
  PAYMENTS = 'PAYMENTS', // Changed from KASBON
  FINANCE = 'FINANCE',
  REKAP = 'REKAP'
}

// --- AUTH TYPES ---
export type UserRole = 'ADMIN' | 'USER';

export interface UserAccount {
  username: string;
  password: string; // In real app, this should be hashed
  role: UserRole;
  employeeId?: string; // If role is USER, link to specific employee
  fullName: string;
}
