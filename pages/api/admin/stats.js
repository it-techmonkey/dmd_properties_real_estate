import sql from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { initializeDatabase } from '../migrations/init';

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
    // Initialize database (creates tables if they don't exist)
    await initializeDatabase();

    // Get lead statistics
    const totalLeads = await sql`SELECT COUNT(*) as count FROM leads`;
    const hotLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'HOT'`;
    const warmLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'WARM'`;
    const lostLeads = await sql`SELECT COUNT(*) as count FROM leads WHERE status = 'COLD'`;
    
    // Clients unified into general_enquiries
    const totalClients = await sql`SELECT COUNT(*) as count FROM general_enquiries`;
    
    // Get enquiry count
    const totalEnquiries = await sql`SELECT COUNT(*) as count FROM general_enquiries`;
    
    // Get recent leads (last 5)
    const recentLeads = await sql`
      SELECT id, name, phone, email, project_name, price, status, created_at 
      FROM leads 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const total = parseInt(totalLeads[0].count);
    const hot = parseInt(hotLeads[0].count);
    const warm = parseInt(warmLeads[0].count);
    const lost = parseInt(lostLeads[0].count);
    const clients = parseInt(totalClients[0].count);
    const enquiries = parseInt(totalEnquiries[0].count);

    res.status(200).json({
      stats: {
        total,
        hot,
        warm,
        lost,
        clients,
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
