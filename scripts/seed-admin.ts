import { db } from "../src/lib/db";
import { hash } from "bcrypt";

async function seedAdmin() {
  const adminEmail = "jaytraveler01@gmail.com";
  const adminPassword = "Hello1234";

  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("Admin account already exists, updating...");

      // Update to ensure admin role and enterprise subscription
      await db.user.update({
        where: { email: adminEmail },
        data: { role: "admin" },
      });

      await db.subscription.upsert({
        where: { userId: existingAdmin.id },
        update: {
          plan: "enterprise",
          messagesLimit: 999999,
          voiceMinutesLimit: 999999,
          messagesUsed: 0,
          voiceMinutesUsed: 0,
        },
        create: {
          userId: existingAdmin.id,
          plan: "enterprise",
          messagesLimit: 999999,
          voiceMinutesLimit: 999999,
        },
      });

      console.log("Admin account updated successfully!");
    } else {
      // Create new admin account
      const hashedPassword = await hash(adminPassword, 12);

      const admin = await db.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Admin",
          role: "admin",
          subscription: {
            create: {
              plan: "enterprise",
              messagesLimit: 999999,
              voiceMinutesLimit: 999999,
            },
          },
        },
        include: {
          subscription: true,
        },
      });

      console.log("Admin account created successfully!");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
      console.log("Plan:", admin.subscription?.plan);
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedAdmin();
