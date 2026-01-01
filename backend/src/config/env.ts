import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/khazandria_church',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  
  // Seed data
  seedSuperAdminEmail: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@khazandria.com',
  seedSuperAdminPassword: process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@12345',
};

// Validate required env vars
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('Warning: JWT_SECRET not set in production!');
}

