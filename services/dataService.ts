import { Employee, Component, ProductionLog, Payment, UserAccount } from '../types';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message: string;
    try {
      const body = await res.json();
      message = body.error || `HTTP ${res.status}`;
    } catch {
      message = `HTTP ${res.status}`;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const DataService = {
  init: async () => {},

  // --- EMPLOYEES ---
  getEmployees: async (): Promise<Employee[]> => {
    return apiFetch<Employee[]>('/api/employees');
  },

  saveEmployee: async (emp: Employee) => {
    await apiFetch('/api/employees', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(emp),
    });
  },

  deleteEmployee: async (id: string) => {
    await apiFetch(`/api/employees?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  cleanupEmployees: async (): Promise<{ successCount: number; failedCount: number }> => {
    const emps = await DataService.getEmployees();
    let successCount = 0;
    let failedCount = 0;
    for (const emp of emps) {
      const { hasDependencies } = await DataService.checkEmployeeDependencies(emp.id);
      if (hasDependencies) {
        failedCount++;
      } else {
        try {
          await DataService.deleteEmployee(emp.id);
          successCount++;
        } catch {
          failedCount++;
        }
      }
    }
    return { successCount, failedCount };
  },

  checkEmployeeDependencies: async (id: string) => {
    return apiFetch<{ hasDependencies: boolean; details: { production: number; payments: number } }>(
      `/api/employees?checkDeps=1&id=${encodeURIComponent(id)}`
    );
  },

  // --- COMPONENTS ---
  getComponents: async (): Promise<Component[]> => {
    return apiFetch<Component[]>('/api/components');
  },

  saveComponent: async (comp: Component) => {
    await apiFetch('/api/components', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(comp),
    });
  },

  deleteComponent: async (id: string) => {
    await apiFetch(`/api/components?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  cleanupComponents: async (): Promise<{ successCount: number; failedCount: number }> => {
    const comps = await DataService.getComponents();
    let successCount = 0;
    let failedCount = 0;
    for (const comp of comps) {
      const { hasDependencies } = await DataService.checkComponentDependencies(comp.id);
      if (hasDependencies) {
        failedCount++;
      } else {
        try {
          await DataService.deleteComponent(comp.id);
          successCount++;
        } catch {
          failedCount++;
        }
      }
    }
    return { successCount, failedCount };
  },

  checkComponentDependencies: async (id: string) => {
    return apiFetch<{ hasDependencies: boolean; details: { production: number } }>(
      `/api/components?checkDeps=1&id=${encodeURIComponent(id)}`
    );
  },

  // --- PRODUCTION ---
  getProductionLogs: async (): Promise<ProductionLog[]> => {
    return apiFetch<ProductionLog[]>('/api/production-logs');
  },

  saveProductionLog: async (log: ProductionLog) => {
    await apiFetch('/api/production-logs', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(log),
    });
  },

  deleteProductionLog: async (id: string) => {
    await apiFetch(`/api/production-logs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  deleteAllProductionLogs: async () => {
    await apiFetch('/api/production-logs?all=1', { method: 'DELETE' });
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    return apiFetch<Payment[]>('/api/payments');
  },

  savePayment: async (p: Payment) => {
    await apiFetch('/api/payments', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(p),
    });
  },

  deletePayment: async (id: string) => {
    await apiFetch(`/api/payments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  deleteAllPayments: async () => {
    await apiFetch('/api/payments?all=1', { method: 'DELETE' });
  },

  // --- AUTH & USER MANAGEMENT ---
  login: async (username: string, password: string): Promise<UserAccount | null> => {
    const result = await apiFetch<UserAccount | null>('/api/auth', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ username, password }),
    });
    return result;
  },

  getUsers: async (): Promise<UserAccount[]> => {
    return apiFetch<UserAccount[]>('/api/users');
  },

  getUserByEmployeeId: async (empId: string): Promise<UserAccount | undefined> => {
    const result = await apiFetch<UserAccount | null>(
      `/api/users?employeeId=${encodeURIComponent(empId)}`
    );
    return result ?? undefined;
  },

  saveUser: async (user: UserAccount) => {
    await apiFetch('/api/users', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(user),
    });
  },

  updatePassword: async (username: string, oldPass: string, newPass: string) => {
    await apiFetch('/api/users?action=password', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ username, oldPass, newPass }),
    });

    const currentUser = localStorage.getItem('borongan_current_user');
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.username === username) {
        parsed.password = newPass;
        localStorage.setItem('borongan_current_user', JSON.stringify(parsed));
      }
    }
  },

  deleteUserByEmployeeId: async (empId: string) => {
    await apiFetch(`/api/users?employeeId=${encodeURIComponent(empId)}`, { method: 'DELETE' });
  },

  resetData: async () => {
    localStorage.clear();
  },
};
