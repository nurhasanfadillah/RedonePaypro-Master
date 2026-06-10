import { createClient } from '@supabase/supabase-js';

// PERBAIKAN & RESTORASI KONDISI SEBELUMNYA
// Menggunakan optional chaining (?.) untuk mencegah error "Cannot read properties of undefined"
// jika import.meta.env tidak tersedia di environment saat ini.

// INSTRUKSI:
// Jika file .env tidak terbaca, silakan ganti string 'MASUKKAN_...' di bawah ini dengan URL dan Key asli Anda.

const SUPABASE_URL = (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://sartektzisafnmbiuhwd.supabase.co';
const SUPABASE_KEY = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcnRla3R6aXNhZm5tYml1aHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzU4OTEsImV4cCI6MjA4MTMxMTg5MX0.HbB0e_eMt78qNBND19CtwSJIqTBvQa4UB1U-3eBtLNQ';

if (!SUPABASE_URL || SUPABASE_URL.includes('MASUKKAN')) {
  console.warn("⚠️ PERINGATAN: Kredensial Supabase belum terdeteksi.");
  console.warn("Silakan buat file .env atau masukkan URL & KEY secara manual di file services/supabaseClient.ts");
}

export const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_KEY
);