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

  try {
    switch (req.method) {
      case 'GET':
        return await getEnquiries(req, res);
      case 'POST':
        return await createEnquiry(req, res);
      case 'PUT':
        return await updateEnquiry(req, res);
      case 'DELETE':
        return await deleteEnquiry(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('General enquiries API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getEnquiries(req, res) {
  const { search, status } = req.query;

  // Pagination params (defaults)
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
  const offset = (page - 1) * pageSize;

  // Initialize database (creates table if doesn't exist)
  await initializeDatabase();

  const filters = [];

  if (status && status !== 'all') {
    filters.push(sql`status = ${status.toUpperCase()}`);
  }

  if (search) {
    const q = `%${search.toLowerCase()}%`;
    filters.push(
      sql`(
        LOWER(first_name) LIKE ${q} OR
        LOWER(last_name) LIKE ${q} OR
        LOWER(email) LIKE ${q} OR
        LOWER(subject) LIKE ${q} OR
        LOWER(message) LIKE ${q}
      )`
    );
  }

  const whereClause = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``;

  const totalResult = await sql`SELECT COUNT(*)::int AS count FROM general_enquiries ${whereClause}`;
  const total = totalResult?.[0]?.count || 0;

  const enquiries = await sql`
    SELECT * FROM general_enquiries
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  res.status(200).json({
    enquiries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

async function createEnquiry(req, res) {
  const {
    first_name,
    last_name,
    email,
    phone,
    subject,
    message,
    event,
    job_title,
    employer,
    property_interests,
    notes,
    client_folder_link,
    nationality,
    date_of_birth,
    home_address,
  } = req.body;

  // Validate required fields
  if (!email || !phone) {
    return res.status(400).json({ error: 'Email and phone are required' });
  }

  await initializeDatabase();

  const result = await sql`
    INSERT INTO general_enquiries (
      first_name,
      last_name,
      email,
      phone,
      subject,
      message,
      event,
      job_title,
      employer,
      property_interests,
      notes,
      client_folder_link,
      nationality,
      date_of_birth,
      home_address,
      status
    )
    VALUES (
      ${first_name || null},
      ${last_name || null},
      ${email},
      ${phone},
      ${subject || 'Manual Entry'},
      ${message || 'N/A'},
      ${event || null},
      ${job_title || null},
      ${employer || null},
      ${property_interests || null},
      ${notes || null},
      ${client_folder_link || null},
      ${nationality || null},
      ${date_of_birth || null},
      ${home_address || null},
      'HOT'
    )
    RETURNING *
  `;

  res.status(201).json({ enquiry: result[0] });
}

async function updateEnquiry(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const result = await sql`
    UPDATE general_enquiries 
    SET 
      first_name = COALESCE(${updates.first_name}, first_name),
      last_name = COALESCE(${updates.last_name}, last_name),
      email = COALESCE(${updates.email}, email),
      phone = COALESCE(${updates.phone}, phone),
      subject = COALESCE(${updates.subject}, subject),
      event = COALESCE(${updates.event}, event),
      message = COALESCE(${updates.message}, message),
      job_title = COALESCE(${updates.job_title}, job_title),
      employer = COALESCE(${updates.employer}, employer),
      property_interests = COALESCE(${updates.property_interests}, property_interests),
      notes = COALESCE(${updates.notes}, notes),
      client_folder_link = COALESCE(${updates.client_folder_link}, client_folder_link),
      nationality = COALESCE(${updates.nationality}, nationality),
      date_of_birth = COALESCE(${updates.date_of_birth}, date_of_birth),
      home_address = COALESCE(${updates.home_address}, home_address),
      status = COALESCE(${updates.status}, status),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  res.status(200).json({ enquiry: result[0] });
}

async function deleteEnquiry(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  await sql`DELETE FROM general_enquiries WHERE id = ${id}`;

  res.status(200).json({ success: true });
}
