import React from 'react';

// NOTE: Komponen ini sudah tidak digunakan (Deprecated).
// Seluruh fungsionalitas Kasbon telah dipindahkan dan disatukan ke dalam modul Payments.tsx.
// File ini dipertahankan hanya untuk mencegah error import jika masih ada referensi tertinggal, 
// namun sebaiknya dihapus total di masa depan.

const Kasbon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 m-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500">
      <h3 className="text-lg font-bold mb-2">Komponen Non-Aktif</h3>
      <p>Fitur Kasbon telah dipindahkan ke menu <strong>Pembayaran</strong>.</p>
    </div>
  );
};

export default Kasbon;