import React, { useState, useEffect, useRef } from 'react';
import { DataService } from './services/dataService';
import { ViewState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Factory, 
  Wallet, 
  FileText, 
  Menu, 
  Moon, 
  Sun,
  ClipboardList,
  LogOut,
  UserCircle,
  X,
  Lock,
  CheckCircle,
  Key,
  ChevronDown,
  Settings
} from 'lucide-react';

// Import Views
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Components from './components/Components';
import Production from './components/Production';
import Payments from './components/Payments'; 
import Finance from './components/Finance';
import RekapHasil from './components/RekapHasil';

interface NavItemProps {
  view: ViewState;
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      isActive
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'
    }`}
  >
    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary-600 dark:text-slate-400'} />
    <span className="font-medium">{label}</span>
  </button>
);

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  // Profile Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setIsDark(!isDark);

  // --- MENU CONFIGURATION BASED ON ROLE ---
  const allMenuItems = [
    { view: ViewState.DASHBOARD, icon: LayoutDashboard, label: "Home", roles: ['ADMIN', 'USER'] },
    { view: ViewState.PRODUCTION, icon: Factory, label: "Produksi", roles: ['ADMIN', 'USER'] },
    { view: ViewState.PAYMENTS, icon: Wallet, label: "Pembayaran", roles: ['ADMIN', 'USER'] },
    { view: ViewState.EMPLOYEES, icon: Users, label: "Karyawan", roles: ['ADMIN'] },
    { view: ViewState.COMPONENTS, icon: Package, label: "Komponen", roles: ['ADMIN', 'USER'] }, 
    // Replaced Finance with Rekap as primary financial view
    { view: ViewState.REKAP, icon: ClipboardList, label: "Rekap", roles: ['ADMIN'] },
  ];

  const visibleMenuItems = allMenuItems.filter(item => item.roles.includes(user?.role || 'USER'));

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutConfirmOpen(false);
  };

  // --- PASSWORD CHANGE LOGIC ---
  const handleOpenPasswordModal = () => {
      setPasswordForm({ old: '', new: '', confirm: '' });
      setPasswordError('');
      setPasswordSuccess('');
      setIsPasswordModalOpen(true);
      setIsProfileMenuOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError('');
      setPasswordSuccess('');

      if (passwordForm.new.length < 5) {
          setPasswordError('Password baru minimal 5 karakter');
          return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
          setPasswordError('Konfirmasi password tidak cocok');
          return;
      }

      try {
          await DataService.updatePassword(user?.username || '', passwordForm.old, passwordForm.new);
          setPasswordSuccess('Password berhasil diubah!');
          setPasswordForm({ old: '', new: '', confirm: '' });
          
          setTimeout(() => {
              setIsPasswordModalOpen(false);
          }, 1500);
      } catch (err: any) {
          setPasswordError(err.message || 'Gagal mengubah password');
      }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 overflow-hidden print:overflow-visible print:h-auto animate-fade-in">
      {/* Logout Confirmation Modal */}
      <ConfirmModal 
        isOpen={isLogoutConfirmOpen}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        confirmText="Logout"
        cancelText="Batal"
        type="danger"
      />

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Lock size={20} className="text-primary-500" /> Ganti Password
                    </h3>
                    <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                </div>

                {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium">
                        {passwordError}
                    </div>
                )}
                
                {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl font-medium flex items-center gap-2">
                        <CheckCircle size={16} /> {passwordSuccess}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password Lama</label>
                        <input 
                            type="password" 
                            required 
                            value={passwordForm.old}
                            onChange={e => setPasswordForm({...passwordForm, old: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ketik password lama"
                        />
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                         <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password Baru</label>
                            <input 
                                type="password" 
                                required 
                                value={passwordForm.new}
                                onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Ketik password baru"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Konfirmasi Password Baru</label>
                            <input 
                                type="password" 
                                required 
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Ulangi password baru"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsPasswordModalOpen(false)} 
                            className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20"
                        >
                            <CheckCircle size={18} /> Simpan
                        </button>
                    </div>
                </form>
             </div>
          </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[80] md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-[90] w-64 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border transform transition-transform duration-300 ease-in-out print:hidden flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:block`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                R
              </div>
              <span className="font-bold text-lg tracking-tight">Redone<span className="text-primary-600">Paypro</span></span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
              <X size={20}/>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 pt-2">Menu Utama</div>
            {visibleMenuItems.map(item => (
               <NavItem 
                 key={item.view} 
                 view={item.view} 
                 icon={item.icon} 
                 label={item.label === 'Home' ? 'Dashboard' : item.label} 
                 isActive={currentView === item.view}
                 onClick={() => handleNavClick(item.view)}
               />
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-dark-border space-y-2">
             <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
             >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible">
        {/* Header - Z-index set high (40) to be above content but below sidebar */}
        <header className="h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 md:px-6 z-[40] relative print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">R</div>
               <span className="font-bold text-lg tracking-tight">Redone<span className="text-primary-600">Paypro</span></span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden md:block">
               {user?.role === 'ADMIN' ? 'Administrator' : 'Karyawan'} Panel
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:ring-2 ring-primary-500/50 transition-all"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700 relative" ref={profileMenuRef}>
              <div 
                className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1">{user?.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center border-2 border-transparent hover:border-primary-500 transition-all">
                    <UserCircle size={22} />
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* PROFILE DROPDOWN MENU */}
              {isProfileMenuOpen && (
                <>
                  {/* Fixed Backdrop to capture clicks outside and prevent click-through to dashboard content */}
                  <div 
                    className="fixed inset-0 z-[50] bg-transparent"
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></div>

                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[60] overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5">
                      {/* Mobile Only: User Info Section */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 sm:hidden bg-slate-50 dark:bg-slate-900/50">
                          <p className="font-bold text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
                      </div>
                      
                      <div className="p-2">
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPasswordModal();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                              <Key size={18} className="text-slate-400 dark:text-slate-500" />
                              Ganti Password
                          </button>
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleLogoutClick();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                              <LogOut size={18} />
                              Logout
                          </button>
                      </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-8 relative print:p-0 print:overflow-visible pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 print:max-w-none print:pb-0">
            {currentView === ViewState.DASHBOARD && <Dashboard key={refreshKey} onViewChange={setCurrentView} />}
            {currentView === ViewState.EMPLOYEES && user?.role === 'ADMIN' && <Employees key={refreshKey} />}
            {currentView === ViewState.COMPONENTS && <Components key={refreshKey} />}
            {currentView === ViewState.PRODUCTION && <Production key={refreshKey} />}
            {currentView === ViewState.PAYMENTS && <Payments key={refreshKey} />}
            {currentView === ViewState.FINANCE && user?.role === 'ADMIN' && <Finance key={refreshKey} />}
            {currentView === ViewState.REKAP && user?.role === 'ADMIN' && <RekapHasil key={refreshKey} />}
            
            {/* Fallback if user tries to access restricted view via state retention */}
            {(!visibleMenuItems.find(i => i.view === currentView)) && (
                <div className="p-8 text-center text-slate-500">
                    Akses tidak diizinkan untuk halaman ini.
                </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
          <div className="flex items-center justify-around px-2 py-2">
             {visibleMenuItems
                .filter(item => item.view !== ViewState.EMPLOYEES && item.view !== ViewState.COMPONENTS) // Exclude Employees AND Components for cleaner mobile nav
                .slice(0, 4).map((item) => { // Limit to 4 items on mobile bar
               const Icon = item.icon;
               const isActive = currentView === item.view;
               return (
                 <button
                   key={item.view}
                   onClick={() => setCurrentView(item.view)}
                   className={`flex flex-col items-center justify-center w-full py-1 rounded-lg transition-all ${
                     isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                   }`}
                 >
                   <div className={`p-1.5 rounded-2xl mb-1 transition-all duration-300 ${isActive ? 'bg-primary-100 dark:bg-primary-900/30 -translate-y-1' : ''}`}>
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                   </div>
                   <span className={`text-[10px] font-medium leading-none transition-all ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>{item.label}</span>
                 </button>
               )
             })}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    const init = async () => {
        await DataService.init();
    };
    init();
  }, []);

  return (
    <AuthProvider>
        <Toaster position="top-center" />
        <RootContainer />
    </AuthProvider>
  );
}

const RootContainer: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <AppLayout /> : <Login />;
}

export default App;