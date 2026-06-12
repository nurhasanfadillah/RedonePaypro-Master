import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { productionLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(productionLogs).orderBy(desc(productionLogs.createdAt));
      return res.status(200).json(
        rows.map((r) => ({
          id: r.id,
          date: r.date,
          employeeId: r.employeeId,
          componentId: r.componentId,
          qty: r.qty,
          priceSnapshot: parseFloat(r.priceSnapshot),
          total: parseFloat(r.total),
        }))
      );
    }

    if (req.method === 'POST') {
      const { id, date, employeeId, componentId, qty, priceSnapshot, total } = req.body;
      await db
        .insert(productionLogs)
        .values({
          id,
          date,
          employeeId,
          componentId,
          qty,
          priceSnapshot: String(priceSnapshot),
          total: String(total),
        })
        .onConflictDoUpdate({
          target: productionLogs.id,
          set: { date, employeeId, componentId, qty, priceSnapshot: String(priceSnapshot), total: String(total) },
        });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id, all } = req.query;

      if (all === '1') {
        await db.delete(productionLogs);
        return res.status(200).json({ ok: true });
      }

      if (!id) return res.status(400).json({ error: 'id required' });
      await db.delete(productionLogs).where(eq(productionLogs.id, id as string));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
