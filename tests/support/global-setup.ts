import { execSync } from "node:child_process";

/**
 * Prepare the dedicated test database once per run:
 * apply migrations (non-destructive `migrate deploy`) and reload demo seed data.
 * The seed only wipes data when SEED_FORCE=1, and this setup refuses any database not named *_test.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://farmtohome:farmtohome_dev@localhost:5432/farmtohome_test";
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith("_test")) throw new Error(`Refusing to prepare "${dbName}": test database names must end in _test.`);
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url, SEED_FORCE: "1", NODE_ENV: "test" };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
}
