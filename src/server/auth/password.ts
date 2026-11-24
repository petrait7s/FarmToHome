import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Used when a login targets an unknown account, so response timing does not reveal which accounts exist. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= bcrypt.hash("farmtohome-timing-guard", ROUNDS);
  await bcrypt.compare(plain, await dummyHash);
}
