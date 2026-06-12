import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { components, productionLogs } from '../db/schema';
import { eq, asc, count } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { checkDeps, id } = req.query;

      if (checkDeps === '1' && id) {
        const [result] = await db
          .select({ total: count() })
          .from(productionLogs)
          .where(eq(productionLogs.componentId, id as string));

        const production = Number(result?.total ?? 0);

        return res.status(200).json({
          hasDependencies: production > 0,
          details: { production },
        });
      }

      const rows = await db.select().from(components).orderBy(asc(components.id));
      return res.status(200).json(
        rows.map((r) => ({ ...r, price: parseFloat(r.price) }))
      );
    }

    if (req.method === 'POST') {
      const { id, name, price } = req.body;
      await db
        .insert(components)
        .values({ id, name, price: String(price) })
        .onConflictDoUpdate({ target: components.id, set: { name, price: String(price) } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });

      await db.delete(components).where(eq(components.id, id as string));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
