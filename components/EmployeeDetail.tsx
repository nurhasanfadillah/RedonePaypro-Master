import React, { useState, useEffect } from 'react';
import { Employee, ProductionLog, Payment, Component, LedgerItem } from '../types';
import { DataService } from '../services/dataService';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, FileText, ArrowUpRight, ArrowDownLeft, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeeDetailProps {
  employee: Employee;
  onBack: () => void;
}

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [production, setProduction] = useState<ProductionLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Filters for Slip Gaji
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allProduction = await DataService.getProductionLogs();
      const allPayments = await DataService.getPayments();
      const allComponents = await DataService.getComponents();

      const empProd = allProduction.filter(p => p.employeeId === employee.id);
      const empPay = allPayments.filter(p => p.employeeId === employee.id);

      setProduction(empProd);
      setPayments(empPay);
      setComponents(allComponents);

      let items: LedgerItem[] = [];

      empProd.forEach(p => {
        const comp = allComponents.find(c => c.id === p.componentId);
        items.push({
          id: p.id,
          date: p.date,
          employeeId: p.employeeId,
          employeeName: employee.name,
          description: `Hasil Kerja (${p.qty}x ${comp?.name || 'Item'})`,
          type: 'IN',
          amount: p.total,
          balance: 0 
        });
      });

      empPay.forEach(p => {
        items.push({
          id: p.id,
          date: p.date,
          employeeId: p.employeeId,
          employeeName: employee.name,
          description: p.type === 'KASBON' ? 'Kasbon (Pinjaman)' : 'Pembayaran Gaji',
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

      setLedger(items.reverse()); // latest first
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat detail karyawan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filteredLedger = ledger.filter(item => {
    const matchStart = startDate ? item.date >= startDate : true;
    const matchEnd = endDate ? item.date <= endDate : true;
    return matchStart && matchEnd;
  });

  const totalMasuk = filteredLedger.filter(i => i.type === 'IN').reduce((acc, curr) => acc + curr.amount, 0);
  const totalKeluar = filteredLedger.filter(i => i.type === 'OUT').reduce((acc, curr) => acc + curr.amount, 0);
  const currentSaldo = totalMasuk - totalKeluar; // Or base it on running balance if filtered? Usually period total is calculated independently.

  const totalPages = Math.ceil(ledger.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLedgerItems = ledger.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePrintSlip = () => {
    const w = window as any;
    if (!w.jspdf) {
      toast.loading('Library PDF sedang dimuat.', { duration: 2000 });
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Pilih periode tanggal (DARI - SAMPAI) terlebih dahulu untuk cetak slip gaji.');
      return;
    }

    setIsPrinting(true);

    try {
      const { jsPDF } = w.jspdf;
      const doc = new jsPDF('p', 'mm', 'a5'); // A5 size is good for slip gaji

      // Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 10, 15);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("SLIP GAJI KARYAWAN BORONGAN", 10, 21);
      
      doc.line(10, 24, 138, 24); // A5 width is 148mm

      // Employee Info
      doc.setFontSize(9);
      doc.text(`Nama    : ${employee.name}`, 10, 30);
      doc.text(`ID      : ${employee.id}`, 10, 35);
      const startStr = new Date(startDate).toLocaleDateString('id-ID');
      const endStr = new Date(endDate).toLocaleDateString('id-ID');
      doc.text(`Periode : ${startStr} s/d ${endStr}`, 10, 40);

      doc.line(10, 43, 138, 43);

      doc.setFont("helvetica", "bold");
      doc.text("Rincian Hasil Produksi (Pemasukan):", 10, 50);
      doc.setFont("helvetica", "normal");
      
      let yPos = 55;
      const periodProd = production.filter(p => p.date >= startDate && p.date <= endDate);
      
      // Group by component
      const prodSummary: Record<string, { qty: number, total: number, name: string, price: number }> = {};
      periodProd.forEach(p => {
         if (!prodSummary[p.componentId]) {
             const comp = components.find(c => c.id === p.componentId);
             prodSummary[p.componentId] = { qty: 0, total: 0, name: comp?.name || 'Item', price: p.priceSnapshot };
         }
         prodSummary[p.componentId].qty += p.qty;
         prodSummary[p.componentId].total += p.total;
      });

      Object.values(prodSummary).forEach(item => {
         if (yPos > 190) { doc.addPage(); yPos = 20; }
         doc.text(`${item.name} (${item.qty} x ${formatCurrency(item.price)})`, 10, yPos);
         doc.text(formatCurrency(item.total), 138, yPos, { align: 'right' });
         yPos += 5;
      });

      if (Object.keys(prodSummary).length === 0) {
        doc.text("- Tidak ada data produksi -", 10, yPos);
        yPos += 5;
      }

      const prdTotal = periodProd.reduce((acc, curr) => acc + curr.total, 0);
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("Total Hasil Kerja:", 10, yPos + 2);
      doc.text(formatCurrency(prdTotal), 138, yPos + 2, { align: 'right' });
      
      yPos += 10;
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.line(10, yPos, 138, yPos);
      yPos += 7;

      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("Pemotongan / Kasbon / Pembayaran Sebelumnya:", 10, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 5;

      const periodPay = payments.filter(p => p.date >= startDate && p.date <= endDate);
      periodPay.forEach(p => {
         if (yPos > 190) { doc.addPage(); yPos = 20; }
         doc.text(`${p.date} - ${p.type === 'KASBON' ? 'Kasbon' : 'Pembayaran Gaji'}`, 10, yPos);
         doc.text(`(${formatCurrency(p.amount)})`, 138, yPos, { align: 'right' });
         yPos += 5;
      });

      if (periodPay.length === 0) {
        doc.text("- Tidak ada potongan/kasbon -", 10, yPos);
        yPos += 5;
      }

      const payTotal = periodPay.reduce((acc, curr) => acc + curr.amount, 0);
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("Total Potongan:", 10, yPos + 2);
      doc.text(`(${formatCurrency(payTotal)})`, 138, yPos + 2, { align: 'right' });

      yPos += 10;
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.line(10, yPos, 138, yPos);
      yPos += 7;

      const grandTotal = prdTotal - payTotal;
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.setFontSize(11);
      doc.text("TOTAL DITERIMA:", 10, yPos);
      doc.text(formatCurrency(grandTotal), 138, yPos, { align: 'right' });

      yPos += 20;
      if (yPos > 190) { doc.addPage(); yPos = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Penerima,", 20, yPos, { align: 'center' });
      doc.text("Manajer / Admin,", 118, yPos, { align: 'center' });
      
      doc.text(`(${employee.name})`, 20, yPos + 20, { align: 'center' });
      doc.text(`(________________)`, 118, yPos + 20, { align: 'center' });

      doc.save(`Slip_Gaji_${employee.name.replace(/\s+/g, '_')}_${startStr}_${endStr}.pdf`);
      toast.success("Slip Gaji berhasil dibuat!");

    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat Slip Gaji.");
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-8">
      {isPrinting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin mb-4 text-primary-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col gap-4 bg-white dark:bg-dark-card p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
        <div className="flex justify-between items-start">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="font-medium text-sm">Kembali</span>
            </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-2 items-start md:items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{employee.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{employee.id}</span>
                    <span>{employee.address}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Rincian Slip Gaji Filter & Print */}
      <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-4 md:p-6 border border-primary-100 dark:border-primary-900/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                    <FileText size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800 dark:text-slate-100">Cetak Slip Gaji</h3>
                   <p className="text-sm text-slate-500">Pilih periode untuk mencetak slip</p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end">
                <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Dari Tanggal</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sampai Tanggal</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <button 
                    onClick={handlePrintSlip}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-primary-600 dark:hover:bg-primary-700 rounded-lg shadow-md font-medium transition-colors h-[38px]"
                >
                    <Printer size={18} /> Cetak Slip
                </button>
            </div>
        </div>
        
        {startDate && endDate && (
           <div className="mt-4 pt-4 border-t border-primary-200/50 dark:border-primary-900/30 flex gap-4 text-sm bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <div className="flex-1">
                    <p className="text-slate-500">Total Produksi (Periode)</p>
                    <p className="font-bold text-green-600">{formatCurrency(totalMasuk)}</p>
                </div>
                <div className="flex-1">
                    <p className="text-slate-500">Total Potongan (Periode)</p>
                    <p className="font-bold text-red-500">-{formatCurrency(totalKeluar)}</p>
                </div>
                <div className="flex-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <p className="text-slate-500 font-bold">Total Diterima</p>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{formatCurrency(currentSaldo)}</p>
                </div>
           </div>
        )}
      </div>

      {/* History Ledger Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Buku Besar Karyawan (Riwayat Penuh)</h3>
            <div className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                Sisa Tagihan (Saldo): {formatCurrency(ledger.length > 0 ? ledger[0].balance : 0)}
            </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-dark-border">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right text-green-600">Pemasukan</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right text-orange-600">Potongan</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {currentLedgerItems.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(item.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                        {item.type === 'IN' ? <ArrowUpRight size={14} className="text-green-500"/> : <ArrowDownLeft size={14} className="text-orange-500"/>}
                        {item.description}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                    {item.type === 'IN' ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-orange-600 dark:text-orange-400">
                    {item.type === 'OUT' ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(item.balance)}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500">
                        Belum ada riwayat transaksi
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-dark-border">
          {currentLedgerItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {new Date(item.date).toLocaleDateString('id-ID')}
                </div>
                <div className={`text-sm font-bold flex items-center gap-1 ${item.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {item.type === 'IN' ? '+' : '-'}{formatCurrency(item.amount)}
                </div>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {item.type === 'IN' ? <ArrowUpRight size={14} className="text-green-500"/> : <ArrowDownLeft size={14} className="text-orange-500"/>}
                {item.description}
              </div>
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Saldo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(item.balance)}
                  </span>
              </div>
            </div>
          ))}
          {ledger.length === 0 && (
            <div className="text-center p-8 text-slate-500">
              Belum ada riwayat transaksi
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {ledger.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-500">data dari {ledger.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;
