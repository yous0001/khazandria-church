import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { User } from "./modules/users/user.model";
import { authService } from "./modules/auth/auth.service";

const seedSuperAdmin = async () => {
  try {
    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({
      email: env.seedSuperAdminEmail,
      role: "superadmin",
    });

    if (existingSuperadmin) {
      console.log(`⚠️  Superadmin already exists: ${env.seedSuperAdminEmail}`);
      return;
    }

    // Create superadmin
    console.log("Creating superadmin...");
    const passwordHash = await authService.hashPassword(
      env.seedSuperAdminPassword
    );
    const superadmin = await User.create({
      name: "Super Admin",
      email: env.seedSuperAdminEmail,
      passwordHash,
      phone: "01276085914",
      role: "superadmin",
    });
    console.log(`✓ Superadmin created: ${superadmin.email}`);
    console.log(`Email: ${env.seedSuperAdminEmail}`);
    console.log(`Password: ${env.seedSuperAdminPassword}`);
  } catch (error) {
    console.error("Seed error:", error);
    // Don't exit on seed error, just log it
  }
};

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Run seed to create superadmin if it doesn't exist
    await seedSuperAdmin();

    // Start server
    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
