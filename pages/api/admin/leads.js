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

  // Ensure tables/columns exist before handling requests
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('DB init failed:', err);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getLeads(req, res);
      case 'POST':
        return await createLead(req, res);
      case 'PUT':
        return await updateLead(req, res);
      case 'DELETE':
        return await deleteLead(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leads API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLeads(req, res) {
  const { status, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
  const offset = (page - 1) * pageSize;

  let totalResult;
  let leads;

  if (status && status !== 'all') {
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      totalResult = await sql`
        SELECT COUNT(*) AS count FROM leads 
        WHERE status = ${status.toUpperCase()} 
        AND (LOWER(name) LIKE ${searchTerm} OR LOWER(project_name) LIKE ${searchTerm})
      `;

      leads = await sql`
        SELECT * FROM leads 
        WHERE status = ${status.toUpperCase()} 
        AND (LOWER(name) LIKE ${searchTerm} OR LOWER(project_name) LIKE ${searchTerm})
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      totalResult = await sql`SELECT COUNT(*) AS count FROM leads WHERE status = ${status.toUpperCase()}`;

      leads = await sql`
        SELECT * FROM leads 
        WHERE status = ${status.toUpperCase()} 
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    }
  } else {
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      totalResult = await sql`
        SELECT COUNT(*) AS count FROM leads 
        WHERE LOWER(name) LIKE ${searchTerm} OR LOWER(project_name) LIKE ${searchTerm}
      `;

      leads = await sql`
        SELECT * FROM leads 
        WHERE LOWER(name) LIKE ${searchTerm} OR LOWER(project_name) LIKE ${searchTerm}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      totalResult = await sql`SELECT COUNT(*) AS count FROM leads`;

      leads = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    }
  }

  const total = parseInt(totalResult[0]?.count || 0, 10);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  res.status(200).json({
    leads,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

async function createLead(req, res) {
  const { name, phone, email, project_name, type, price, status, sales_stage } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  // Validate phone - allow digits, spaces, +, -, parentheses (7-20 chars)
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  // Validate email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
  }

  const result = await sql`
    INSERT INTO leads (
      name,
      phone,
      email,
      project_name,
      type,
      price,
      status,
      sales_stage
    )
    VALUES (
      ${name},
      ${phone},
      ${email || null},
      ${project_name || null},
      ${type || null},
      ${price || null},
      ${status || 'HOT'},
      ${sales_stage || 'New Inquiry'}
    )
    RETURNING *
  `;

  res.status(201).json({ lead: result[0] });
}

async function updateLead(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  // Build dynamic update - only update fields that are provided
  const result = await sql`
    UPDATE leads 
    SET 
      name = COALESCE(${updates.name}, name),
      phone = COALESCE(${updates.phone}, phone),
      email = COALESCE(${updates.email}, email),
      project_name = COALESCE(${updates.project_name}, project_name),
      type = COALESCE(${updates.type}, type),
      price = COALESCE(${updates.price}, price),
      status = COALESCE(${updates.status}, status),
      sales_stage = COALESCE(${updates.sales_stage}, sales_stage),
      job_title = COALESCE(${updates.job_title}, job_title),
      employer = COALESCE(${updates.employer}, employer),
      property_interests = COALESCE(${updates.property_interests}, property_interests),
      notes = COALESCE(${updates.notes}, notes),
      client_folder_link = COALESCE(${updates.client_folder_link}, client_folder_link),
      nationality = COALESCE(${updates.nationality}, nationality),
      date_of_birth = COALESCE(${updates.date_of_birth}, date_of_birth),
      home_address = COALESCE(${updates.home_address}, home_address),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  res.status(200).json({ lead: result[0] });
}

async function deleteLead(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  const result = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  res.status(200).json({ message: 'Lead deleted successfully' });
}
