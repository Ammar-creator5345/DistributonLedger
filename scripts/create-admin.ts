/**
 * One-off script to create or update an admin user.
 * Usage: npm run seed:admin -- admin@example.com "a-strong-password" "Admin Name"
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/db";
import { AdminUser } from "../models/AdminUser";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- "email" "password" ["name"]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await connectToDatabase();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), passwordHash, name },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`Admin user ready: ${user.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
