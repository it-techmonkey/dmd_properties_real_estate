import sql from '../../lib/db';
import { initializeDatabase } from './migrations/init';

export default async function handler(req, res) {
  // Initialize database tables if needed
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('DB init failed:', err);
    return res.status(500).json({ success: false, message: 'Database initialization failed' });
  }

  if (req.method === 'GET') {
    return await getDevelopers(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function getDevelopers(req, res) {
  try {
    // Extract pagination params
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
    const offset = (page - 1) * limit;

    // Extract filters
    const { min_projects, search } = req.query;

    // Build WHERE clause
    const whereConditions = [];

    // Filter by minimum project count
    if (min_projects !== undefined && min_projects !== null) {
      whereConditions.push(sql`project_count >= ${parseInt(min_projects, 10)}`);
    }

    // Search by developer name
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions.push(sql`LOWER(name) LIKE ${searchTerm}`);
    }

    const whereClause = whereConditions.length > 0
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
      : sql``;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int AS count 
      FROM developers 
      ${whereClause}
    `;
    const total = countResult[0]?.count || 0;

    // Get developers with their project count
    const developers = await sql`
      SELECT 
        id,
        name,
        logo,
        description,
        website,
        email,
        phone,
        project_count,
        created_at,
        updated_at
      FROM developers
      ${whereClause}
      ORDER BY project_count DESC, name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Transform to match external API format
    const transformedDevelopers = developers.map(dev => ({
      id: dev.id,
      project_count: dev.project_count,
      Company: {
        name: dev.name,
        logo: dev.logo,
        description: dev.description,
        website: dev.website,
        email: dev.email,
        phone: dev.phone,
      },
    }));

    // Calculate pagination
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.status(200).json({
      success: true,
      data: transformedDevelopers,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developers',
      error: error.message,
    });
  }
}
