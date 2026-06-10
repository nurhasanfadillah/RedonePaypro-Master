import React, { useState, useEffect } from 'react';
import { Payment, Employee, ProductionLog } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Wallet, CheckCircle, X, Banknote, Filter, Printer, Loader2, Info, Calculator, Calendar, ChevronDown, ChevronUp, RotateCcw, ChevronLeft, ChevronRight, Search, AlertCircle } from 'lucide-react';

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]); // Added state for balance calc
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState({ start: '', end: '' });
  
  // Filter States
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'KASBON' | 'SALARY'>('ALL');

  // Cleanup States
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupInputValue, setCleanupInputValue] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Form State
  const [formData, setFormData] = useState<Payment>({ 
    id: '', 
    date: '', 
    employeeId: '', 
    amount: 0, 
    type: 'KASBON',
    note: ''
  });
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [overpayWarning, setOverpayWarning] = useState<Payment | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => { 
    loadData(); 
    // Init export dates to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-CA');
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString('en-CA');
    setExportPeriod({ start: firstDay, end: lastDay });
  }, [user]);

  // Reset page when filter or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStartDate, filterEndDate, filterType, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
        let allPayments = await DataService.getPayments();
        let allProd = await DataService.getProductionLogs();
        const empData = await DataService.getEmployees();

        // RBAC
        if (user?.role === 'USER' && user.employeeId) {
            allPayments = allPayments.filter(p => p.employeeId === user.employeeId);
            allProd = allProd.filter(p => p.employeeId === user.employeeId);
        }

        setList(allPayments);
        setEmployees(empData);
        setProductionLogs(allProd);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleOpen = (item?: Payment) => {
    if (item) {
      setFormData({ ...item });
      setIsEditing(true);
    } else {
      const localDate = new Date().toLocaleDateString('en-CA');
      setFormData({ 
        id: Date.now().toString(), 
        date: localDate, 
        employeeId: '', 
        amount: 0, 
        type: 'KASBON', 
        note: ''
      });
      setIsEditing(false);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
        toast.error("Tanggal transaksi harus diisi.");
        return;
    }
    if (new Date(formData.date) > new Date()) {
        toast.error("Tanggal transaksi tidak boleh melebihi hari ini.");
        return;
    }
    if (!formData.employeeId) {
        toast.error("Karyawan harus dipilih.");
        return;
    }
    if (formData.amount <= 0) {
        toast.error("Nominal pembayaran harus lebih dari 0.");
        return;
    }

    if (formData.type === 'SALARY' && formData.amount > currentBalance) {
        setOverpayWarning(formData);
        return;
    }
    
    await executeSavePayment(formData);
  };

  const executeSavePayment = async (dataToSave: Payment) => {
    try {
        await DataService.savePayment(dataToSave);
        toast.success(isEditing ? "Pembayaran diperbarui" : "Pembayaran dicatat");
        setIsOpen(false);
        setOverpayWarning(null);
        loadData();
    } catch (e) {
        toast.error("Gagal menyimpan data pembayaran");
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await DataService.deletePayment(deleteId);
        toast.success("Data transaksi berhasil dihapus.");
        loadData();
      } catch (error) {
        console.error("Gagal menghapus data", error);
        toast.error("Gagal menghapus data transaksi. Periksa koneksi internet Anda.");
      } finally {
        setDeleteId(null);
      }
    }
  };

  const executeCleanup = async () => {
    if (cleanupInputValue.toLowerCase() === 'cleanup') {
      try {
        await DataService.deleteAllPayments();
        setShowCleanupModal(false);
        setCleanupInputValue('');
        loadData();
        toast.success("Semua data Pembayaran & Kasbon berhasil dihapus.");
      } catch (err) {
        toast.error("Gagal menghapus data Pembayaran & Kasbon.");
      }
    } else {
      toast.error("Teks konfirmasi tidak sesuai. Ketik 'cleanup' untuk melanjutkan.");
    }
  };

  const resetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('ALL');
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const filteredList = list.filter(item => {
    const matchType = filterType === 'ALL' || item.type === filterType;
    const matchStart = filterStartDate ? item.date >= filterStartDate : true;
    const matchEnd = filterEndDate ? item.date <= filterEndDate : true;
    return matchType && matchStart && matchEnd;
  });

  // PAGINATION LOGIC
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // --- Calculate Balance Helper ---
  const getEmployeeBalance = (empId: string) => {
    if (!empId) return 0;
    
    // Calculate Total Production (IN)
    const totalProd = productionLogs
      .filter(p => p.employeeId === empId)
      .reduce((acc, curr) => acc + curr.total, 0);
      
    // Calculate Total Payments (OUT) - Exclude current editing item to show pre-transaction balance
    const totalPay = list
      .filter(p => p.employeeId === empId && p.id !== formData.id) 
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    return totalProd - totalPay;
  };

  const currentBalance = getEmployeeBalance(formData.employeeId);

  // --- PDF EXPORT LOGIC ---
  const handleProcessExport = async () => {
    const w = window as any;
    if (!w.jspdf) {
      toast.loading('Library PDF sedang dimuat.', { duration: 2000 });
      return;
    }

    setIsPrinting(true);
    setShowExportModal(false);

    try {
      const { jsPDF } = w.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Filter Data based on Export Period & Current Filter Type
      // Need fresh data? Using state 'list' is fine but filtered by exportPeriod
      let exportData = list.filter(item => 
        item.date >= exportPeriod.start && item.date <= exportPeriod.end
      );

      // RBAC for Export (already handled by loadData into list)

      if (filterType !== 'ALL') {
        exportData = exportData.filter(item => item.type === filterType);
      }
      
      // Sort Descending by Date
      exportData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 1. HEADER (Sesuai Gambar Dokumen)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("DATA PEMBAYARAN & KASBON", 14, 20);
      
      doc.setFontSize(9);
      
      const startStr = new Date(exportPeriod.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const endStr = new Date(exportPeriod.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const typeLabel = filterType === 'ALL' ? 'Semua Transaksi' : filterType === 'KASBON' ? 'Kasbon' : 'Pembayaran Gaji';
      
      doc.text(`Periode: ${startStr} s/d ${endStr}`, 14, 25);
      doc.text(`Kategori: ${typeLabel}`, 14, 29);
      if (user?.role === 'USER') {
        doc.text(`Karyawan: ${getEmpName(user.employeeId || '')}`, 14, 33);
      }

      // Garis horizontal seperti di dokumen
      const lineY = user?.role === 'USER' ? 36 : 32;
      doc.setLineWidth(0.5);
      doc.line(14, lineY, 196, lineY);

      // 2. DATA TABEL
      const tableColumn = ["Tanggal", "Karyawan", "Tipe", "Catatan", "Nominal"];
      
      const tableRows: any[] = exportData.map(item => [
        new Date(item.date).toLocaleDateString('id-ID'),
        getEmpName(item.employeeId),
        item.type === 'KASBON' ? 'Kasbon' : 'Gaji',
        item.note || '-',
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.amount)
      ]);

      // Baris TOTAL (Format sesuai gambar: TOTAL rata kanan, angka di kolom Nominal)
      const totalAmount = exportData.reduce((acc, curr) => acc + curr.amount, 0);
      tableRows.push([
        { content: "TOTAL", colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount), styles: { fontStyle: 'bold' } }
      ]);

      // 3. GENERATE TABLE
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: lineY + 5,
        theme: 'grid', // Grid theme sesuai gambar
        headStyles: { 
          fillColor: [30, 64, 175], // Blue-800/Royal Blue (Menyerupai gambar)
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: 20,
          lineColor: [200, 200, 200], // Garis grid abu-abu halus
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Tanggal
          1: { cellWidth: 50 }, // Karyawan
          2: { cellWidth: 25 }, // Tipe
          3: { cellWidth: 'auto' }, // Catatan
          4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' } // Nominal
        }
      });

      // 4. SIGNATURES (Tanda Tangan sesuai gambar)
      // Jarak dinamis dari tabel terakhir
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      // Cek halaman baru jika tidak muat
      if (finalY > 250) doc.addPage();
      const sigY = finalY > 250 ? 40 : finalY;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);

      // Kiri: Admin Keuangan
      doc.text("Dibuat Oleh,", 40, sigY, { align: 'center' });
      doc.text("Admin Keuangan", 40, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 40, sigY + 30, { align: 'center' });

      // Kanan: Manager Keuangan
      doc.text("Disetujui Oleh,", 150, sigY, { align: 'center' });
      doc.text("Manager Keuangan", 150, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 150, sigY + 30, { align: 'center' });

      doc.save(`Data_Pembayaran_${exportPeriod.start}.pdf`);
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
          <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Data Pembayaran"
        message="Yakin ingin menghapus data transaksi ini?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        confirmText="Hapus"
      />

      <ConfirmModal 
        isOpen={!!overpayWarning}
        title="Konfirmasi Pembayaran Lebih"
        message={`Nominal pembayaran (Rp ${overpayWarning?.amount.toLocaleString('id-ID')}) melebihi sisa gaji tersimpan. Kelebihan akan tercatat sebagai Kasbon/Minus. Tetap lanjutkan?`}
        onConfirm={() => overpayWarning && executeSavePayment(overpayWarning)}
        onCancel={() => setOverpayWarning(null)}
        type="danger"
        confirmText="Ya, Lanjutkan"
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Hapus Semua Data Transaksi</h3>
              </div>
              <button onClick={() => {setShowCleanupModal(false); setCleanupInputValue('');}} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 space-y-3">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Tindakan ini akan <span className="font-bold border-b border-red-500 text-slate-800 dark:text-white">menghapus seluruh</span> data Pembayaran & Kasbon dari database secara permanen. Data yang telah dihapus tidak dapat dikembalikan.
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pembayaran & Kasbon</h2>
          <p className="text-sm text-slate-500">{user?.role === 'ADMIN' ? 'Kelola pengeluaran untuk karyawan' : 'Riwayat penerimaan uang Anda'}</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <button 
            onClick={() => setShowExportModal(true)} 
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-200 shadow-lg shadow-slate-800/20 transition-all font-medium text-sm"
          >
            <Printer size={18} /> Ekspor PDF
          </button>
          {user?.role === 'ADMIN' && (
            <>
              <button onClick={() => setShowCleanupModal(true)} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm">
                  <Trash2 size={18} /> Cleanup Data
              </button>
              <button 
                  onClick={() => handleOpen()} 
                  className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all font-medium text-sm"
              >
                  <Plus size={18} /> Input Transaksi
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/20"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Filter size={18} className="text-slate-500" />
            <h3>Filter Data</h3>
          </div>
          {showFilters ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
        </div>
        
        {showFilters && (
          <div className="p-5 border-t border-slate-100 dark:border-dark-border animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Dari Tanggal</label>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="relative">
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Sampai Tanggal</label>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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

      {/* Filter Tabs (View Type) */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {[
          { id: 'ALL', label: 'Semua' },
          { id: 'KASBON', label: 'Kasbon' },
          { id: 'SALARY', label: 'Pembayaran Gaji' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === tab.id 
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
                : 'bg-white text-slate-600 dark:bg-dark-card dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
             <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
      <>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis Transaksi</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Nominal</th>
              {user?.role === 'ADMIN' && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {currentItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{getEmpName(item.employeeId)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                    item.type === 'KASBON' 
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                     {item.type === 'KASBON' ? 'Kasbon' : 'Bayar Gaji'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 italic truncate max-w-[150px]">{item.note || '-'}</td>
                <td className="px-6 py-4 text-sm text-right font-bold text-slate-700 dark:text-slate-200">Rp {item.amount.toLocaleString('id-ID')}</td>
                {user?.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpen(item)} className="text-blue-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => setDeleteId(item.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
         {currentItems.map(item => (
           <div key={item.id} className="bg-white dark:bg-dark-card p-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${item.type === 'KASBON' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    {item.type === 'KASBON' ? <Wallet size={18}/> : <Banknote size={18}/>}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block text-sm">{getEmpName(item.employeeId)}</span>
                    <span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</span>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`block font-bold text-base ${item.type === 'KASBON' ? 'text-orange-600' : 'text-green-600'}`}>
                     Rp {item.amount.toLocaleString('id-ID')}
                   </span>
                </div>
             </div>
             <div className={`flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800 ${user?.role !== 'ADMIN' ? 'justify-end' : ''}`}>
                <div className="text-xs text-slate-500 italic max-w-[60%] truncate mr-auto">
                  {item.note ? item.note : item.type === 'KASBON' ? 'Pinjaman Karyawan' : 'Pembayaran Gaji'}
                </div>
                {user?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                        <button onClick={() => handleOpen(item)} className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg active:scale-95 transition-transform"><Edit2 size={16}/></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg active:scale-95 transition-transform"><Trash2 size={16}/></button>
                    </div>
                )}
             </div>
           </div>
         ))}
      </div>
      </>
      )}

      {!loading && filteredList.length === 0 && (
        <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Filter size={32} className="mx-auto mb-2 opacity-30"/>
          <p>Belum ada data transaksi.</p>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && filteredList.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
               <span>Tampilkan:</span>
               <div className="relative">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200"
                  >
                     <option value={10}>10 Baris</option>
                     <option value={20}>20 Baris</option>
                     <option value={50}>50 Baris</option>
                     <option value={100}>100 Baris</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
               </div>
            </div>

            {/* Navigation & Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
               <span className="text-sm text-slate-500 dark:text-slate-400">
                  {startIndex + 1} - {endIndex} dari {totalItems} data
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
            
            <div className="mb-6">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm mb-4 flex items-start gap-2">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>Filter periode akan diterapkan pada kategori <b>{filterType === 'ALL' ? 'Semua Transaksi' : filterType === 'KASBON' ? 'Kasbon' : 'Pembayaran Gaji'}</b>.</p>
               </div>

               <div className="space-y-3">
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase">Dari Tanggal</label>
                   <input 
                     type="date" 
                     value={exportPeriod.start} 
                     onChange={e => setExportPeriod({...exportPeriod, start: e.target.value})}
                     className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase">Sampai Tanggal</label>
                   <input 
                     type="date" 
                     value={exportPeriod.end} 
                     onChange={e => setExportPeriod({...exportPeriod, end: e.target.value})}
                     className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                   />
                 </div>
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

      {/* MODAL INPUT - ONLY IF ADMIN */}
      {user?.role === 'ADMIN' && isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Transaksi' : 'Transaksi Baru'}</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pb-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.type === 'KASBON' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <input type="radio" name="type" value="KASBON" checked={formData.type === 'KASBON'} onChange={() => setFormData({...formData, type: 'KASBON'})} className="hidden" />
                  <Wallet size={24} />
                  <span className="font-bold text-sm">Kasbon</span>
                </label>
                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.type === 'SALARY' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <input type="radio" name="type" value="SALARY" checked={formData.type === 'SALARY'} onChange={() => setFormData({...formData, type: 'SALARY'})} className="hidden" />
                  <Banknote size={24} />
                  <span className="font-bold text-sm">Bayar Gaji</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tanggal</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Karyawan</label>
                <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              {/* CONTEXTUAL BALANCE INFO */}
              {formData.employeeId && (
                <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${currentBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900 text-red-800 dark:text-red-300'}`}>
                  <div className="p-1 bg-white dark:bg-dark-card rounded-full shadow-sm shrink-0">
                    <Info size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-70">Sisa Gaji Tersimpan</span>
                    <span className="block text-lg font-bold">Rp {currentBalance.toLocaleString('id-ID')}</span>
                    {formData.type === 'SALARY' && (
                       <div className="mt-1 flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, amount: currentBalance > 0 ? currentBalance : 0})}
                            className="text-xs bg-white dark:bg-dark-card border border-blue-200 dark:border-blue-800 px-2 py-1 rounded shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/50 flex items-center gap-1"
                          >
                             <Calculator size={10} /> Bayar Semua
                          </button>
                       </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nominal (Rp)</label>
                <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Catatan (Opsional)</label>
                <input type="text" value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Contoh: Cicilan ke-1" className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium">Batal</button>
                <button type="submit" className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20">
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
export default Payments;