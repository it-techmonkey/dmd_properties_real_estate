/**
 * Clean Seed Data from Database
 * 
 * This script removes the sample projects and developers that were seeded
 * during initial development. Run this before switching to Alnair API.
 * 
 * Usage: node scripts/clean-seed-data.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sampleProjectTitles = [
  'Azizi Riviera',
  'Downtown Views II',
  'Damac Hills Villas',
  'City Walk Apartments',
  'Palm Jumeirah Residences',
  'Marina Gate',
  'Arabian Ranches III',
  'Business Bay Tower',
];

const sampleDeveloperNames = [
  'Azizi Developments',
  'Emaar Properties',
  'Damac Properties',
  'Meraas Holding',
  'Nakheel',
];

async function cleanDatabase() {
  console.log('='.repeat(60));
  console.log('  CLEANING SEEDED DATA FROM DATABASE');
  console.log('='.repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Step 1: Delete sample projects
    console.log('\n🗑️  Deleting sample projects...');
    
    let deleted = 0;
    for (const title of sampleProjectTitles) {
      const result = await sql`
        DELETE FROM projects 
        WHERE title = ${title}
        RETURNING id
      `;
      
      if (result.length > 0) {
        console.log(`  ✓ Deleted: ${title}`);
        deleted++;
      }
    }
    
    console.log(`\n✓ Deleted: ${deleted} projects`);

    // Step 2: Delete sample developers
    console.log('\n🗑️  Deleting sample developers...');
    
    deleted = 0;
    for (const name of sampleDeveloperNames) {
      const result = await sql`
        DELETE FROM developers 
        WHERE name = ${name}
        RETURNING id
      `;
      
      if (result.length > 0) {
        console.log(`  ✓ Deleted: ${name}`);
        deleted++;
      }
    }
    
    console.log(`\n✓ Deleted: ${deleted} developers`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETED!');
    console.log('='.repeat(60));
    console.log('\nYour database is now clean and ready for Alnair API integration.\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
