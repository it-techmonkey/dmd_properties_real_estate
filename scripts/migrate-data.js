/**
 * Data Migration Script - Import from External API to Local Database
 * 
 * This script fetches all projects and developers from the external API
 * and imports them into your local PostgreSQL database.
 * 
 * Usage: node scripts/migrate-data.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tm-backend-qfaf.onrender.com';

// Helper function to delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllDevelopers() {
  console.log('\n📥 Fetching developers from external API...');
  
  try {
    let allDevelopers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${EXTERNAL_API_URL}/api/developers?page=${page}&limit=100`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        allDevelopers = [...allDevelopers, ...result.data];
        console.log(`  ✓ Fetched page ${page} (${result.data.length} developers)`);
        
        // Check if there are more pages
        if (result.pagination && page < result.pagination.total_pages) {
          page++;
          await delay(100); // Rate limiting
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✓ Total developers fetched: ${allDevelopers.length}`);
    return allDevelopers;
  } catch (error) {
    console.error('Error fetching developers:', error);
    throw error;
  }
}

async function fetchAllProjects() {
  console.log('\n📥 Fetching projects from external API...');
  
  try {
    let allProjects = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${EXTERNAL_API_URL}/api/projects?page=${page}&limit=100`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No filters
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        allProjects = [...allProjects, ...result.data];
        console.log(`  ✓ Fetched page ${page} (${result.data.length} projects)`);
        
        // Check if there are more pages
        if (result.pagination && page < result.pagination.total_pages) {
          page++;
          await delay(100); // Rate limiting
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✓ Total projects fetched: ${allProjects.length}`);
    return allProjects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

async function importDevelopers(sql, developers) {
  console.log('\n💾 Importing developers into database...');
  
  const developerIdMap = new Map(); // Map old ID to new UUID
  let imported = 0;
  let skipped = 0;

  for (const dev of developers) {
    try {
      if (!dev.Company || !dev.Company.name) {
        skipped++;
        continue;
      }

      // Check if developer already exists
      const existing = await sql`
        SELECT id FROM developers WHERE name = ${dev.Company.name}
      `;

      let developerId;

      if (existing.length > 0) {
        developerId = existing[0].id;
        developerIdMap.set(dev.id, developerId);
        skipped++;
      } else {
        const result = await sql`
          INSERT INTO developers (
            name,
            logo,
            description,
            website,
            email,
            phone,
            project_count
          ) VALUES (
            ${dev.Company.name},
            ${dev.Company.logo || null},
            ${dev.Company.description || null},
            ${dev.Company.website || null},
            ${dev.Company.email || null},
            ${dev.Company.phone || null},
            ${dev.project_count || 0}
          )
          RETURNING id
        `;

        developerId = result[0].id;
        developerIdMap.set(dev.id, developerId);
        imported++;
      }
    } catch (error) {
      console.error(`Error importing developer ${dev.Company?.name}:`, error.message);
    }
  }

  console.log(`✓ Imported: ${imported} developers`);
  console.log(`⊘ Skipped: ${skipped} developers (already exist)`);
  
  return developerIdMap;
}

async function importProjects(sql, projects, developerIdMap) {
  console.log('\n💾 Importing projects into database...');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      if (!project.title) {
        skipped++;
        continue;
      }

      // Check if project already exists by title
      const existing = await sql`
        SELECT id FROM projects WHERE title = ${project.title}
      `;

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Map developer ID from old to new UUID
      let newDeveloperId = null;
      if (project.developer_id || (project.Company && project.Company.id)) {
        const oldDevId = project.developer_id || project.Company.id;
        newDeveloperId = developerIdMap.get(oldDevId) || null;
      }

      // Parse arrays if they're strings
      const parseArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [val];
          }
        }
        return [];
      };

      await sql`
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
        ) VALUES (
          ${project.title},
          ${project.address || null},
          ${project.city || null},
          ${project.category || null},
          ${parseArray(project.type)},
          ${parseArray(project.unit_types)},
          ${project.min_price || null},
          ${project.max_price || null},
          ${project.description || null},
          ${parseArray(project.amenities)},
          ${parseArray(project.images)},
          ${project.location_lat || project.lat || null},
          ${project.location_lng || project.lng || null},
          ${newDeveloperId},
          'active'
        )
      `;

      imported++;

      if (imported % 10 === 0) {
        console.log(`  ✓ Imported ${imported} projects...`);
      }
    } catch (error) {
      console.error(`Error importing project "${project.title}":`, error.message);
      errors++;
    }
  }

  console.log(`✓ Imported: ${imported} projects`);
  console.log(`⊘ Skipped: ${skipped} projects (already exist)`);
  console.log(`✗ Errors: ${errors} projects`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  DMD PROPERTIES - DATA MIGRATION SCRIPT');
  console.log('='.repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Step 1: Fetch data from external API
    const developers = await fetchAllDevelopers();
    const projects = await fetchAllProjects();

    // Step 2: Import developers first (projects reference developers)
    const developerIdMap = await importDevelopers(sql, developers);

    // Step 3: Import projects
    await importProjects(sql, projects, developerIdMap);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Verify the data in your database');
    console.log('  2. Test the API endpoints');
    console.log('  3. Update environment variables if needed');
    console.log('  4. Deploy to production\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
