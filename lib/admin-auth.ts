import { createHmac, timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";

const COOKIE_NAME = "wedding_admin";
const secret = process.env.APP_KEY || process.env.ADMIN_SECRET || "wedding-admin";

function signature(value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminCookie(userId: number) {
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const value = `${userId}.${expires}`;
  return `${COOKIE_NAME}=${value}.${signature(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`;
}

export function isAdminRequest(request: Request) {
  const raw = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`))?.[1];
  if (!raw) return false;
  const [userId, expires, provided] = raw.split(".");
  if (!userId || !expires || !provided || Number(expires) < Date.now()) return false;
  const expected = signature(`${userId}.${expires}`);
  return provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function verifyAdmin(email: string, password: string) {
  const [user] = await query<{ id: number }>(
    `select id from users where lower(email)=lower($1) and (password=crypt($2,password) or replace(password,'$2y$','$2a$')=crypt($2,replace(password,'$2y$','$2a$'))) limit 1`,
    [email, password],
  );
  return user ?? null;
}
