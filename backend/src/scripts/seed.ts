import { connectDB } from "../config/db";
import { env } from "../config/env";
import { User } from "../modules/users/user.model";
import { authService } from "../modules/auth/auth.service";

const seed = async () => {
  try {
    console.log("Starting seed...");

    // Connect to database
    await connectDB();

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({
      email: env.seedSuperAdminEmail,
      role: "superadmin",
    });

    if (existingSuperadmin) {
      console.log(`⚠️  Superadmin already exists: ${env.seedSuperAdminEmail}`);
      console.log(
        "Skipping seed. Use a different email or delete existing user."
      );
      process.exit(0);
      return;
    }

    // Create superadmin
    console.log("Creating superadmin...");
    const passwordHash = await authService.hashPassword(
      env.seedSuperAdminPassword
    );
    const superadmin = await User.create({
      name: "yousef emad",
      email: env.seedSuperAdminEmail,
      passwordHash,
      phone: "01276085914",
      role: "superadmin",
    });
    console.log(`✓ Superadmin created: ${superadmin.email}`);

    console.log("\n✅ Seed completed successfully!\n");
    console.log("=== Login Credentials ===");
    console.log(`Email: ${env.seedSuperAdminEmail}`);
    console.log(`Password: ${env.seedSuperAdminPassword}`);
    console.log("========================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
