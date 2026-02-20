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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    const { sourceId, sourceType, leadData } = req.body;

    if (!sourceId || !sourceType || !['client', 'enquiry'].includes(sourceType)) {
      return res.status(400).json({ error: 'Invalid source ID or type' });
    }

    if (!leadData) {
      return res.status(400).json({ error: 'Lead data is required' });
    }

    let name = leadData.name || '';
    let email = leadData.email || '';
    let phone = leadData.phone || '';

    // Get source data
    if (sourceType === 'client') {
      const client = await sql`
        SELECT first_name, last_name, email, phone FROM clients WHERE id = ${sourceId}
      `;

      if (client.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      name = leadData.name || `${client[0].first_name || ''} ${client[0].last_name || ''}`.trim();
      email = leadData.email || client[0].email || '';
      phone = leadData.phone || client[0].phone || '';
    } else if (sourceType === 'enquiry') {
      const enquiry = await sql`
        SELECT first_name, last_name, email, phone FROM general_enquiries WHERE id = ${sourceId}
      `;

      if (enquiry.length === 0) {
        return res.status(404).json({ error: 'Enquiry not found' });
      }

      name = leadData.name || `${enquiry[0].first_name || ''} ${enquiry[0].last_name || ''}`.trim();
      email = leadData.email || enquiry[0].email;
      phone = leadData.phone || enquiry[0].phone || '';
    }

    // Validate phone if provided
    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number' });
      }
    }

    // Create lead
    const result = await sql`
      INSERT INTO leads (
        name,
        phone,
        email,
        project_name,
        price,
        type,
        intent,
        event,
        sales_stage,
        status,
        job_title,
        employer,
        property_interests,
        notes,
        client_folder_link,
        nationality,
        date_of_birth,
        home_address
      )
      VALUES (
        ${name},
        ${phone},
        ${email || null},
        ${leadData.projectName || null},
        ${leadData.price || null},
        ${leadData.type || null},
        ${leadData.intent || null},
        ${leadData.event || null},
        ${leadData.salesStage || 'New Inquiry'},
        ${leadData.status || 'HOT'},
        ${leadData.job_title || null},
        ${leadData.employer || null},
        ${leadData.property_interests || null},
        ${leadData.notes || null},
        ${leadData.client_folder_link || null},
        ${leadData.nationality || null},
        ${leadData.date_of_birth || null},
        ${leadData.home_address || null}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, lead: result[0] });
  } catch (error) {
    console.error('Move to leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
