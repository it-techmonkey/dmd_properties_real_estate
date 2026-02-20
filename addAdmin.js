/**
 * Add Admin User Script
 * 
 * Usage: node addAdmin.js
 * Edit the credentials below before running
 */

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// ============================================
// EDIT THESE VALUES BEFORE RUNNING THE SCRIPT
// ============================================
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_NAME = 'Admin User';
// ============================================

async function addAdmin() {
  const email = ADMIN_EMAIL;
  const password = ADMIN_PASSWORD;
  const name = ADMIN_NAME;

  if (!email || !password) {
    console.error('\x1b[31mError: Please set ADMIN_EMAIL and ADMIN_PASSWORD in the script\x1b[0m');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('\x1b[31mError: DATABASE_URL not found in .env.local\x1b[0m');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Check if user already exists
    const existing = await sql`SELECT id, email, role FROM users WHERE email = ${email}`;
    
    if (existing.length > 0) {
      if (existing[0].role === 'ADMIN') {
        console.log(`\x1b[33mUser ${email} is already an admin.\x1b[0m`);
      } else {
        // Update existing user to admin
        await sql`UPDATE users SET role = 'ADMIN' WHERE email = ${email}`;
        console.log(`\x1b[32m✓ Updated ${email} to admin role.\x1b[0m`);
      }
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin user
    const result = await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${email}, ${name || null}, ${hashedPassword}, 'ADMIN')
      RETURNING id, email, name, role
    `;

    console.log('\x1b[32m✓ Admin user created successfully!\x1b[0m');
    console.log('\nUser details:');
    console.log(`  ID: ${result[0].id}`);
    console.log(`  Email: ${result[0].email}`);
    console.log(`  Name: ${result[0].name || '(not set)'}`);
    console.log(`  Role: ${result[0].role}`);
    console.log('\nYou can now login at /admin/login');

  } catch (error) {
    console.error('\x1b[31mError creating admin user:\x1b[0m', error.message);
    process.exit(1);
  }
}

addAdmin();
