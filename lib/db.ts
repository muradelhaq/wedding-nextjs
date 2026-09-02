import { Pool } from "pg";
import type { Guest, Wish } from "./types";

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;
const databaseConfig = connectionString
  ? { connectionString }
  : process.env.DB_HOST
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      }
    : null;
const pool = databaseConfig
  ? new Pool({ ...databaseConfig, ssl: { rejectUnauthorized: false }, max: 3 })
  : null;

export async function query<T>(text: string, values: unknown[] = []): Promise<T[]> {
  if (!pool) return [];
  const result = await pool.query(text, values);
  return result.rows as T[];
}

export async function getGuest(slug?: string): Promise<Guest> {
  if (!slug) return { id: null, name: "Tamu Undangan & Kerabat", slug: "", category: "Tamu Kehormatan" };
  const rows = await query<Guest & { attendance?: string; total_guest?: number; notes?: string }>(
    `select g.*, r.attendance, r.total_guest, r.notes from guests g left join rsvps r on r.guest_id=g.id where g.slug=$1 limit 1`, [slug]
  );
  if (!rows[0]) return { id: null, name: "", slug };
  await query(`update guests set is_opened=true, opened_at=coalesce(opened_at, now()), view_count=coalesce(view_count,0)+1, updated_at=now() where id=$1`, [rows[0].id]);
  return rows[0];
}

export async function getWishes(page = 1): Promise<{ data: Wish[]; total: number; pages: number }> {
  const [{ count = "0" } = { count: "0" }] = await query<{ count: string }>(`select count(*)::text count from guestbooks where is_approved=true`);
  const rows = await query<{ id:number; name:string; message:string; created_at:string }>(`select id,name,message,created_at from guestbooks where is_approved=true order by id desc limit 5 offset $1`, [(page - 1) * 5]);
  const total = Number(count);
  return { data: rows.map(x => ({ ...x, time_ago: relativeTime(x.created_at) })), total, pages: Math.max(1, Math.ceil(total / 5)) };
}

export async function createWish(input: { guestId: number | null; name: string; message: string }) {
  const [wish] = await query<{ id: number; name: string; message: string; created_at: string }>(
    `insert into guestbooks (guest_id,name,message,is_approved,created_at,updated_at)
     values ($1,$2,$3,true,now(),now()) returning id,name,message,created_at`,
    [input.guestId, input.name, input.message],
  );
  return wish ? { ...wish, time_ago: "Baru saja" } : null;
}

export async function saveRsvp(input: {
  guestId: number | null;
  guestName: string;
  attendance: string;
  totalGuest: number;
  notes: string | null;
}) {
  let guestId = input.guestId;
  if (!guestId) {
    const baseSlug = input.guestName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug || "tamu"}-${Date.now().toString(36)}`;
    const [guest] = await query<{ id: number }>(
      `insert into guests (name,slug,category,is_opened,opened_at,view_count,created_at,updated_at)
       values ($1,$2,'Umum (RSVP)',true,now(),0,now(),now()) returning id`,
      [input.guestName, slug],
    );
    guestId = guest?.id ?? null;
  }
  if (!guestId) throw new Error("Guest could not be created");
  const [rsvp] = await query(
    `insert into rsvps (guest_id,attendance,total_guest,notes,created_at,updated_at)
     values ($1,$2,$3,$4,now(),now())
     on conflict (guest_id) do update set attendance=excluded.attendance,total_guest=excluded.total_guest,notes=excluded.notes,updated_at=now()
     returning *`,
    [guestId, input.attendance, input.totalGuest, input.notes],
  );
  return rsvp;
}

function relativeTime(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
  return `${Math.floor(seconds / 86400)} hari yang lalu`;
}
