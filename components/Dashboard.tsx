import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { Users, Package, ChevronRight, Building2, MapPin, X, Info, Zap, Loader2 } from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    empCount: 0,
    compCount: 0,
    totalProduction: 0,
    totalPayments: 0,
  });

  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const employees = await DataService.getEmployees();
            const components = await DataService.getComponents();
            let production = await DataService.getProductionLogs();
            let payments = await DataService.getPayments();

            // FILTER DATA IF USER
            if (user?.role === 'USER' && user.employeeId) {
                production = production.filter(p => p.employeeId === user.employeeId);
                payments = payments.filter(p => p.employeeId === user.employeeId);
            }

            const totalProd = production.reduce((acc, curr) => acc + curr.total, 0);
            const totalPay = payments.reduce((acc, curr) => acc + curr.amount, 0);

            setStats({
            empCount: employees.length,
            compCount: components.length,
            totalProduction: totalProd,
            totalPayments: totalPay,
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-dark-card p-3.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
      <div className="flex justify-between items-start gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1 truncate">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
            {loading ? <Loader2 className="animate-spin" size={20} /> : value}
          </h3>
        </div>
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 shrink-0`}>
          <Icon className={`${color.replace('bg-', 'text-')} w-5 h-5 md:w-6 md:h-6`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 relative animate-fade-in">
      
      {/* 0. Company Identity Card (Clickable) */}
      <div 
        onClick={() => setShowInfoModal(true)}
        className="bg-white dark:bg-dark-card p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all group"
      >
         {/* Decorative background element */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

         <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-800/20 shrink-0">
             <Building2 size={24} className="md:w-8 md:h-8" />
           </div>
           <div>
             <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">PT. REDONE BERKAH MANDIRI UTAMA</h1>
                <Info size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-xs md:text-sm mt-1">
               <MapPin size={14} className="shrink-0" />
               Jl. Raya Cileungsi - Jonggol Km. 10, Cipeucang, Cileungsi, Bogor 16820
             </p>
           </div>
         </div>
         
         <div className="hidden md:block text-right relative z-10">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Hari Ini</span>
           <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
             {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
           </span>
         </div>
      </div>

      {/* 1. Financial Summary (Moved Here) */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-dark-card dark:to-slate-900 p-5 md:p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-primary-500 opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-4 backdrop-blur-sm border border-white/10">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-200">Status Keuangan</span>
          </div>
          
          <h3 className="text-sm md:text-base font-medium text-slate-300 mb-1">{user?.role === 'ADMIN' ? 'Total Hutang Gaji Perusahaan' : 'Sisa Saldo Gaji Saya'}</h3>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            {loading ? <Loader2 className="animate-spin" /> : formatCurrency(stats.totalProduction - stats.totalPayments)}
          </h2>
          
          {user?.role === 'ADMIN' && (
             <button 
                onClick={() => onViewChange(ViewState.FINANCE)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-900/20 group"
            >
                Lihat Laporan Detail <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          )}
        </div>
      </div>

      {/* 2. Stat Cards (Quick Info) */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
        {user?.role === 'ADMIN' && (
            <StatCard 
            title="Total Karyawan" 
            value={stats.empCount} 
            icon={Users} 
            color="bg-blue-500 text-blue-500"
            onClick={() => onViewChange(ViewState.EMPLOYEES)}
            />
        )}
         <StatCard 
          title="Item Komponen" 
          value={stats.compCount} 
          icon={Package} 
          color="bg-purple-500 text-purple-500"
          onClick={() => onViewChange(ViewState.COMPONENTS)}
        />
      </div>

      {/* INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <Building2 size={32} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">PT. REDONE BERKAH MANDIRI UTAMA</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                       Jl. Raya Cileungsi - Jonggol Km. 10, Cipeucang, Cileungsi, Bogor 16820
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
               
               {/* App Description */}
               <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                     <Zap size={18} className="text-primary-500" />
                     <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tentang Aplikasi</h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                     <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">RedonePaypro <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full ml-2 align-middle">v1.0.0</span></h4>
                     <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Sistem manajemen produksi dan penggajian borongan terintegrasi yang dirancang khusus untuk mempermudah pencatatan hasil kerja karyawan, pengelolaan kasbon, serta perhitungan gaji otomatis yang akurat dan transparan.
                     </p>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-card rounded-b-2xl flex justify-center text-xs text-slate-400">
               &copy; {new Date().getFullYear()} RedonePaypro. All rights reserved.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;