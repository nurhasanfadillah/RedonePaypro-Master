import React, { useState, useEffect } from 'react';
import { ProductionLog, Employee, Component } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, CheckCircle, X, Filter, RotateCcw, Calendar, Search, ChevronDown, ChevronUp, Printer, Loader2, User, Package, AlertCircle, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

const Production: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States for Table View
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterComponentId, setFilterComponentId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form States
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({ id: '', date: '', employeeId: '', componentId: '', qty: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Export States
  const [isPrinting, setIsPrinting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState({ start: '', end: '' });
  
  // New Export States
  const [exportType, setExportType] = useState<'COMPONENT' | 'EMPLOYEE'>('COMPONENT');
  const [selectedExportEmpId, setSelectedExportEmpId] = useState('');

  // Cleanup States
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupInputValue, setCleanupInputValue] = useState('');

  useEffect(() => { loadData(); }, [user]);
  
  const loadData = async () => {
    setLoading(true);
    try {
        let allLogs = await DataService.getProductionLogs();
        const empData = await DataService.getEmployees();
        const compData = await DataService.getComponents();
        
        // RBAC: If User, only show their own logs
        if (user?.role === 'USER' && user.employeeId) {
            allLogs = allLogs.filter(log => log.employeeId === user.employeeId);
            setFilterEmployeeId(user.employeeId);
        }

        setLogs(allLogs);
        setEmployees(empData);
        setComponents(compData);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
    
    // Default export period to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-CA');
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString('en-CA');
    setExportPeriod({ start: firstDay, end: lastDay });
  };

  // Reset page when filter changes or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStartDate, filterEndDate, filterEmployeeId, filterComponentId, itemsPerPage]);

  const handleOpen = (log?: ProductionLog) => {
    if (log) {
      setFormData({ ...log });
      setIsEditing(true);
    } else {
      const localDate = new Date().toLocaleDateString('en-CA');
      setFormData({ 
        id: Date.now().toString(), // Temporal ID for frontend, Supabase can handle UUIDs if migrated fully but sticking to text for now
        date: localDate, 
        employeeId: '', 
        componentId: '', 
        qty: 0 
      });
      setIsEditing(false);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
        toast.error("Tanggal pengerjaan harus diisi.");
        return;
    }
    if (new Date(formData.date) > new Date()) {
        toast.error("Tanggal pengerjaan tidak boleh melebihi hari ini.");
        return;
    }
    if (!formData.employeeId) {
        toast.error("Karyawan harus dipilih.");
        return;
    }
    if (!formData.componentId) {
        toast.error("Komponen harus dipilih.");
        return;
    }
    if (formData.qty <= 0) {
        toast.error("Kuantitas (Qty) harus lebih dari 0.");
        return;
    }

    const comp = components.find(c => c.id === formData.componentId);
    if (!comp) return;

    const logData: ProductionLog = {
      ...formData,
      priceSnapshot: comp.price,
      total: formData.qty * comp.price
    };
    
    try {
        await DataService.saveProductionLog(logData);
        toast.success(isEditing ? "Data produksi diperbarui" : "Data produksi ditambahkan");
        setIsOpen(false);
        loadData();
    } catch (e) {
        toast.error("Gagal menyimpan data produksi.");
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await DataService.deleteProductionLog(deleteId);
        toast.success("Data produksi berhasil dihapus.");
        loadData();
      } catch (error) {
        console.error("Gagal menghapus data", error);
        toast.error("Gagal menghapus data produksi. Periksa koneksi internet Anda.");
      } finally {
        setDeleteId(null);
      }
    }
  };

  const executeCleanup = async () => {
    if (cleanupInputValue.toLowerCase() === 'cleanup') {
      try {
        await DataService.deleteAllProductionLogs();
        setShowCleanupModal(false);
        setCleanupInputValue('');
        loadData();
        toast.success("Semua data hasil kerja berhasil dihapus.");
      } catch (err) {
        toast.error("Gagal menghapus data hasil kerja.");
      }
    } else {
      toast.error("Teks konfirmasi tidak sesuai. Ketik 'cleanup' untuk melanjutkan.");
    }
  };

  const resetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    // Only reset emp filter if admin
    if (user?.role === 'ADMIN') {
        setFilterEmployeeId('');
    }
    setFilterComponentId('');
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || id;
  const getCompName = (id: string) => components.find(c => c.id === id)?.name || id;
  const currentTotal = () => {
    const p = components.find(c => c.id === formData.componentId)?.price || 0;
    return p * formData.qty;
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Helper for Daily Summary Context
  const getDailySummary = () => {
    if (!formData.employeeId || !formData.date) return null;
    
    const dailyLogs = logs.filter(l => 
      l.employeeId === formData.employeeId && 
      l.date === formData.date &&
      l.id !== formData.id // Exclude current editing item
    );
    
    const totalDaily = dailyLogs.reduce((acc, curr) => acc + curr.total, 0);
    const countItems = dailyLogs.length;
    
    return { totalDaily, countItems };
  };
  
  const dailyContext = getDailySummary();

  // Logic Filtering for Table View
  const filteredLogs = logs.filter(log => {
    const matchStartDate = filterStartDate ? log.date >= filterStartDate : true;
    const matchEndDate = filterEndDate ? log.date <= filterEndDate : true;
    const matchEmployee = filterEmployeeId ? log.employeeId === filterEmployeeId : true;
    const matchComponent = filterComponentId ? log.componentId === filterComponentId : true;
    return matchStartDate && matchEndDate && matchEmployee && matchComponent;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // PAGINATION LOGIC
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // --- PDF EXPORT LOGIC ---
  const handleProcessExport = async () => {
    // ... (Use existing export logic but handle context)
    // IMPORTANT: If User role, force selection of their own employee ID for "Struk Gaji" scenario
    
    const w = window as any;
    if (!w.jspdf) {
      toast.loading('Library PDF sedang dimuat.', { duration: 2000 });
      return;
    }
    
    // Auto select self if user
    let targetEmpId = selectedExportEmpId;
    if (user?.role === 'USER') {
        targetEmpId = user.employeeId || '';
    }

    if (exportType === 'EMPLOYEE' && !targetEmpId) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    setIsPrinting(true);
    setShowExportModal(false);

    try {
      const { jsPDF } = w.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4'); // Portrait

      const startStr = new Date(exportPeriod.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const endStr = new Date(exportPeriod.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // FRESH DATA FETCH FOR REPORT
      let exportRawData = await DataService.getProductionLogs();
      exportRawData = exportRawData.filter(log => 
          log.date >= exportPeriod.start && log.date <= exportPeriod.end
      );

      if (exportType === 'COMPONENT') {
         // ... (Keep existing component report logic)
        // --- SCENARIO 1: ACCUMULATION BY COMPONENT (GLOBAL/PERSONAL) ---
        // Header Left Aligned for Reports
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("REKAPITULASI PRODUKSI PER KOMPONEN", 14, 21);
        doc.setFontSize(10);
        doc.text(`Periode: ${startStr} s/d ${endStr}`, 14, 27);
        if (user?.role === 'USER') {
             doc.text(`Karyawan: ${getEmpName(user.employeeId || '')}`, 14, 32);
        }
        doc.line(14, 35, 196, 35);

        if (user?.role === 'USER' && user.employeeId) {
             exportRawData = exportRawData.filter(log => log.employeeId === user.employeeId);
        }

        const aggMap = new Map<string, { compName: string, totalQty: number, totalAmount: number }>();

        exportRawData.forEach(log => {
          if (!aggMap.has(log.componentId)) {
            aggMap.set(log.componentId, {
              compName: getCompName(log.componentId),
              totalQty: 0,
              totalAmount: 0
            });
          }
          const entry = aggMap.get(log.componentId)!;
          entry.totalQty += log.qty;
          entry.totalAmount += log.total;
        });

        const sortedData = Array.from(aggMap.values()).sort((a, b) => a.compName.localeCompare(b.compName));

        // Generate Table
        const tableColumn = ["No", "Nama Komponen", "Total Qty", "Total Upah"];
        const tableRows: any[] = [];
        
        sortedData.forEach((item, index) => {
          tableRows.push([
            index + 1,
            item.compName,
            item.totalQty,
            formatCurrency(item.totalAmount)
          ]);
        });

        // Grand Total
        const totalAmount = sortedData.reduce((acc, curr) => acc + curr.totalAmount, 0);
        const totalQty = sortedData.reduce((acc, curr) => acc + curr.totalQty, 0);

        tableRows.push([
          { content: "TOTAL GRAND", colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: totalQty, styles: { fontStyle: 'bold' } },
          { content: formatCurrency(totalAmount), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }
        ]);

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'center' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
          }
        });

        doc.save(`Rekap_Komponen_${exportPeriod.start}.pdf`);

      } else {
        // --- SCENARIO 2: ACCUMULATION BY EMPLOYEE (STRUK GAJI PROFESIONAL) ---
        
        const empName = getEmpName(targetEmpId);
        
        // 1. Header Centered (Format Resmi)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 105, 15, { align: "center" });
        
        doc.setFontSize(12);
        doc.text("SLIP GAJI BORONGAN", 105, 22, { align: "center" });
        
        // Garis Pemisah Header
        doc.setLineWidth(0.5);
        doc.line(15, 26, 195, 26);
        doc.setLineWidth(0.1); // Reset width

        // 2. Info Karyawan
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const startY = 35;
        
        doc.text("Nama Karyawan", 15, startY);
        doc.text(":", 45, startY);
        doc.setFont("helvetica", "bold");
        doc.text(empName.toUpperCase(), 48, startY);
        
        doc.setFont("helvetica", "normal");
        doc.text("Periode", 15, startY + 5);
        doc.text(":", 45, startY + 5);
        doc.text(`${startStr} - ${endStr}`, 48, startY + 5);

        // Filter Data for Specific Employee
        const rawData = exportRawData.filter(log => log.employeeId === targetEmpId);

        // Aggregation per Component for that employee
        const aggMap = new Map<string, { compName: string, totalQty: number, totalAmount: number }>();

        rawData.forEach(log => {
          if (!aggMap.has(log.componentId)) {
            aggMap.set(log.componentId, {
              compName: getCompName(log.componentId),
              totalQty: 0,
              totalAmount: 0
            });
          }
          const entry = aggMap.get(log.componentId)!;
          entry.totalQty += log.qty;
          entry.totalAmount += log.total;
        });

        const sortedData = Array.from(aggMap.values()).sort((a, b) => a.compName.localeCompare(b.compName));

        // Generate Table Data
        const tableColumn = ["No", "Nama Pekerjaan / Komponen", "Qty", "Subtotal"];
        const tableRows: any[] = [];
        
        sortedData.forEach((item, index) => {
          tableRows.push([
            index + 1,
            item.compName,
            item.totalQty,
            formatCurrency(item.totalAmount)
          ]);
        });

        // Grand Total
        const totalAmount = sortedData.reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 3. Generate Table (Gaya Minimalis/Resmi)
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 45,
          theme: 'plain',
          headStyles: { 
            fillColor: [243, 244, 246], // Light Gray Header
            textColor: 33, // Almost Black
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: 200,
            halign: 'left'
          },
          bodyStyles: {
            lineColor: 229, // Slate 200
            lineWidth: 0.1, // Bottom border for rows
            textColor: 50
          },
          styles: {
            fontSize: 10,
            cellPadding: 3,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 45, halign: 'right' }
          }
        });

        // 4. Footer Total Box
        const finalY = (doc as any).lastAutoTable.finalY + 5;
        
        // Kotak Total (Light Gray Background)
        doc.setFillColor(243, 244, 246);
        doc.rect(125, finalY, 70, 12, 'F'); 
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(33, 33, 33);
        
        doc.text("TOTAL TERIMA:", 130, finalY + 8);
        doc.text(formatCurrency(totalAmount), 190, finalY + 8, { align: 'right' });

        // 5. Signatures
        const sigY = finalY + 35;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Kiri
        doc.text("Penerima,", 40, sigY, { align: 'center' });
        doc.text(`(${empName})`, 40, sigY + 25, { align: 'center' });
        
        // Kanan
        doc.text("Admin Keuangan,", 160, sigY, { align: 'center' });
        doc.text("(____________________)", 160, sigY + 25, { align: 'center' });

        doc.save(`Slip_Gaji_${empName.replace(/\s+/g, '_')}_${exportPeriod.start}.pdf`);
      }
      toast.success("PDF berhasil dibuat!");

    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative animate-fade-in">
       {isPrinting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin mb-4 text-green-500" />
          <p className="text-lg font-bold">Sedang Mengolah Data & Membuat PDF...</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Data Hasil Kerja"
        message="Yakin ingin menghapus data ini?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        confirmText="Hapus"
      />

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Hapus Semua Data</h3>
              </div>
              <button onClick={() => {setShowCleanupModal(false); setCleanupInputValue('');}} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 space-y-3">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Tindakan ini akan <span className="font-bold border-b border-red-500 text-slate-800 dark:text-white">menghapus seluruh</span> data hasil kerja dari database secara permanen. Data yang telah dihapus tidak dapat dikembalikan.
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
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hasil Kerja Harian</h2>
          <p className="text-sm text-slate-500">{user?.role === 'ADMIN' ? 'Rekapitulasi output produksi' : 'Riwayat pekerjaan Anda'}</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => setShowExportModal(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-200 shadow-lg shadow-slate-800/20 transition-all font-medium text-sm">
                <Printer size={18} /> Ekspor
            </button>
            {user?.role === 'ADMIN' && (
                <>
                  <button onClick={() => setShowCleanupModal(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm">
                      <Trash2 size={18} /> Cleanup
                  </button>
                  <button onClick={() => handleOpen()} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all font-medium text-sm">
                      <Plus size={18} /> Input
                  </button>
                </>
            )}
        </div>
      </div>

      {/* Filter Section (Collapsible on Mobile) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/20"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Filter size={18} className="text-slate-500" />
            <h3>Filter & Cari Data</h3>
          </div>
          {showFilters ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
        </div>
        
        {showFilters && (
          <div className="p-5 border-t border-slate-100 dark:border-dark-border animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Dari Tanggal</label>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div className="relative">
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Sampai Tanggal</label>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              
              {/* Only show employee filter if Admin */}
              {user?.role === 'ADMIN' && (
                <div className="relative">
                    <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Karyawan</label>
                    <select value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none">
                    <option value="">Semua Karyawan</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
              )}

              <div className="relative">
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Komponen</label>
                <select value={filterComponentId} onChange={(e) => setFilterComponentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none">
                  <option value="">Semua Komponen</option>
                  {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium h-[38px]">
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
             <Loader2 className="animate-spin text-green-500" size={40} />
        </div>
      ) : (
      <>
      {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Karyawan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Komponen</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Upah</th>
                {user?.role === 'ADMIN' && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {currentItems.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{new Date(log.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-800 dark:text-slate-200">{getEmpName(log.employeeId)}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">{getCompName(log.componentId)}</td>
                  <td className="px-6 py-4 text-xs text-right font-mono">{log.qty}</td>
                  <td className="px-6 py-4 text-xs text-right font-bold text-green-600 dark:text-green-400">Rp {log.total.toLocaleString('id-ID')}</td>
                  {user?.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => handleOpen(log)} className="text-blue-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => setDeleteId(log.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE COMPACT CARD VIEW (Visible only on Mobile) */}
      <div className="md:hidden space-y-4">
        {currentItems.map(log => (
          <div key={log.id} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
            {/* Top Row: Name & Total */}
            <div className="flex justify-between items-start gap-3 mb-3">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base truncate flex-1">
                {getEmpName(log.employeeId)}
              </span>
              <span className="font-bold text-green-600 dark:text-green-400 text-base shrink-0">
                Rp {log.total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Middle Row: Component & Qty */}
            <div className="flex justify-between items-center text-sm mb-4 text-slate-500 dark:text-slate-400">
               <span className="truncate pr-2">{getCompName(log.componentId)}</span>
               <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 text-xs font-bold">
                 x{log.qty}
               </span>
            </div>

            {/* Bottom Row: Date & Actions */}
            <div className={`flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 ${user?.role !== 'ADMIN' ? 'justify-end' : ''}`}>
              <div className="flex items-center text-xs text-slate-400 font-medium mr-auto">
                 <Calendar size={12} className="mr-1.5"/>
                 {new Date(log.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2">
                    <button 
                    onClick={() => handleOpen(log)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                    Edit
                    </button>
                    <button 
                    onClick={() => setDeleteId(log.id)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                    Hapus
                    </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="p-16 text-center flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 animate-fade-in">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
             <ClipboardList size={32} className="text-slate-400 dark:text-slate-500" />
           </div>
           <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Tidak ada data produksi</p>
           <p className="text-sm text-slate-500">Coba sesuaikan filter pencarian atau input hasil kerja baru.</p>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && filteredLogs.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
               <span className="font-medium">Tampilkan:</span>
               <div className="relative">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-slate-800 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                     <option value={10}>10 Baris</option>
                     <option value={20}>20 Baris</option>
                     <option value={50}>50 Baris</option>
                     <option value={100}>100 Baris</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
               </div>
            </div>

            {/* Navigation & Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
               <span className="text-sm text-slate-500 dark:text-slate-400">
                  {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} data
               </span>
               <div className="flex gap-2">
                 <button
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <ChevronLeft size={16} /> <span className="hidden sm:inline">Sebelumnya</span>
                 </button>
                 <button
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
                   className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <span className="hidden sm:inline">Selanjutnya</span> <ChevronRight size={16} />
                 </button>
               </div>
            </div>
        </div>
      )}

      {/* EXPORT PERIOD MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <Printer className="text-slate-500" size={20} />
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ekspor Laporan PDF</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18}/></button>
            </div>
            
            <div className="mb-4">
               {/* TYPE SELECTION */}
               <div className="grid grid-cols-2 gap-3 mb-4">
                 <button
                   onClick={() => setExportType('COMPONENT')}
                   className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                     exportType === 'COMPONENT' 
                       ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' 
                       : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   <Package size={24} className="mb-2"/>
                   <span className="text-xs font-bold">Per Komponen</span>
                 </button>
                 <button
                   onClick={() => setExportType('EMPLOYEE')}
                   className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                     exportType === 'EMPLOYEE' 
                       ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700' 
                       : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   <User size={24} className="mb-2"/>
                   <span className="text-xs font-bold">Per Karyawan</span>
                 </button>
               </div>

               {/* DATE SELECTION */}
               <div className="space-y-3">
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase">Dari Tanggal</label>
                   <input 
                     type="date" 
                     value={exportPeriod.start} 
                     onChange={e => setExportPeriod({...exportPeriod, start: e.target.value})}
                     className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase">Sampai Tanggal</label>
                   <input 
                     type="date" 
                     value={exportPeriod.end} 
                     onChange={e => setExportPeriod({...exportPeriod, end: e.target.value})}
                     className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" 
                   />
                 </div>
                 
                 {/* CONDITIONAL EMPLOYEE SELECT - HIDE IF USER */}
                 {exportType === 'EMPLOYEE' && user?.role === 'ADMIN' && (
                   <div className="animate-fade-in">
                     <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase">Pilih Karyawan</label>
                     <select 
                        value={selectedExportEmpId} 
                        onChange={e => setSelectedExportEmpId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                     >
                       <option value="">-- Pilih Nama Karyawan --</option>
                       {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                     </select>
                   </div>
                 )}
               </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowExportModal(false)} 
                className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
              >
                Batal
              </button>
              <button 
                onClick={handleProcessExport}
                className="flex-1 py-2.5 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-bold transition-all shadow-lg shadow-slate-800/20"
              >
                Cetak PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM MODAL - ONLY RENDER IF ADMIN */}
      {user?.role === 'ADMIN' && isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-dark-card z-10 pb-2 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Hasil Kerja' : 'Input Hasil Baru'}</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tanggal Pengerjaan</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nama Karyawan</label>
                <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              {/* DAILY CONTEXT SUMMARY */}
              {dailyContext && dailyContext.countItems > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Info Harian</span>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                       Karyawan ini sudah memiliki <b>{dailyContext.countItems} input</b> pada tanggal ini dengan total upah <b>Rp {dailyContext.totalDaily.toLocaleString('id-ID')}</b>.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Komponen / Item</label>
                <select required value={formData.componentId} onChange={e => setFormData({...formData, componentId: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- Pilih Komponen --</option>
                  {components.map(c => <option key={c.id} value={c.id}>{c.name} - Rp {c.price}</option>)}
                </select>
              </div>
              <div className="flex gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Quantity (Pcs)</label>
                  <input type="number" required min="1" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-lg" />
                </div>
                <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 uppercase tracking-wide block mb-1">Estimasi Upah</span>
                  <span className="font-bold text-green-600 text-xl block">Rp {currentTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium">Batal</button>
                <button type="submit" className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20">
                  <CheckCircle size={18} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Production;