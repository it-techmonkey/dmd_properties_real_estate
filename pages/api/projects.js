import { neon } from '@neondatabase/serverless';
import { initializeDatabase } from './migrations/init';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Initialize database tables if needed
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('DB init failed:', err);
    return res.status(500).json({ success: false, message: 'Database initialization failed' });
  }

  if (req.method === 'GET' || req.method === 'POST') {
    return await getProjects(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function getProjects(req, res) {
  try {
    // Extract pagination params
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
    const offset = (page - 1) * limit;

    // Extract filters from request body (POST) or query params (GET)
    const filters = req.method === 'POST' ? req.body : req.query;
    const {
      priority_company_ids,
      category,
      type,
      unit_types,
      min_price,
      max_price,
      city,
      search,
      developer_id,
    } = filters || {};

    // Build WHERE clause parts
    let whereClause = `WHERE status = 'active'`;
    const whereParts = [];

    // Category filter (Off_plan, Ready)
    if (category) {
      whereParts.push(`category = '${category}'`);
    }

    // Type filter (Villa, Apartment, Townhouse, etc.)
    if (type) {
      if (Array.isArray(type) && type.length > 0) {
        const typeList = type.map(t => `'${t}'`).join(',');
        whereParts.push(`type && ARRAY[${typeList}]`);
      } else if (typeof type === 'string') {
        whereParts.push(`'${type}' = ANY(type)`);
      }
    }

    // Unit types filter
    if (unit_types) {
      if (Array.isArray(unit_types) && unit_types.length > 0) {
        const unitTypeList = unit_types.map(u => `'${u}'`).join(',');
        whereParts.push(`unit_types && ARRAY[${unitTypeList}]`);
      } else if (typeof unit_types === 'string') {
        whereParts.push(`'${unit_types}' = ANY(unit_types)`);
      }
    }

    // Price range filters
    if (min_price !== undefined && min_price !== null) {
      whereParts.push(`min_price >= ${parseFloat(min_price)}`);
    }
    if (max_price !== undefined && max_price !== null) {
      whereParts.push(`min_price <= ${parseFloat(max_price)}`);
    }

    // City filter
    if (city) {
      whereParts.push(`LOWER(city) = '${city.toLowerCase()}'`);
    }

    // Developer filter
    if (developer_id) {
      whereParts.push(`developer_id = '${developer_id}'`);
    }

    // Search filter (title, address, city)
    if (search) {
      const searchTerm = search.toLowerCase().replace(/'/g, "''");
      whereParts.push(`(
        LOWER(title) LIKE '%${searchTerm}%' OR
        LOWER(address) LIKE '%${searchTerm}%' OR
        LOWER(city) LIKE '%${searchTerm}%'
      )`);
    }

    // Combine WHERE conditions
    if (whereParts.length > 0) {
      whereClause += ' AND ' + whereParts.join(' AND ');
    }

    // Handle priority sorting
    let orderByClause = 'ORDER BY created_at DESC';
    if (priority_company_ids && Array.isArray(priority_company_ids) && priority_company_ids.length > 0) {
      const priorityIds = priority_company_ids.map(id => `'${id}'`).join(',');
      orderByClause = `ORDER BY CASE WHEN developer_id IN (${priorityIds}) THEN 0 ELSE 1 END, created_at DESC`;
    }

    // Get total count using template literal
    const countResult = await sql`
      SELECT COUNT(*)::int AS count 
      FROM projects 
      ${sql.unsafe(whereClause)}
    `;
    const total = countResult[0]?.count || 0;

    // Get projects with developer info (JOIN) using template literal
    const projects = await sql`
      SELECT 
        p.*,
        json_build_object(
          'id', d.id,
          'name', d.name,
          'logo', d.logo
        ) AS company
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      ${sql.unsafe(whereClause)}
      ${sql.unsafe(orderByClause)}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Calculate pagination
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.status(200).json({
      success: true,
      data: projects.map(p => ({
        ...p,
        Company: p.company, // Match external API format
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message,
    });
  }
}
