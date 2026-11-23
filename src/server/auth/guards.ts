import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(code);
  }
}

/** For pages: redirect anonymous visitors to login and come back afterwards. */
export async function requireUserPage(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For staff pages: anonymous → login; customers get a 404 so the admin area is not advertised. */
export async function requireStaffPage(next = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  if (user.role !== "STAFF" && user.role !== "ADMIN") notFound();
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireStaffPage();
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** For server actions and route handlers: throw instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "STAFF" && user.role !== "ADMIN") throw new AuthError("forbidden");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("forbidden");
  return user;
}

export function isStaff(user: SessionUser | null): boolean {
  return !!user && (user.role === "STAFF" || user.role === "ADMIN");
}
