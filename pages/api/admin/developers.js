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
  const user = checkAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Ensure tables exist
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('DB init failed:', err);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getDevelopers(req, res);
      case 'POST':
        return await createDeveloper(req, res);
      case 'PUT':
        return await updateDeveloper(req, res);
      case 'DELETE':
        return await deleteDeveloper(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin developers API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function getDevelopers(req, res) {
  const { search } = req.query;

  // Pagination params
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
  const offset = (page - 1) * pageSize;

  const filters = [];

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    filters.push(sql`LOWER(name) LIKE ${searchTerm}`);
  }

  const whereClause = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``;

  const totalResult = await sql`SELECT COUNT(*)::int AS count FROM developers ${whereClause}`;
  const total = totalResult?.[0]?.count || 0;

  const developers = await sql`
    SELECT *
    FROM developers
    ${whereClause}
    ORDER BY project_count DESC, name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  res.status(200).json({
    developers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

async function createDeveloper(req, res) {
  const {
    name,
    logo,
    description,
    website,
    email,
    phone,
  } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = await sql`
    INSERT INTO developers (
      name,
      logo,
      description,
      website,
      email,
      phone,
      project_count
    )
    VALUES (
      ${name},
      ${logo || null},
      ${description || null},
      ${website || null},
      ${email || null},
      ${phone || null},
      0
    )
    RETURNING *
  `;

  res.status(201).json({ developer: result[0] });
}

async function updateDeveloper(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Developer ID is required' });
  }

  // Build dynamic update query
  const setClauses = [];
  
  if (updates.name !== undefined) setClauses.push(sql`name = ${updates.name}`);
  if (updates.logo !== undefined) setClauses.push(sql`logo = ${updates.logo}`);
  if (updates.description !== undefined) setClauses.push(sql`description = ${updates.description}`);
  if (updates.website !== undefined) setClauses.push(sql`website = ${updates.website}`);
  if (updates.email !== undefined) setClauses.push(sql`email = ${updates.email}`);
  if (updates.phone !== undefined) setClauses.push(sql`phone = ${updates.phone}`);

  setClauses.push(sql`updated_at = NOW()`);

  if (setClauses.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const result = await sql`
    UPDATE developers
    SET ${sql.join(setClauses, sql`, `)}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Developer not found' });
  }

  res.status(200).json({ developer: result[0] });
}

async function deleteDeveloper(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Developer ID is required' });
  }

  // Check if developer has projects
  const projectCount = await sql`
    SELECT COUNT(*)::int AS count FROM projects WHERE developer_id = ${id}
  `;

  if (projectCount[0].count > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete developer with existing projects. Please remove or reassign projects first.' 
    });
  }

  const result = await sql`DELETE FROM developers WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Developer not found' });
  }

  res.status(200).json({ success: true, message: 'Developer deleted successfully' });
}
