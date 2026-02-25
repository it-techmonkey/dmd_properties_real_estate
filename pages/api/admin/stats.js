import sql from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

// Middleware to check admin auth
function checkAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
    return null;
  }
  return decoded;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = checkAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Run all queries in parallel for maximum speed
    const [
      totalLeads,
      hotLeads,
      warmLeads,
      lostLeads,
      totalEnquiries,
      recentLeads,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM leads`,
      sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'HOT'`,
      sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'WARM'`,
      sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'COLD'`,
      sql`SELECT COUNT(*)::int AS count FROM general_enquiries`,
      sql`
        SELECT id, name, phone, email, project_name, price, status, created_at
        FROM leads
        ORDER BY created_at DESC
        LIMIT 5
      `,
    ]);

    const total = totalLeads[0]?.count || 0;
    const hot = hotLeads[0]?.count || 0;
    const warm = warmLeads[0]?.count || 0;
    const lost = lostLeads[0]?.count || 0;
    const enquiries = totalEnquiries[0]?.count || 0;

    res.setHeader('Cache-Control', 'private, max-age=30'); // cache 30s on client
    res.status(200).json({
      stats: {
        total,
        hot,
        warm,
        lost,
        clients: enquiries,
        enquiries,
        conversionRate: total > 0 ? ((hot / total) * 100).toFixed(1) : 0,
        lostRate: total > 0 ? ((lost / total) * 100).toFixed(1) : 0,
      },
      recentLeads,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
