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
        return await getProjects(req, res);
      case 'POST':
        return await createProject(req, res);
      case 'PUT':
        return await updateProject(req, res);
      case 'DELETE':
        return await deleteProject(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin projects API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function getProjects(req, res) {
  const { search, status, category, developer_id } = req.query;

  // Pagination params
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
  const offset = (page - 1) * pageSize;

  const filters = [];

  if (status && status !== 'all') {
    filters.push(sql`p.status = ${status}`);
  }

  if (category && category !== 'all') {
    filters.push(sql`p.category = ${category}`);
  }

  if (developer_id) {
    filters.push(sql`p.developer_id = ${developer_id}`);
  }

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    filters.push(
      sql`(
        LOWER(p.title) LIKE ${searchTerm} OR
        LOWER(p.address) LIKE ${searchTerm} OR
        LOWER(p.city) LIKE ${searchTerm}
      )`
    );
  }

  const whereClause = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``;

  const totalResult = await sql`SELECT COUNT(*)::int AS count FROM projects p ${whereClause}`;
  const total = totalResult?.[0]?.count || 0;

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
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  res.status(200).json({
    projects: projects.map(p => ({
      ...p,
      Company: p.company,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

async function createProject(req, res) {
  const {
    title,
    address,
    city,
    category,
    type,
    unit_types,
    min_price,
    max_price,
    description,
    amenities,
    images,
    location_lat,
    location_lng,
    developer_id,
    status,
  } = req.body;

  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await sql`
    INSERT INTO projects (
      title,
      address,
      city,
      category,
      type,
      unit_types,
      min_price,
      max_price,
      description,
      amenities,
      images,
      location_lat,
      location_lng,
      developer_id,
      status
    )
    VALUES (
      ${title},
      ${address || null},
      ${city || null},
      ${category || null},
      ${type || []},
      ${unit_types || []},
      ${min_price || null},
      ${max_price || null},
      ${description || null},
      ${amenities || []},
      ${images || []},
      ${location_lat || null},
      ${location_lng || null},
      ${developer_id || null},
      ${status || 'active'}
    )
    RETURNING *
  `;

  res.status(201).json({ project: result[0] });
}

async function updateProject(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  // Build dynamic update query
  const setClauses = [];
  
  if (updates.title !== undefined) setClauses.push(sql`title = ${updates.title}`);
  if (updates.address !== undefined) setClauses.push(sql`address = ${updates.address}`);
  if (updates.city !== undefined) setClauses.push(sql`city = ${updates.city}`);
  if (updates.category !== undefined) setClauses.push(sql`category = ${updates.category}`);
  if (updates.type !== undefined) setClauses.push(sql`type = ${updates.type}`);
  if (updates.unit_types !== undefined) setClauses.push(sql`unit_types = ${updates.unit_types}`);
  if (updates.min_price !== undefined) setClauses.push(sql`min_price = ${updates.min_price}`);
  if (updates.max_price !== undefined) setClauses.push(sql`max_price = ${updates.max_price}`);
  if (updates.description !== undefined) setClauses.push(sql`description = ${updates.description}`);
  if (updates.amenities !== undefined) setClauses.push(sql`amenities = ${updates.amenities}`);
  if (updates.images !== undefined) setClauses.push(sql`images = ${updates.images}`);
  if (updates.location_lat !== undefined) setClauses.push(sql`location_lat = ${updates.location_lat}`);
  if (updates.location_lng !== undefined) setClauses.push(sql`location_lng = ${updates.location_lng}`);
  if (updates.developer_id !== undefined) setClauses.push(sql`developer_id = ${updates.developer_id}`);
  if (updates.status !== undefined) setClauses.push(sql`status = ${updates.status}`);

  setClauses.push(sql`updated_at = NOW()`);

  if (setClauses.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const result = await sql`
    UPDATE projects
    SET ${sql.join(setClauses, sql`, `)}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.status(200).json({ project: result[0] });
}

async function deleteProject(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.status(200).json({ success: true, message: 'Project deleted successfully' });
}
