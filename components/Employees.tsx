import React, { useState, useEffect } from 'react';
import { Employee, UserAccount } from '../types';
import { DataService } from '../services/dataService';
import ConfirmModal from './ConfirmModal';
import EmployeeDetail from './EmployeeDetail';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Search, User, CheckCircle, X, MapPin, Printer, Loader2, Key, Shield, MoreVertical, AlertCircle, FileText } from 'lucide-react';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State for Employee Detail
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Employee>({ id: '', name: '', address: '' });
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Access Modal States
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [accessData, setAccessData] = useState({ username: '', password: '' });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Modal States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removeAccessConfirm, setRemoveAccessConfirm] = useState<Employee | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Cleanup States
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ success: number, failed: number } | null>(null);
  const [cleanupInputValue, setCleanupInputValue] = useState('');

  // Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
        if (activeMenu && !event.target.closest('.action-menu')) {
            setActiveMenu(null);
        }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  const loadData = async () => {
    setLoading(true);
    try {
        const emp = await DataService.getEmployees();
        const usr = await DataService.getUsers();
        setEmployees(emp);
        setUsers(usr);
    } catch (error) {
        console.error("Error loading employees", error);
    } finally {
        setLoading(false);
    }
  };

  const handleOpen = (emp?: Employee) => {
    if (emp) {
      setFormData({ ...emp });
      setIsEditing(true);
    } else {
      const maxId = employees.reduce((max, e) => {
        const numPart = parseInt(e.id.replace('KPRD-', ''), 10);
        return !isNaN(numPart) && numPart > max ? numPart : max;
      }, 0);
      const newId = `KPRD-${(maxId + 1).toString().padStart(3, '0')}`;
      
      setFormData({ id: newId, name: '', address: '' });
      setIsEditing(false);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        toast.error("Nama karyawan tidak boleh kosong.");
        return;
    }
    if (!formData.address.trim()) {
        toast.error("Alamat karyawan tidak boleh kosong.");
        return;
    }

    try {
        await DataService.saveEmployee(formData);
        toast.success(isEditing ? "Karyawan diperbarui" : "Karyawan ditambahkan");
        setIsOpen(false);
        loadData();
    } catch (error) {
        toast.error("Gagal menyimpan data.");
    }
  };

  // --- ACCESS MANAGEMENT ---
  const handleOpenAccess = async (emp: Employee) => {
    setSelectedEmployee(emp);
    const existingUser = await DataService.getUserByEmployeeId(emp.id);
    if (existingUser) {
        setAccessData({ username: existingUser.username, password: existingUser.password });
    } else {
        setAccessData({ username: '', password: '' });
    }
    setIsAccessOpen(true);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    if (!accessData.username || !accessData.password) {
        toast.error("Username dan Password wajib diisi");
        return;
    }

    try {
        const newUser: UserAccount = {
            username: accessData.username,
            password: accessData.password,
            role: 'USER',
            employeeId: selectedEmployee.id,
            fullName: selectedEmployee.name
        };
        await DataService.saveUser(newUser);
        toast.success("Akses login diberikan");
        setIsAccessOpen(false);
        loadData(); 
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  const handleRequestRemoveAccess = () => {
     if (selectedEmployee) {
         setRemoveAccessConfirm(selectedEmployee);
     }
  };

  const executeRemoveAccess = async () => {
      if (removeAccessConfirm) {
          await DataService.deleteUserByEmployeeId(removeAccessConfirm.id);
          toast.success("Akses login dihapus");
          setIsAccessOpen(false);
          setRemoveAccessConfirm(null);
          loadData();
      }
  };

  const handleRequestDelete = async (emp: Employee) => {
    const dependencyCheck = await DataService.checkEmployeeDependencies(emp.id);
    
    if (dependencyCheck.hasDependencies) {
      const details = [];
      if (dependencyCheck.details.production > 0) details.push(`Hasil Kerja (${dependencyCheck.details.production})`);
      if (dependencyCheck.details.payments > 0) details.push(`Pembayaran/Kasbon (${dependencyCheck.details.payments})`);
      
      const msg = `Tidak dapat menghapus karyawan ${emp.name}. Data ini masih memiliki keterkaitan dengan: ${details.join(', ')}. Harap hapus transaksi terkait terlebih dahulu.`;
      setAlertMessage(msg);
    } else {
      setDeleteId(emp.id);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await DataService.deleteEmployee(deleteId);
        toast.success("Karyawan berhasil dihapus.");
        loadData();
      } catch (error) {
        console.error("Gagal menghapus karyawan", error);
        toast.error("Gagal menghapus karyawan. Periksa koneksi internet Anda.");
      } finally {
        setDeleteId(null);
      }
    }
  };

  const executeCleanup = async () => {
    if (cleanupInputValue.toLowerCase() === 'cleanup') {
      try {
        const result = await DataService.cleanupEmployees();
        setCleanupResult(result);
        setShowCleanupModal(false);
        setCleanupInputValue('');
        loadData();
      } catch (err) {
        toast.error("Gagal melakukan cleanup data karyawan.");
      }
    } else {
      toast.error("Teks konfirmasi tidak sesuai. Ketik 'cleanup' untuk melanjutkan.");
    }
  };

  // --- PDF EXPORT LOGIC ---
  const handlePrint = () => {
    const w = window as any;
    if (!w.jspdf) {
      toast.loading('Library PDF sedang dimuat.', { duration: 2000 });
      return;
    }

    setIsPrinting(true);

    try {
      const { jsPDF } = w.jspdf;
      // Portrait ('p') is sufficient for employee list
      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("DATA KARYAWAN AKTIF", 14, 21);
      
      doc.setFontSize(10);
      const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Per Tanggal: ${today}`, 14, 27);
      doc.text(`Total Karyawan: ${employees.length} Orang`, 14, 32);

      doc.line(14, 35, 196, 35); // A4 width is 210mm, margins 14mm

      // 2. Prepare Data
      const tableColumn = ["ID Karyawan", "Nama Lengkap", "Alamat / Domisili"];
      const tableRows = employees.map(emp => [
        emp.id,
        emp.name,
        emp.address
      ]);

      // 3. Generate Table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { 
          fillColor: [22, 163, 74], // Green-600 to match theme
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: 20
        },
        columnStyles: {
          0: { cellWidth: 35, font: 'courier' }, // ID
          1: { cellWidth: 50, fontStyle: 'bold' }, // Name
          2: { cellWidth: 'auto' } // Address
        }
      });

      // 4. Signatures
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      if (finalY > 250) doc.addPage();
      const sigY = finalY > 250 ? 40 : finalY;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);

      // Right Sig (Manager HRD)
      doc.text("Mengetahui,", 150, sigY, { align: 'center' });
      doc.text("Manager HRD", 150, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 150, sigY + 30, { align: 'center' });

      doc.save(`Data_Karyawan_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF berhasil dibuat!");

    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasAccess = (empId: string) => users.some(u => u.employeeId === empId);

  if (viewingEmployee) {
    return (
      <EmployeeDetail 
        employee={viewingEmployee} 
        onBack={() => setViewingEmployee(null)} 
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 relative animate-fade-in">
      {isPrinting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin mb-4 text-primary-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Data Karyawan"
        message="Apakah Anda yakin ingin menghapus data ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        confirmText="Hapus"
      />

      <ConfirmModal 
        isOpen={!!removeAccessConfirm}
        title="Hapus Akses Login"
        message={`Apakah Anda yakin ingin menghapus akses login untuk ${removeAccessConfirm?.name}?`}
        onConfirm={executeRemoveAccess}
        onCancel={() => setRemoveAccessConfirm(null)}
        type="danger"
        confirmText="Hapus Akses"
      />

      <ConfirmModal 
        isOpen={!!alertMessage}
        title="Gagal Menghapus Data"
        message={alertMessage || ''}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
        type="info"
        singleButton={true}
        confirmText="Mengerti"
      />

      {/* Cleanup Result Modal */}
      {cleanupResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border text-center">
            <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-4">
               <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Cleanup Selesai</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              Berhasil dihapus: <span className="font-bold text-green-600">{cleanupResult.success}</span> data<br/>
              Gagal dihapus (memiliki relasi): <span className="font-bold text-red-600">{cleanupResult.failed}</span> data
            </p>
            <button 
              onClick={() => setCleanupResult(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Cleanup Data Karyawan</h3>
              </div>
              <button onClick={() => {setShowCleanupModal(false); setCleanupInputValue('');}} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 space-y-3">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Tindakan ini akan menghapus data karyawan yang <span className="font-bold text-slate-800 dark:text-white">tidak memiliki relasi</span> (belum ada transaksi pembayaran atau hasil kerja). Data karyawan dengan relasi akan diabaikan.
                </p>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Ketik <span className="font-mono bg-white dark:bg-black/30 px-1.5 py-0.5 rounded text-red-600 font-bold tracking-wider">cleanup</span> untuk mengonfirmasi.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <input 
                  type="text" 
                  value={cleanupInputValue} 
                  onChange={(e) => setCleanupInputValue(e.target.value)} 
                  placeholder="Ketik 'cleanup' disini..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-mono text-lg font-bold tracking-wider" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {setShowCleanupModal(false); setCleanupInputValue('');}} 
                  className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Batal
                </button>
                <button 
                  onClick={executeCleanup}
                  disabled={cleanupInputValue.toLowerCase() !== 'cleanup'}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Jalankan Cleanup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 md:gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowCleanupModal(true)} 
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm"
          >
            <Trash2 size={18} /> Cleanup
          </button>
          <button 
            onClick={handlePrint} 
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-200 shadow-lg shadow-slate-800/20 transition-all font-medium text-sm"
          >
            <Printer size={18} /> Ekspor
          </button>
          <button 
            onClick={() => handleOpen()} 
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all font-medium text-sm"
          >
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>

      {loading ? (
          <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
      ) : (
      <>
      {/* DESKTOP VIEW */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-visible shadow-sm">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">ID Karyawan</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Alamat / Domisili</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filtered.map(emp => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setViewingEmployee(emp)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                      {emp.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        <User size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{emp.name}</span>
                        {hasAccess(emp.id) && (
                            <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Shield size={10} /> Akses Login Aktif
                            </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{emp.address}</td>
                  <td className="px-6 py-4 text-right relative action-menu">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === emp.id ? null : emp.id); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>
                    
                    {activeMenu === emp.id && (
                        <div className="absolute right-8 top-8 w-48 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-lg z-50 p-1 flex flex-col text-left">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setViewingEmployee(emp); setActiveMenu(null); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                            >
                                <FileText size={14} className="text-primary-500" /> Lihat Detail
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenAccess(emp); setActiveMenu(null); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <Key size={14} className={hasAccess(emp.id) ? "text-green-500" : "text-slate-400"} />
                                {hasAccess(emp.id) ? "Ubah Akses Login" : "Buat Akses Login"}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpen(emp); setActiveMenu(null); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <Edit2 size={14} /> Edit Data
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRequestDelete(emp); setActiveMenu(null); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                                <Trash2 size={14} /> Hapus Karyawan
                            </button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {filtered.map(emp => (
          <div 
            key={emp.id} 
            className="bg-white dark:bg-dark-card p-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center justify-between overflow-visible relative cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => setViewingEmployee(emp)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold text-sm">
                 {emp.name.charAt(0)}
              </div>
              <div className="min-w-0">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{emp.name}</h3>
                 <div className="flex flex-col gap-0.5 mt-0.5">
                   <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 w-fit px-1.5 rounded">{emp.id}</span>
                        {hasAccess(emp.id) && <Shield size={10} className="text-green-500"/>}
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                      <MapPin size={10} /> {emp.address}
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="relative action-menu shrink-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === emp.id ? null : emp.id); }} 
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <MoreVertical size={20} />
                </button>
                {activeMenu === emp.id && (
                    <div className="absolute right-0 top-10 w-48 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-xl z-50 p-1 flex flex-col text-left">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setViewingEmployee(emp); setActiveMenu(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <FileText size={16} className="text-primary-500" /> Lihat Detail
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenAccess(emp); setActiveMenu(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <Key size={16} className={hasAccess(emp.id) ? "text-green-500" : "text-slate-400"} />
                            {hasAccess(emp.id) ? "Ubah Akses" : "Buat Akses"}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpen(emp); setActiveMenu(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <Edit2 size={16} /> Edit Data
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRequestDelete(emp); setActiveMenu(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 size={16} /> Hapus
                        </button>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
          <User size={48} className="mb-4 opacity-20" />
          <p>Data karyawan tidak ditemukan.</p>
        </div>
      )}
      </>
      )}

      {/* EMPLOYEE FORM MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isEditing ? 'Edit Data Karyawan' : 'Karyawan Baru'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pb-6">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">ID Karyawan</label>
                <input 
                  type="text" 
                  value={formData.id} 
                  readOnly 
                  className="w-full px-4 py-3 md:py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-mono" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Alamat</label>
                <textarea 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="Alamat lengkap..."
                  className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  rows={3} 
                />
              </div>
              
              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20"
                >
                  <CheckCircle size={18} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN ACCESS MODAL */}
      {isAccessOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Akses Login</h3>
                  <p className="text-xs text-slate-500">Untuk {selectedEmployee.name}</p>
              </div>
              <button onClick={() => setIsAccessOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveAccess} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Username</label>
                <input 
                  type="text" 
                  required 
                  value={accessData.username} 
                  onChange={e => setAccessData({...accessData, username: e.target.value})} 
                  placeholder="Username unik"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                <input 
                  type="text" 
                  required 
                  value={accessData.password} 
                  onChange={e => setAccessData({...accessData, password: e.target.value})} 
                  placeholder="Password"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              
              <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20"
                >
                  <Key size={18} /> Simpan Akses
                </button>
                {hasAccess(selectedEmployee.id) && (
                    <button 
                        type="button"
                        onClick={handleRequestRemoveAccess}
                        className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                    >
                        Hapus Akses
                    </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Employees;