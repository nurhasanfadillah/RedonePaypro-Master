import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { payments } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(payments).orderBy(desc(payments.createdAt));
      return res.status(200).json(
        rows.map((r) => ({
          id: r.id,
          date: r.date,
          employeeId: r.employeeId,
          amount: parseFloat(r.amount),
          type: r.type,
          note: r.note,
        }))
      );
    }

    if (req.method === 'POST') {
      const { id, date, employeeId, amount, type, note } = req.body;
      await db
        .insert(payments)
        .values({ id, date, employeeId, amount: String(amount), type, note })
        .onConflictDoUpdate({
          target: payments.id,
          set: { date, employeeId, amount: String(amount), type, note },
        });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id, all } = req.query;

      if (all === '1') {
        await db.delete(payments);
        return res.status(200).json({ ok: true });
      }

      if (!id) return res.status(400).json({ error: 'id required' });
      await db.delete(payments).where(eq(payments.id, id as string));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
