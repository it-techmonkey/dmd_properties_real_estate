import sql from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing project ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Fetch project with developer info
    const projects = await sql`
      SELECT 
        p.*,
        json_build_object(
          'id', d.id,
          'name', d.name,
          'logo', d.logo,
          'description', d.description,
          'website', d.website,
          'email', d.email,
          'phone', d.phone
        ) AS company
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      WHERE p.id = ${id} AND p.status = 'active'
    `;

    if (projects.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    const project = projects[0];

    res.status(200).json({
      success: true,
      data: {
        ...project,
        Company: project.company, // Match external API format
      },
    });
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project', 
      error: error.message 
    });
  }
}
