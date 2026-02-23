/**
 * Seed Database with Sample Data
 * 
 * This script adds sample developers and projects to test the system
 * when the external API is unavailable.
 * 
 * Usage: node scripts/seed-sample-data.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sampleDevelopers = [
  {
    name: 'Azizi Developments',
    logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200',
    description: 'Award-winning property developer in Dubai',
    website: 'https://azizidevelopments.com',
    email: 'info@azizidevelopments.com',
    phone: '+971 4 123 4567',
  },
  {
    name: 'Emaar Properties',
    logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200',
    description: 'Leading real estate developer in the Middle East',
    website: 'https://emaar.com',
    email: 'contact@emaar.com',
    phone: '+971 4 234 5678',
  },
  {
    name: 'Damac Properties',
    logo: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=200',
    description: 'Luxury property developer',
    website: 'https://damacproperties.com',
    email: 'info@damacproperties.com',
    phone: '+971 4 345 6789',
  },
  {
    name: 'Meraas Holding',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200',
    description: 'Dubai-based holding company',
    website: 'https://meraas.com',
    email: 'contact@meraas.com',
    phone: '+971 4 456 7890',
  },
  {
    name: 'Nakheel',
    logo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200',
    description: 'Master developer shaping Dubai',
    website: 'https://nakheel.com',
    email: 'info@nakheel.com',
    phone: '+971 4 567 8901',
  },
];

const sampleProjects = [
  {
    title: 'Azizi Riviera',
    address: 'Meydan, Dubai',
    city: 'Dubai',
    category: 'Off_plan',
    type: ['Apartment'],
    unit_types: ['Studio', 'One', 'Two', 'Three'],
    min_price: 450000,
    max_price: 1200000,
    description: 'A stunning waterfront development featuring over 16,000 residences with French Mediterranean-inspired architecture.',
    amenities: ['Swimming Pool', 'Gym', 'Retail Outlets', 'Kids Play Area', 'BBQ Area', 'Lagoon', 'Running Track'],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    location_lat: 25.1823,
    location_lng: 55.2563,
  },
  {
    title: 'Downtown Views II',
    address: 'Downtown Dubai',
    city: 'Dubai',
    category: 'Ready',
    type: ['Apartment'],
    unit_types: ['One', 'Two', 'Three'],
    min_price: 850000,
    max_price: 2500000,
    description: 'Luxury apartments with views of Burj Khalifa and Dubai Fountain in the heart of Downtown Dubai.',
    amenities: ['Swimming Pool', 'Gym', 'Concierge', 'Valet Parking', 'Retail', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1565008576049-7a9200a3d3d6?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    location_lat: 25.1972,
    location_lng: 55.2744,
  },
  {
    title: 'Damac Hills Villas',
    address: 'Damac Hills, Dubai',
    city: 'Dubai',
    category: 'Ready',
    type: ['Villa', 'Townhouse'],
    unit_types: ['Three', 'Four', 'Five'],
    min_price: 1800000,
    max_price: 4500000,
    description: 'Premium villas and townhouses in a golf community with world-class amenities.',
    amenities: ['Golf Course', 'Swimming Pool', 'Tennis Courts', 'Spa', 'Kids Play Area', 'Retail', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    location_lat: 25.0558,
    location_lng: 55.2094,
  },
  {
    title: 'City Walk Apartments',
    address: 'Al Wasl, Dubai',
    city: 'Dubai',
    category: 'Ready',
    type: ['Apartment'],
    unit_types: ['One', 'Two', 'Three', 'Four'],
    min_price: 950000,
    max_price: 3200000,
    description: 'Urban living at its finest with retail, dining, and entertainment at your doorstep.',
    amenities: ['Shopping Mall', 'Cinema', 'Restaurants', 'Gym', 'Pool', 'Parks', 'Kids Area'],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
    ],
    location_lat: 25.2238,
    location_lng: 55.2588,
  },
  {
    title: 'Palm Jumeirah Residences',
    address: 'Palm Jumeirah, Dubai',
    city: 'Dubai',
    category: 'Ready',
    type: ['Apartment', 'Villa'],
    unit_types: ['Two', 'Three', 'Four', 'Five'],
    min_price: 2500000,
    max_price: 15000000,
    description: 'Exclusive beachfront living on the iconic Palm Jumeirah island.',
    amenities: ['Private Beach', 'Swimming Pool', 'Spa', 'Gym', 'Concierge', 'Valet', 'Marina'],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ],
    location_lat: 25.1124,
    location_lng: 55.1390,
  },
  {
    title: 'Marina Gate',
    address: 'Dubai Marina',
    city: 'Dubai',
    category: 'Off_plan',
    type: ['Apartment'],
    unit_types: ['Studio', 'One', 'Two', 'Three'],
    min_price: 750000,
    max_price: 2800000,
    description: 'Twin towers offering stunning marina and sea views with luxury amenities.',
    amenities: ['Infinity Pool', 'Gym', 'Spa', 'Yoga Studio', 'Kids Club', 'Retail', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=800',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
    ],
    location_lat: 25.0872,
    location_lng: 55.1396,
  },
  {
    title: 'Arabian Ranches III',
    address: 'Arabian Ranches, Dubai',
    city: 'Dubai',
    category: 'Off_plan',
    type: ['Villa', 'Townhouse'],
    unit_types: ['Three', 'Four', 'Five'],
    min_price: 1400000,
    max_price: 3500000,
    description: 'Family-friendly community with spacious villas and townhouses surrounded by greenery.',
    amenities: ['Golf Course', 'Polo Club', 'Swimming Pool', 'Parks', 'Schools', 'Retail', 'Healthcare'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ],
    location_lat: 25.0553,
    location_lng: 55.2632,
  },
  {
    title: 'Business Bay Tower',
    address: 'Business Bay, Dubai',
    city: 'Dubai',
    category: 'Ready',
    type: ['Apartment'],
    unit_types: ['Studio', 'One', 'Two'],
    min_price: 650000,
    max_price: 1800000,
    description: 'Modern apartments in Dubai\'s bustling business district with canal views.',
    amenities: ['Swimming Pool', 'Gym', 'Sauna', 'Steam Room', 'Retail', 'Parking', 'Security'],
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800',
    ],
    location_lat: 25.1881,
    location_lng: 55.2663,
  },
];

async function seedDatabase() {
  console.log('='.repeat(60));
  console.log('  SEEDING DATABASE WITH SAMPLE DATA');
  console.log('='.repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Step 1: Insert sample developers
    console.log('\n💾 Inserting sample developers...');
    
    const developerIds = [];
    for (const dev of sampleDevelopers) {
      const result = await sql`
        INSERT INTO developers (name, logo, description, website, email, phone)
        VALUES (${dev.name}, ${dev.logo}, ${dev.description}, ${dev.website}, ${dev.email}, ${dev.phone})
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      
      if (result.length > 0) {
        developerIds.push(result[0].id);
        console.log(`  ✓ Added: ${dev.name}`);
      } else {
        // Developer already exists, get the ID
        const existing = await sql`SELECT id FROM developers WHERE name = ${dev.name}`;
        if (existing.length > 0) {
          developerIds.push(existing[0].id);
          console.log(`  ⊘ Exists: ${dev.name}`);
        }
      }
    }

    console.log(`\n✓ Developers ready: ${developerIds.length}`);

    // Step 2: Insert sample projects
    console.log('\n💾 Inserting sample projects...');
    
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < sampleProjects.length; i++) {
      const project = sampleProjects[i];
      // Assign developer in round-robin fashion
      const developerId = developerIds[i % developerIds.length];

      const existing = await sql`SELECT id FROM projects WHERE title = ${project.title}`;
      
      if (existing.length > 0) {
        console.log(`  ⊘ Exists: ${project.title}`);
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO projects (
          title, address, city, category, type, unit_types,
          min_price, max_price, description, amenities, images,
          location_lat, location_lng, developer_id, status
        ) VALUES (
          ${project.title},
          ${project.address},
          ${project.city},
          ${project.category},
          ${project.type},
          ${project.unit_types},
          ${project.min_price},
          ${project.max_price},
          ${project.description},
          ${project.amenities},
          ${project.images},
          ${project.location_lat},
          ${project.location_lng},
          ${developerId},
          'active'
        )
      `;

      console.log(`  ✓ Added: ${project.title}`);
      inserted++;
    }

    console.log(`\n✓ Inserted: ${inserted} projects`);
    console.log(`⊘ Skipped: ${skipped} projects (already exist)`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SAMPLE DATA SEEDING COMPLETED!');
    console.log('='.repeat(60));
    console.log('\nYou can now:');
    console.log('  1. Test the API at http://localhost:3000/api/projects');
    console.log('  2. View the frontend at http://localhost:3000');
    console.log('  3. Access admin panel at http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
