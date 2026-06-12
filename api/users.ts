import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { appUsers } from '../db/schema';
import { and, eq } from 'drizzle-orm';

function mapUser(row: typeof appUsers.$inferSelect) {
  return {
    username: row.username,
    password: row.password,
    role: row.role,
    employeeId: row.employeeId,
    fullName: row.fullName,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { employeeId } = req.query;

      if (employeeId) {
        const [row] = await db
          .select()
          .from(appUsers)
          .where(eq(appUsers.employeeId, employeeId as string));
        return res.status(200).json(row ? mapUser(row) : null);
      }

      const rows = await db.select().from(appUsers);
      return res.status(200).json(rows.map(mapUser));
    }

    if (req.method === 'POST') {
      const { username, password, role, employeeId, fullName } = req.body;
      try {
        await db
          .insert(appUsers)
          .values({ username, password, role, employeeId, fullName })
          .onConflictDoUpdate({
            target: appUsers.username,
            set: { password, role, employeeId, fullName },
          });
        return res.status(200).json({ ok: true });
      } catch (err: any) {
        if (err.message?.includes('duplicate key') || err.code === '23505') {
          return res.status(409).json({ error: `Username '${username}' sudah digunakan.` });
        }
        throw err;
      }
    }

    if (req.method === 'PUT') {
      const { action } = req.query;

      if (action === 'password') {
        const { username, oldPass, newPass } = req.body;
        const [row] = await db
          .select()
          .from(appUsers)
          .where(and(eq(appUsers.username, username), eq(appUsers.password, oldPass)));

        if (!row) return res.status(400).json({ error: 'Password lama salah.' });

        await db
          .update(appUsers)
          .set({ password: newPass })
          .where(eq(appUsers.username, username));

        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      const { employeeId } = req.query;
      if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

      await db.delete(appUsers).where(eq(appUsers.employeeId, employeeId as string));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
