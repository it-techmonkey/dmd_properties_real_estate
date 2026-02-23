import sql from '../../../lib/db';

export async function initializeDatabase() {
  try {
    // =============================================
    // 1. CREATE USERS TABLE
    // =============================================
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER',
        phone VARCHAR(50),
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // =============================================
    // 2. CREATE DEVELOPERS TABLE
    // =============================================
    await sql`
      CREATE TABLE IF NOT EXISTS developers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        description TEXT,
        website VARCHAR(500),
        email VARCHAR(255),
        phone VARCHAR(50),
        project_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add indexes for developers
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_developers_name ON developers(name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_developers_project_count ON developers(project_count DESC)`;
    } catch (e) {}

    // =============================================
    // 3. CREATE PROJECTS TABLE
    // =============================================
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        address TEXT,
        city VARCHAR(255),
        category VARCHAR(100),
        type TEXT[],
        unit_types TEXT[],
        min_price DECIMAL(15,2),
        max_price DECIMAL(15,2),
        description TEXT,
        amenities TEXT[],
        images TEXT[],
        location_lat DECIMAL(10,8),
        location_lng DECIMAL(11,8),
        developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add indexes for projects (performance optimization)
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_min_price ON projects(min_price)`;
    } catch (e) {}

    // =============================================
    // 4. CREATE GENERAL ENQUIRIES TABLE
    // =============================================
    await sql`
      CREATE TABLE IF NOT EXISTS general_enquiries (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        event VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'HOT',
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Drop name column if it exists (consolidate to first_name/last_name)
    try {
      await sql`ALTER TABLE general_enquiries DROP COLUMN IF EXISTS name`;
    } catch (e) {}

    // =============================================
    // 5. CREATE LEADS TABLE
    // =============================================
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        property_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'HOT',
        sales_stage VARCHAR(255) DEFAULT 'New Inquiry',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        price FLOAT,
        project_name VARCHAR(255),
        type VARCHAR(100),
        intent VARCHAR(255),
        event VARCHAR(255),
        job_title VARCHAR(255),
        employer VARCHAR(255),
        property_interests TEXT,
        notes TEXT,
        client_folder_link VARCHAR(500),
        nationality VARCHAR(255),
        date_of_birth DATE,
        home_address TEXT
      )
    `;

    // Add missing columns to leads table if they don't exist
    try {
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS employer VARCHAR(255)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_interests TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_folder_link VARCHAR(500)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS nationality VARCHAR(255)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS home_address TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS sales_stage VARCHAR(255)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent VARCHAR(255)`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS event VARCHAR(255)`;
    } catch (e) {
      // ignore if already exists
    }

    // =============================================
    // 6. CREATE TRIGGER FOR UPDATING project_count
    // =============================================
    try {
      // Function to update developer project count
      await sql`
        CREATE OR REPLACE FUNCTION update_developer_project_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            UPDATE developers 
            SET project_count = (
              SELECT COUNT(*) FROM projects WHERE developer_id = NEW.developer_id AND status = 'active'
            )
            WHERE id = NEW.developer_id;
          ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.developer_id IS DISTINCT FROM NEW.developer_id OR OLD.status IS DISTINCT FROM NEW.status THEN
              -- Update old developer count
              IF OLD.developer_id IS NOT NULL THEN
                UPDATE developers 
                SET project_count = (
                  SELECT COUNT(*) FROM projects WHERE developer_id = OLD.developer_id AND status = 'active'
                )
                WHERE id = OLD.developer_id;
              END IF;
              -- Update new developer count
              IF NEW.developer_id IS NOT NULL THEN
                UPDATE developers 
                SET project_count = (
                  SELECT COUNT(*) FROM projects WHERE developer_id = NEW.developer_id AND status = 'active'
                )
                WHERE id = NEW.developer_id;
              END IF;
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF OLD.developer_id IS NOT NULL THEN
              UPDATE developers 
              SET project_count = (
                SELECT COUNT(*) FROM projects WHERE developer_id = OLD.developer_id AND status = 'active'
              )
              WHERE id = OLD.developer_id;
            END IF;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create trigger
      await sql`
        DROP TRIGGER IF EXISTS trigger_update_developer_project_count ON projects
      `;
      
      await sql`
        CREATE TRIGGER trigger_update_developer_project_count
        AFTER INSERT OR UPDATE OR DELETE ON projects
        FOR EACH ROW EXECUTE FUNCTION update_developer_project_count()
      `;
    } catch (e) {
      console.log('Trigger creation skipped or failed:', e.message);
    }

    console.log('✓ Database tables initialized successfully');
    console.log('✓ Created: users, developers, projects, general_enquiries, leads');
    console.log('✓ Indexes and triggers configured');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Next.js API route handler
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    
    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['users', 'developers', 'projects', 'general_enquiries', 'leads'],
      indexes: 8,
      triggers: 1,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message,
    });
  }
}
