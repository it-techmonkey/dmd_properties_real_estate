import sql from '../../../lib/db';
import { verifyPassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, name, password, role, phone
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
