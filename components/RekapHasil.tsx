import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Printer, Calendar, Filter, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Search, X, Loader2 } from 'lucide-react';

interface RekapItem {
  employeeId: string;
  name: string;
  totalUpah: number;
  totalDibayar: number;
  saldo: number;
}

const RekapHasil: React.FC = () => {
  const [data, setData] = useState<RekapItem[]>([]);
  const [modalOpen, setModalOpen] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodText, setPeriodText] = useState('-');
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set default dates on mount
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    setStartDate(today);
    setEndDate(today);
  }, []);

  const calculateData = async () => {
    setLoading(true);
    try {
        const employees = await DataService.getEmployees();
        const production = await DataService.getProductionLogs();
        const payments = await DataService.getPayments();

        const result: RekapItem[] = employees.map(emp => {
        const empProd = production.filter(p => 
            p.employeeId === emp.id && 
            p.date >= startDate && 
            p.date <= endDate
        );
        
        const empPayments = payments.filter(k => 
            k.employeeId === emp.id && 
            k.date >= startDate && 
            k.date <= endDate
        );

        const totalUpah = empProd.reduce((sum, item) => sum + item.total, 0);
        const totalDibayar = empPayments.reduce((sum, item) => sum + item.amount, 0);

        return {
            employeeId: emp.id,
            name: emp.name,
            totalUpah,
            totalDibayar,
            saldo: totalUpah - totalDibayar
        };
        }).filter(item => item.totalUpah > 0 || item.totalDibayar > 0);

        setData(result);
        
        const format = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        setPeriodText(`${format(startDate)} s/d ${format(endDate)}`);
    } catch (error) {
        console.error("Error calc rekap", error);
    } finally {
        setLoading(false);
    }
  };

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    calculateData();
    setModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // --- PROFESSIONAL PDF EXPORT LOGIC ---
  const handlePrint = () => {
    const w = window as any;
    if (!w.jspdf) {
      alert('Library PDF sedang dimuat, coba sesaat lagi.');
      return;
    }
    
    setIsPrinting(true);

    try {
      const { jsPDF } = w.jspdf;
      const doc = new jsPDF('landscape', 'mm', 'a4'); // A4 Landscape

      // 1. Header Document
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PT. REDONE BERKAH MANDIRI UTAMA", 14, 15);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("REKAPITULASI UPAH BORONGAN", 14, 21);
      
      doc.setFontSize(10);
      doc.text(`Periode: ${periodText}`, 14, 27);

      doc.line(14, 30, 283, 30); // Horizontal Line (297mm width - margins)

      // 2. Prepare Data for AutoTable
      const tableColumn = ["ID Karyawan", "Nama Karyawan", "Total Upah (+)", "Total Dibayar (-)", "Sisa Saldo (=)"];
      const tableRows: any[] = [];

      data.forEach(item => {
        const rowData = [
          item.employeeId,
          item.name,
          formatCurrency(item.totalUpah),
          formatCurrency(item.totalDibayar),
          formatCurrency(item.saldo)
        ];
        tableRows.push(rowData);
      });

      // Add Footer Row (Total)
      const grandTotalUpah = data.reduce((acc, curr) => acc + curr.totalUpah, 0);
      const grandTotalDibayar = data.reduce((acc, curr) => acc + curr.totalDibayar, 0);
      const grandTotalSaldo = data.reduce((acc, curr) => acc + curr.saldo, 0);

      tableRows.push([
        { content: "TOTAL PERIODE", colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(grandTotalUpah), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(grandTotalDibayar), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(grandTotalSaldo), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
      ]);

      // 3. Generate Table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { 
          fillColor: [22, 163, 74], // Green-600 match
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
          0: { halign: 'left', cellWidth: 30 },
          1: { halign: 'left' },
          2: { halign: 'right', font: 'courier' }, // Mono font for numbers
          3: { halign: 'right', font: 'courier' },
          4: { halign: 'right', font: 'courier', fontStyle: 'bold' }
        },
        didDrawPage: (data: any) => {
            // Footer page number if needed
        }
      });

      // 4. Signatures (Placed after table)
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      // Check if signature fits in page, else add page
      if (finalY > 170) {
        doc.addPage();
        // Reset Y for new page
      }

      const sigY = finalY > 170 ? 40 : finalY;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Left Signature
      doc.text("Mengetahui,", 40, sigY, { align: 'center' });
      doc.text("Manager", 40, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 40, sigY + 30, { align: 'center' });

      // Right Signature
      doc.text("Dibuat Oleh,", 240, sigY, { align: 'center' });
      doc.text("Admin Keuangan", 240, sigY + 5, { align: 'center' });
      doc.text("(________________________)", 240, sigY + 30, { align: 'center' });

      // 5. Save
      doc.save(`Rekap_Borongan_${startDate}_sd_${endDate}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Gagal membuat PDF. Pastikan browser mendukung.");
    } finally {
      setIsPrinting(false);
    }
  };

  const grandTotalUpah = data.reduce((acc, curr) => acc + curr.totalUpah, 0);
  const grandTotalDibayar = data.reduce((acc, curr) => acc + curr.totalDibayar, 0);
  const grandTotalSaldo = data.reduce((acc, curr) => acc + curr.saldo, 0);

  const SummaryCard = ({ title, value, icon: Icon, colorClass, textClass }: any) => (
    <div className="bg-white dark:bg-dark-card p-3.5 md:p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex items-center justify-between no-print">
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">{title}</p>
        <h3 className={`text-lg font-bold ${textClass}`}>{formatCurrency(value)}</h3>
      </div>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 relative animate-fade-in">
      {isPrinting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin mb-4 text-primary-500" />
          <p className="text-lg font-bold">Sedang Membuat Dokumen PDF...</p>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Rekapitulasi Hasil</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
            <Calendar size={14} />
            <span>Periode: <span className="font-medium text-slate-700 dark:text-slate-300">{periodText}</span></span>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <button onClick={() => setModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-medium">
            <Filter size={16} /> Ganti Periode
          </button>
          <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-900 dark:hover:bg-white shadow-lg shadow-slate-800/20 transition-all text-sm font-medium">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
        <SummaryCard title="Total Hasil Kerja (Upah)" value={grandTotalUpah} icon={TrendingUp} colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" textClass="text-green-600 dark:text-green-400" />
        <SummaryCard title="Total Telah Dibayar" value={grandTotalDibayar} icon={ArrowDownLeft} colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" textClass="text-orange-600 dark:text-orange-400" />
        <SummaryCard title="Sisa Saldo Gaji" value={grandTotalSaldo} icon={Wallet} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" textClass="text-blue-600 dark:text-blue-400" />
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
             <Loader2 className="animate-spin text-green-500" size={40} />
        </div>
      ) : (
      <>
      {/* Main Table Display (Screen Only) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Karyawan</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-green-600">Total Upah (+)</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-orange-600">Total Dibayar (-)</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-blue-600">Sisa Saldo (=)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {data.map((item) => (
                <tr key={item.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.name} <span className="text-[10px] text-slate-400 ml-1 font-mono no-print">#{item.employeeId}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400 font-mono">
                    {formatCurrency(item.totalUpah)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-orange-600 dark:text-orange-400 font-mono">
                    {formatCurrency(item.totalDibayar)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold text-slate-800 dark:text-slate-100 font-mono bg-slate-50/50 dark:bg-slate-800/50">
                    {formatCurrency(item.saldo)}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    <Search size={32} className="mx-auto mb-2 opacity-20"/>
                    Tidak ada data transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-dark-border font-bold">
              <tr>
                <td className="px-6 py-3 text-right uppercase text-xs text-slate-500">Total Periode</td>
                <td className="px-6 py-3 text-right text-green-700 dark:text-green-400 text-sm">{formatCurrency(grandTotalUpah)}</td>
                <td className="px-6 py-3 text-right text-orange-700 dark:text-orange-400 text-sm">{formatCurrency(grandTotalDibayar)}</td>
                <td className="px-6 py-3 text-right text-slate-900 dark:text-slate-100 text-base">{formatCurrency(grandTotalSaldo)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="md:hidden no-print">
          {data.map((item) => (
             <div key={item.employeeId} className="p-3.5 border-b border-slate-100 dark:border-dark-border last:border-0">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100">{item.name}</h3>
                 <span className={`text-sm font-bold px-2 py-0.5 rounded ${item.saldo >= 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-50 text-red-700'}`}>
                   {formatCurrency(item.saldo)}
                 </span>
               </div>
               <div className="flex items-center gap-4 text-xs">
                 <div className="flex-1">
                    <span className="block text-slate-400 mb-0.5">Total Upah</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(item.totalUpah)}</span>
                 </div>
                 <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                 <div className="flex-1">
                    <span className="block text-slate-400 mb-0.5">Dibayar</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(item.totalDibayar)}</span>
                 </div>
               </div>
             </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Filter Periode</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleProcess}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Dari Tanggal</label>
                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Sampai Tanggal</label>
                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" />
                  </div>
                </div>
                <div className="flex gap-3 border-t border-slate-100 dark:border-dark-border pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all">Terapkan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapHasil;