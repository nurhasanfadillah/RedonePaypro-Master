import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index';
import { appUsers } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { username, password } = req.body;
      const [row] = await db
        .select()
        .from(appUsers)
        .where(and(eq(appUsers.username, username), eq(appUsers.password, password)));

      if (!row) return res.status(200).json(null);

      return res.status(200).json({
        username: row.username,
        password: row.password,
        role: row.role,
        employeeId: row.employeeId,
        fullName: row.fullName,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
