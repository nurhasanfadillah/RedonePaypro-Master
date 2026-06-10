import { Employee, Component, ProductionLog, Payment, UserAccount } from '../types';
import { supabase } from './supabaseClient';

export const DataService = {
  init: async () => {
    // Check connection or perform initial sync if needed
    // In Supabase context, initialization is mostly handled by the client creation
    // We might check if the default admin exists if the table is empty, but SQL seed handles that.
  },

  // --- EMPLOYEES ---
  getEmployees: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(999999)
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  saveEmployee: async (emp: Employee) => {
    const { data } = await supabase.from('employees').select('id').eq('id', emp.id).single();
    
    if (data) {
        // Update
        const { error } = await supabase.from('employees').update({
            name: emp.name,
            address: emp.address
        }).eq('id', emp.id);
        if (error) throw error;
    } else {
        // Insert
        const { error } = await supabase.from('employees').insert([{
            id: emp.id,
            name: emp.name,
            address: emp.address
        }]);
        if (error) throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    // User deletion handled by DB constraint or manual logic if needed, 
    // but we can also remove the associated user
    await DataService.deleteUserByEmployeeId(id);
  },

  cleanupEmployees: async (): Promise<{ successCount: number, failedCount: number }> => {
    const employees = await DataService.getEmployees();
    let successCount = 0;
    let failedCount = 0;

    for (const emp of employees) {
      const { hasDependencies } = await DataService.checkEmployeeDependencies(emp.id);
      if (hasDependencies) {
        failedCount++;
      } else {
        try {
          await DataService.deleteEmployee(emp.id);
          successCount++;
        } catch (e) {
          failedCount++;
        }
      }
    }
    return { successCount, failedCount };
  },

  checkEmployeeDependencies: async (id: string) => {
    const { count: prodCount } = await supabase
      .from('production_logs')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', id);

    const { count: paymentCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', id);

    const pCount = prodCount || 0;
    const kCount = paymentCount || 0;

    return {
      hasDependencies: pCount > 0 || kCount > 0,
      details: { production: pCount, payments: kCount }
    };
  },

  // --- COMPONENTS ---
  getComponents: async (): Promise<Component[]> => {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .limit(999999)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  saveComponent: async (comp: Component) => {
    const { data } = await supabase.from('components').select('id').eq('id', comp.id).single();

    if (data) {
        const { error } = await supabase.from('components').update({
            name: comp.name,
            price: comp.price
        }).eq('id', comp.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('components').insert([{
            id: comp.id,
            name: comp.name,
            price: comp.price
        }]);
        if (error) throw error;
    }
  },

  deleteComponent: async (id: string) => {
    const { error } = await supabase.from('components').delete().eq('id', id);
    if (error) throw error;
  },

  cleanupComponents: async (): Promise<{ successCount: number, failedCount: number }> => {
    const components = await DataService.getComponents();
    let successCount = 0;
    let failedCount = 0;

    for (const comp of components) {
      const { hasDependencies } = await DataService.checkComponentDependencies(comp.id);
      if (hasDependencies) {
        failedCount++;
      } else {
        try {
          await DataService.deleteComponent(comp.id);
          successCount++;
        } catch (e) {
          failedCount++;
        }
      }
    }
    return { successCount, failedCount };
  },

  checkComponentDependencies: async (id: string) => {
    const { count } = await supabase
        .from('production_logs')
        .select('*', { count: 'exact', head: true })
        .eq('component_id', id);
    
    return {
      hasDependencies: (count || 0) > 0,
      details: { production: count || 0 }
    };
  },

  // --- PRODUCTION ---
  getProductionLogs: async (): Promise<ProductionLog[]> => {
    const { data, error } = await supabase
      .from('production_logs')
      .select('*')
      .limit(999999)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map snake_case to camelCase
    return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        employeeId: item.employee_id,
        componentId: item.component_id,
        qty: item.qty,
        priceSnapshot: item.price_snapshot,
        total: item.total
    }));
  },

  saveProductionLog: async (log: ProductionLog) => {
    const { data } = await supabase.from('production_logs').select('id').eq('id', log.id).single();

    const payload = {
        id: log.id,
        date: log.date,
        employee_id: log.employeeId,
        component_id: log.componentId,
        qty: log.qty,
        price_snapshot: log.priceSnapshot,
        total: log.total
    };

    if (data) {
        const { error } = await supabase.from('production_logs').update(payload).eq('id', log.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('production_logs').insert([payload]);
        if (error) throw error;
    }
  },

  deleteProductionLog: async (id: string) => {
    const { error } = await supabase.from('production_logs').delete().eq('id', id);
    if (error) throw error;
  },

  deleteAllProductionLogs: async () => {
    // Delete all records by matching a condition that is always true
    const { error } = await supabase.from('production_logs').delete().neq('id', '0');
    if (error) throw error;
  },

  // --- PAYMENTS ---
  getPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(999999)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        employeeId: item.employee_id,
        amount: item.amount,
        type: item.type,
        note: item.note
    }));
  },

  savePayment: async (p: Payment) => {
    const { data } = await supabase.from('payments').select('id').eq('id', p.id).single();

    const payload = {
        id: p.id,
        date: p.date,
        employee_id: p.employeeId,
        amount: p.amount,
        type: p.type,
        note: p.note
    };

    if (data) {
        const { error } = await supabase.from('payments').update(payload).eq('id', p.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('payments').insert([payload]);
        if (error) throw error;
    }
  },

  deletePayment: async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  deleteAllPayments: async () => {
    const { error } = await supabase.from('payments').delete().neq('id', '0');
    if (error) throw error;
  },

  // --- AUTH & USER MANAGEMENT ---
  login: async (username: string, password: string): Promise<UserAccount | null> => {
    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // In production, hash check happens here
        .single();
    
    if (error || !data) return null;

    return {
        username: data.username,
        password: data.password,
        role: data.role as any,
        employeeId: data.employee_id,
        fullName: data.full_name
    };
  },

  getUsers: async (): Promise<UserAccount[]> => {
    const { data, error } = await supabase.from('app_users').select('*').limit(999999);
    if (error) throw error;

    return (data || []).map((u: any) => ({
        username: u.username,
        password: u.password,
        role: u.role,
        employeeId: u.employee_id,
        fullName: u.full_name
    }));
  },
  
  getUserByEmployeeId: async (empId: string): Promise<UserAccount | undefined> => {
    const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('employee_id', empId)
        .single();
    
    if (!data) return undefined;

    return {
        username: data.username,
        password: data.password,
        role: data.role,
        employeeId: data.employee_id,
        fullName: data.full_name
    };
  },

  saveUser: async (user: UserAccount) => {
    // Check duplicate username (exclude self logic is tricky in DB without ID, assuming username PK)
    // We try to upsert
    const payload = {
        username: user.username,
        password: user.password,
        role: user.role,
        employee_id: user.employeeId,
        full_name: user.fullName
    };

    const { error } = await supabase.from('app_users').upsert(payload, { onConflict: 'username' });
    if (error) {
         if (error.message.includes('duplicate key')) {
             throw new Error(`Username '${user.username}' sudah digunakan.`);
         }
         throw error;
    }
  },

  updatePassword: async (username: string, oldPass: string, newPass: string) => {
    // Verify old pass first
    const user = await DataService.login(username, oldPass);
    if (!user) throw new Error('Password lama salah atau user tidak ditemukan.');

    const { error } = await supabase
        .from('app_users')
        .update({ password: newPass })
        .eq('username', username);

    if (error) throw new Error(error.message);
    
    // Update session storage
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
    const { error } = await supabase.from('app_users').delete().eq('employee_id', empId);
    if (error) throw error;
  },

  resetData: async () => {
    // Dangerous in cloud context, maybe disable or just clear local storage
    localStorage.clear();
  }
};