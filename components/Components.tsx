import React, { useState, useEffect } from 'react';
import { Component } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Search, Package, CheckCircle, X, Printer, Loader2, ChevronLeft, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';

const Components: React.FC = () => {
  const { user } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Component>({ id: '', name: '', price: 0 });
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Cleanup States
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ success: number, failed: number } | null>(null);
  const [cleanupInputValue, setCleanupInputValue] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      setLoading(true);
      try {
        const data = await DataService.getComponents();
        setComponents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
  };

  // Reset page when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleOpen = (comp?: Component) => {
    if (comp) {
      setFormData({ ...comp });
      setIsEditing(true);
    } else {
      const maxId = components.reduce((max, c) => {
        const numPart = parseInt(c.id.replace('KP-', ''), 10);
        return !isNaN(numPart) && numPart > max ? numPart : max;
      }, 0);
      setFormData({ id: `KP-${(maxId + 1).toString().padStart(3, '0')}`, name: '', price: 0 });
      setIsEditing(false);
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        toast.error("Nama komponen tidak boleh kosong.");
        return;
    }
    if (formData.price <= 0) {
        toast.error("Harga komponen harus lebih dari 0.");
        return;
    }
    
    try {
        await DataService.saveComponent(formData);
        toast.success(isEditing ? "Komponen diperbarui" : "Komponen ditambahkan");
        setIsOpen(false);
        loadData();
    } catch (e) {
        toast.error("Gagal menyimpan komponen.");
    }
  };

  const handleRequestDelete = async (comp: Component) => {
    const dependencyCheck = await DataService.checkComponentDependencies(comp.id);
    
    if (dependencyCheck.hasDependencies) {
      const msg = `Tidak dapat menghapus komponen ${comp.name}. Data ini masih digunakan pada ${dependencyCheck.details.production} riwayat Hasil Kerja. Harap hapus transaksi terkait terlebih dahulu.`;
      setAlertMessage(msg);
    } else {
      setDeleteId(comp.id);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await DataService.deleteComponent(deleteId);
        toast.success("Komponen berhasil dihapus.");
        loadData();
      } catch (error) {
        console.error("Gagal menghapus komponen", error);
        toast.error("Gagal menghapus komponen. Periksa koneksi internet Anda.");
      } finally {
        setDeleteId(null);
      }
    }
  };

  const executeCleanup = async () => {
    if (cleanupInputValue.toLowerCase() === 'cleanup') {
      try {
        const result = await DataService.cleanupComponents();
        setCleanupResult(result);
        setShowCleanupModal(false);
        setCleanupInputValue('');
        loadData();
      } catch (err) {
        toast.error("Gagal melakukan cleanup data komponen.");
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
      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("DAFTAR HARGA KOMPONEN & UPAH KERJA", 14, 21);
      
      doc.setFontSize(10);
      const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Tanggal Cetak: ${today}`, 14, 27);
      doc.text(`Total Item: ${components.length}`, 14, 32);

      doc.line(14, 35, 196, 35);

      // 2. Prepare Data (Use 'filtered' to export all matches, not just current page)
      const tableColumn = ["ID Komponen", "Nama Komponen", "Harga Satuan (Rp)"];
      const tableRows = filtered.map(comp => [
        comp.id,
        comp.name,
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(comp.price)
      ]);

      // 3. Generate Table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { 
          fillColor: [147, 51, 234], // Purple-600 to match module theme
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
          0: { cellWidth: 35, font: 'courier' }, 
          1: { cellWidth: 'auto' }, 
          2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' } 
        }
      });

      // 4. Signatures
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      if (finalY > 250) doc.addPage();
      const sigY = finalY > 250 ? 40 : finalY;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);

      // Left Sig
      doc.text("Dibuat Oleh,", 40, sigY, { align: 'center' });
      doc.text("Admin Produksi", 40, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 40, sigY + 30, { align: 'center' });

      // Right Sig
      doc.text("Disetujui Oleh,", 150, sigY, { align: 'center' });
      doc.text("Manager Operasional", 150, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 150, sigY + 30, { align: 'center' });

      doc.save(`Daftar_Komponen_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF berhasil dibuat!");

    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  // --- PAGINATION LOGIC ---
  const filtered = components.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4 md:space-y-6 relative animate-fade-in">
      {isPrinting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin mb-4 text-purple-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Komponen"
        message="Yakin ingin menghapus komponen ini?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
        confirmText="Hapus"
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Cleanup Data Komponen</h3>
              </div>
              <button onClick={() => {setShowCleanupModal(false); setCleanupInputValue('');}} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 space-y-3">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Tindakan ini akan menghapus data komponen yang <span className="font-bold text-slate-800 dark:text-white">tidak memiliki relasi</span> (belum ada transaksi hasil kerja). Data komponen dengan relasi akan diabaikan.
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

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari komponen..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-3 md:py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm" 
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.role === 'ADMIN' && (
            <button 
                onClick={() => setShowCleanupModal(true)} 
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3 md:py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm"
            >
                <Trash2 size={18} /> Cleanup
            </button>
          )}
          <button 
            onClick={handlePrint} 
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3 md:py-2 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-200 shadow-lg shadow-slate-800/20 transition-all font-medium text-sm"
          >
            <Printer size={18} /> Ekspor
          </button>
          {user?.role === 'ADMIN' && (
            <button 
                onClick={() => handleOpen()} 
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3 md:py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all font-medium text-sm"
            >
                <Plus size={18} /> Tambah
            </button>
          )}
        </div>
      </div>

      {loading ? (
          <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-purple-500" size={40} />
          </div>
      ) : (
      <>
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Nama Komponen</th>
              <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Harga Satuan</th>
              {user?.role === 'ADMIN' && <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {currentItems.map(comp => (
              <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {comp.id}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-sm text-slate-800 dark:text-slate-200">{comp.name}</td>
                <td className="px-6 py-4 text-right font-bold text-sm text-slate-700 dark:text-slate-300">
                  Rp {comp.price.toLocaleString('id-ID')}
                </td>
                {user?.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpen(comp)} className="text-blue-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleRequestDelete(comp)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE COMPACT LIST VIEW */}
      <div className="md:hidden space-y-2">
        {currentItems.map(comp => (
          <div key={comp.id} className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
            <div className="flex justify-between items-start gap-3">
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{comp.name}</h3>
                 <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5 inline-block">{comp.id}</span>
               </div>
               <div className="text-right whitespace-nowrap">
                 <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                   Rp {comp.price.toLocaleString('id-ID')}
                 </span>
               </div>
            </div>
            
            {user?.role === 'ADMIN' && (
                <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-800 pt-1.5 mt-1.5">
                <button 
                    onClick={() => handleOpen(comp)} 
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                    Edit
                </button>
                <button 
                    onClick={() => handleRequestDelete(comp)} 
                    className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                    Hapus
                </button>
                </div>
            )}
          </div>
        ))}
      </div>
      </>
      )}
      
      {!loading && filtered.length === 0 && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
          <Package size={48} className="mb-4 opacity-20" />
          <p>Data komponen tidak ditemukan.</p>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
               <span>Tampilkan:</span>
               <div className="relative">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 dark:text-slate-200"
                  >
                     <option value={10}>10 Baris</option>
                     <option value={25}>25 Baris</option>
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

      {/* INPUT MODAL - ADMIN ONLY */}
      {user?.role === 'ADMIN' && isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Harga Komponen' : 'Komponen Baru'}</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pb-6">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">ID Komponen</label>
                <input type="text" value={formData.id} readOnly className="w-full px-4 py-3 md:py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nama Komponen</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Contoh: Bodi Depan X" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Harga Satuan (Rp)</label>
                <input type="number" required min="1" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg" />
              </div>
              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 font-medium">Batal</button>
                <button type="submit" className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-600/20">
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
export default Components;