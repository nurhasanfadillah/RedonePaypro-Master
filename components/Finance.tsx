import React, { useState, useEffect } from 'react';
import { LedgerItem, Employee } from '../types';
import { DataService } from '../services/dataService';
import toast from 'react-hot-toast';
import { ArrowUpRight, ArrowDownLeft, Filter, ChevronDown, ChevronUp, RotateCcw, Search, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const Finance: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    calculateLedger();
  }, []);

  // Reset page when filter or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, filterEmpId, itemsPerPage]);

  const calculateLedger = async () => {
    setLoading(true);
    try {
        const empData = await DataService.getEmployees();
        setEmployees(empData);
        
        const production = await DataService.getProductionLogs();
        const payments = await DataService.getPayments();
        const components = await DataService.getComponents();

        let items: LedgerItem[] = [];

        production.forEach(p => {
        const emp = empData.find(e => e.id === p.employeeId);
        const comp = components.find(c => c.id === p.componentId);
        items.push({
            id: p.id,
            date: p.date,
            employeeId: p.employeeId,
            employeeName: emp?.name || 'Unknown',
            description: `Hasil Kerja (${p.qty}x ${comp?.name || 'Item'})`,
            type: 'IN',
            amount: p.total,
            balance: 0 
        });
        });

        payments.forEach(p => {
        const emp = empData.find(e => e.id === p.employeeId);
        items.push({
            id: p.id,
            date: p.date,
            employeeId: p.employeeId,
            employeeName: emp?.name || 'Unknown',
            description: p.type === 'KASBON' ? 'KASBON (Pinjaman)' : 'PEMBAYARAN GAJI',
            type: 'OUT',
            amount: p.amount,
            balance: 0
        });
        });

        items.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.type === 'IN' ? -1 : 1; 
        });

        let runningBalance = 0;
        items = items.map(item => {
        if (item.type === 'IN') {
            runningBalance += item.amount;
        } else {
            runningBalance -= item.amount;
        }
        return { ...item, balance: runningBalance };
        });

        setLedger(items.reverse());
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterEmpId('');
  };

  const filteredLedger = ledger.filter(item => {
    const matchStart = startDate ? item.date >= startDate : true;
    const matchEnd = endDate ? item.date <= endDate : true;
    const matchEmp = filterEmpId ? item.employeeId === filterEmpId : true;
    return matchStart && matchEnd && matchEmp;
  });

  // PAGINATION LOGIC
  const totalItems = filteredLedger.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredLedger.slice(startIndex, startIndex + itemsPerPage);

  // --- PROFESSIONAL PDF EXPORT LOGIC ---
  const handlePrint = () => {
     const w = window as any;
     if (!w.jspdf) {
       toast.loading('Library PDF sedang dimuat.', { duration: 2000 });
       return;
     }

     setIsPrinting(true);

     try {
       const { jsPDF } = w.jspdf;
       const doc = new jsPDF('landscape', 'mm', 'a4');

       // 1. Header
       doc.setFontSize(16);
       doc.setFont("helvetica", "bold");
       doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
       
       doc.setFontSize(12);
       doc.setFont("helvetica", "normal");
       doc.text("LAPORAN KEUANGAN & MUTASI GAJI", 14, 21);
       
       const startStr = startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'Awal';
       const endStr = endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'Sekarang';
       doc.setFontSize(10);
       doc.text(`Periode: ${startStr} s/d ${endStr}`, 14, 27);

       doc.line(14, 30, 283, 30);

       // 2. Prepare Data
       const tableColumn = ["Tanggal", "Karyawan", "Keterangan", "Masuk", "Keluar", "Saldo"];
       const tableRows: any[] = [];

       filteredLedger.forEach(item => {
         const rowData = [
           new Date(item.date).toLocaleDateString('id-ID'),
           item.employeeName,
           item.description,
           item.type === 'IN' ? formatCurrency(item.amount) : '-',
           item.type === 'OUT' ? formatCurrency(item.amount) : '-',
           formatCurrency(item.balance)
         ];
         tableRows.push(rowData);
       });

       // 3. Generate Table
       doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 41, 59], // Slate-800
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
          textColor: 20
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 'auto' },
          3: { halign: 'right', font: 'courier', textColor: [22, 163, 74] }, // Green
          4: { halign: 'right', font: 'courier', textColor: [234, 88, 12] }, // Orange
          5: { halign: 'right', font: 'courier', fontStyle: 'bold' }
        }
       });

       // 4. Signatures
       const finalY = (doc as any).lastAutoTable.finalY + 20;
       
       if (finalY > 170) {
        doc.addPage();
       }
       const sigY = finalY > 170 ? 40 : finalY;

       doc.setFont("helvetica", "normal");
       doc.setFontSize(10);
       doc.setTextColor(0,0,0);

       // Left Sig
       doc.text("Disiapkan Oleh,", 40, sigY, { align: 'center' });
       doc.text("Admin Keuangan", 40, sigY + 5, { align: 'center' });
       doc.text("(________________________)", 40, sigY + 30, { align: 'center' });

       // Right Sig
       doc.text("Disetujui Oleh,", 240, sigY, { align: 'center' });
       doc.text("Manager Operasional", 240, sigY + 5, { align: 'center' });
       doc.text("(________________________)", 240, sigY + 30, { align: 'center' });

       doc.save(`Laporan_Keuangan_${startStr}_${endStr}.pdf`);
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
          <Loader2 size={48} className="animate-spin mb-4 text-primary-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Data Keuangan</h2>
          <p className="text-sm text-slate-500">Mutasi Saldo Hutang Gaji</p>
        </div>
        <button onClick={handlePrint} className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl transition-all shadow-sm font-medium">
          <Printer size={18} /> Ekspor Data (PDF)
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden no-print">
        <div className="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/20" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Filter size={18} className="text-slate-500" />
            <h3>Filter Transaksi</h3>
          </div>
          {showFilters ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
        </div>
        
        {showFilters && (
          <div className="p-5 border-t border-slate-100 dark:border-dark-border animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Dari Tanggal</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Sampai Tanggal</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">Karyawan</label>
                <select value={filterEmpId} onChange={(e) => setFilterEmpId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none">
                  <option value="">Semua Karyawan</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={resetFilters} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium h-[38px]">
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="p-12 flex justify-center">
             <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
      <>
      {/* Main Table Display (Screen Only) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
      
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Karyawan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right text-green-600">Masuk</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right text-orange-600">Keluar</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {currentItems.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {new Date(item.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.employeeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                    {item.type === 'IN' ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-orange-600 dark:text-orange-400">
                    {item.type === 'OUT' ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden no-print space-y-3">
          {currentItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white dark:bg-dark-card p-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${item.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {item.type === 'IN' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.employeeName}</h4>
                    <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month:'long'})}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block font-bold text-sm ${item.type === 'IN' ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.type === 'IN' ? '+' : '-'} {formatCurrency(item.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">Saldo: {formatCurrency(item.balance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLedger.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <Search size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
            <p className="font-medium">Data transaksi tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {filteredLedger.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
               <span>Tampilkan:</span>
               <div className="relative">
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800 dark:text-slate-200"
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
      </>
      )}
    </div>
  );
};

export default Finance;