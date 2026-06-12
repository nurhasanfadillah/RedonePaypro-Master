import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { employees, components } from './schema';

function loadEnv() {
  try {
    const lines = readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    console.warn('Warning: .env file not found, using existing env vars');
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED not set');
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql);

const EMPLOYEES = [
  { id: 'KPRD-001', name: 'YUNUS', address: 'Cileungsi' },
  { id: 'KPRD-002', name: 'Mang bebek', address: 'Ciuncal' },
  { id: 'KPRD-003', name: 'Rahman', address: 'Gandoang' },
  { id: 'KPRD-006', name: 'Mamah eli', address: 'Jonggol' },
  { id: 'KPRD-014', name: 'Tiara', address: 'Jonggol' },
  { id: 'KPRD-016', name: 'Bang jay', address: 'Gandoang' },
  { id: 'KPRD-019', name: 'Dayut', address: 'Cariu' },
  { id: 'KPRD-021', name: 'Soleh', address: 'Indonesia' },
  { id: 'KPRD-023', name: 'Bu heny', address: 'Jonggol' },
  { id: 'KPRD-024', name: 'Iwan toke', address: 'Gandoang' },
  { id: 'KPRD-025', name: 'Lala', address: 'Jonggol' },
  { id: 'KPRD-026', name: 'Risma', address: 'Jonggol' },
  { id: 'KPRD-027', name: 'Eka', address: 'Garung' },
  { id: 'KPRD-029', name: 'ambrew', address: 'bogor' },
  { id: 'KPRD-030', name: 'enung', address: 'bogor' },
  { id: 'KPRD-032', name: 'jovri', address: 'bogor' },
  { id: 'KPRD-034', name: 'tati', address: 'cariu' },
  { id: 'KPRD-035', name: 'embad', address: 'bogor' },
  { id: 'KPRD-036', name: 'doni', address: 'cariu' },
  { id: 'KPRD-039', name: 'luna', address: 'garung' },
  { id: 'KPRD-040', name: 'udin', address: 'cariu' },
  { id: 'KPRD-042', name: 'ahmad', address: 'bogor' },
  { id: 'KPRD-043', name: 'sarkum', address: 'bogor' },
  { id: 'KPRD-044', name: 'bunga', address: 'bogor' },
  { id: 'KPRD-045', name: 'silfi', address: 'bogor' },
  { id: 'KPRD-048', name: 'intan', address: 'cipeucang' },
  { id: 'KPRD-049', name: 'tedi', address: 'cipecang' },
];

const COMPONENTS = [
  { id: 'KP-001', name: 'madome full', price: '1000' },
  { id: 'KP-002', name: 'madome serut aruma', price: '850' },
  { id: 'KP-003', name: 'madome ransel', price: '1700' },
  { id: 'KP-004', name: 'pasang kepala jiper', price: '75' },
  { id: 'KP-005', name: 'pasang pala axelo/dompet', price: '100' },
  { id: 'KP-006', name: 'balikin tas', price: '135' },
  { id: 'KP-007', name: 'goting bodi', price: '75' },
  { id: 'KP-008', name: 'Qc', price: '135' },
  { id: 'KP-009', name: 'potong webing/tali', price: '35' },
  { id: 'KP-010', name: 'gaset celuta', price: '550' },
  { id: 'KP-011', name: 'bodi depan celuta', price: '450' },
  { id: 'KP-012', name: 'bodi belakang celuta', price: '125' },
  { id: 'KP-013', name: 'bodi depan athae', price: '500' },
  { id: 'KP-014', name: 'bodi belakang athae/apenta', price: '250' },
  { id: 'KP-015', name: 'tali athae', price: '150' },
  { id: 'KP-016', name: 'bodi depan apenta', price: '600' },
  { id: 'KP-017', name: 'tali apenta', price: '250' },
  { id: 'KP-018', name: 'pasang pekro leptop sett', price: '275' },
  { id: 'KP-019', name: 'pasang pekro atas', price: '150' },
  { id: 'KP-020', name: 'pasang pekro depan', price: '125' },
  { id: 'KP-021', name: 'bodi depan leptop pull', price: '350' },
  { id: 'KP-022', name: 'nyorong bodi depan leptop', price: '125' },
  { id: 'KP-023', name: 'nambung lapis leptop', price: '100' },
  { id: 'KP-024', name: 'poket leptop', price: '500' },
  { id: 'KP-025', name: 'gabung leptop', price: '250' },
  { id: 'KP-026', name: 'lipat hendel leptop', price: '100' },
  { id: 'KP-027', name: 'pasang hendel leptop', price: '400' },
  { id: 'KP-028', name: 'nyorong leptop', price: '1000' },
  { id: 'KP-029', name: 'pasang poket leptop', price: '900' },
  { id: 'KP-030', name: 'dasar bodi belakang leptop', price: '300' },
  { id: 'KP-031', name: 'komponen aruma', price: '3200' },
  { id: 'KP-032', name: 'motong bahan celuta', price: '260' },
  { id: 'KP-033', name: 'motong bahan selempang mini', price: '150' },
  { id: 'KP-034', name: 'motong bahan aruma', price: '250' },
  { id: 'KP-035', name: 'motong bahan axelo', price: '200' },
  { id: 'KP-036', name: 'setik jiper dompet', price: '300' },
  { id: 'KP-037', name: 'madome dompet', price: '400' },
  { id: 'KP-038', name: 'bodi depan m3', price: '500' },
  { id: 'KP-039', name: 'pasang poket m3', price: '1200' },
  { id: 'KP-040', name: 'dasar bodi belakang m3/m2', price: '200' },
  { id: 'KP-041', name: 'madome m3/m2', price: '1400' },
  { id: 'KP-042', name: 'bodi depan selempang mini', price: '400' },
  { id: 'KP-043', name: 'gaset selempang mini', price: '450' },
  { id: 'KP-044', name: 'tali selempang mini', price: '150' },
  { id: 'KP-045', name: 'bikin poket m3', price: '450' },
  { id: 'KP-046', name: 'setik jiper axelo', price: '350' },
  { id: 'KP-047', name: 'tali athae cantelan', price: '250' },
  { id: 'KP-048', name: 'tali bahan celuta', price: '100' },
  { id: 'KP-049', name: 'lipat kantong', price: '75' },
  { id: 'KP-050', name: 'potong lapis celuta', price: '125' },
  { id: 'KP-051', name: 'potong busa', price: '50' },
  { id: 'KP-052', name: 'madome totbag', price: '600' },
  { id: 'KP-053', name: 'motong dompet', price: '125' },
  { id: 'KP-054', name: 'produksi', price: '150' },
  { id: 'KP-055', name: 'heming serut aruma', price: '300' },
  { id: 'KP-056', name: 'segi tiga serut aruma', price: '150' },
  { id: 'KP-057', name: 'gabung serut aruma', price: '250' },
  { id: 'KP-058', name: 'bobok serut aruma', price: '200' },
  { id: 'KP-059', name: 'dasar bodi depan serut aruma', price: '250' },
  { id: 'KP-060', name: 'bodi depan full m2', price: '800' },
  { id: 'KP-061', name: 'pasang tali serut aruma', price: '350' },
];

async function seed() {
  console.log('Seeding employees...');
  for (const emp of EMPLOYEES) {
    await db
      .insert(employees)
      .values(emp)
      .onConflictDoUpdate({ target: employees.id, set: { name: emp.name, address: emp.address } });
  }
  console.log(`Seeded ${EMPLOYEES.length} employees`);

  console.log('Seeding components...');
  for (const comp of COMPONENTS) {
    await db
      .insert(components)
      .values(comp)
      .onConflictDoUpdate({ target: components.id, set: { name: comp.name, price: comp.price } });
  }
  console.log(`Seeded ${COMPONENTS.length} components`);

  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
