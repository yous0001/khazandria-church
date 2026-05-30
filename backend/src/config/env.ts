import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/khazandria_church",
  jwtSecret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),

  seedSuperAdminEmail:
    process.env.SEED_SUPERADMIN_EMAIL || "superadmin@khazandria.com",
  seedSuperAdminPassword: process.env.SEED_SUPERADMIN_PASSWORD || "Admin@12345",

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};
