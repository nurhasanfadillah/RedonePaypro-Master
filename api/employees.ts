import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { employees, appUsers, productionLogs, payments } from '../db/schema';
import { eq, asc, count } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { checkDeps, id } = req.query;

      if (checkDeps === '1' && id) {
        const [prodResult] = await db
          .select({ total: count() })
          .from(productionLogs)
          .where(eq(productionLogs.employeeId, id as string));

        const [payResult] = await db
          .select({ total: count() })
          .from(payments)
          .where(eq(payments.employeeId, id as string));

        const production = Number(prodResult?.total ?? 0);
        const pay = Number(payResult?.total ?? 0);

        return res.status(200).json({
          hasDependencies: production > 0 || pay > 0,
          details: { production, payments: pay },
        });
      }

      const rows = await db.select().from(employees).orderBy(asc(employees.id));
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, name, address } = req.body;
      await db
        .insert(employees)
        .values({ id, name, address })
        .onConflictDoUpdate({ target: employees.id, set: { name, address } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });

      await db.delete(appUsers).where(eq(appUsers.employeeId, id as string));
      await db.delete(employees).where(eq(employees.id, id as string));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
