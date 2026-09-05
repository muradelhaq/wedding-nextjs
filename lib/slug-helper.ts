import { query } from "./db";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueGuestSlug(name: string, customSlug?: string, excludeId?: number): Promise<string> {
  const base = slugify(customSlug || name) || "tamu";
  let candidate = base;
  let counter = 1;

  while (true) {
    const rows = excludeId
      ? await query<{ id: number }>(`SELECT id FROM guests WHERE slug = $1 AND id != $2 LIMIT 1`, [candidate, excludeId])
      : await query<{ id: number }>(`SELECT id FROM guests WHERE slug = $1 LIMIT 1`, [candidate]);

    if (rows.length === 0) {
      return candidate;
    }
    counter++;
    candidate = `${base}-${counter}`;
  }
}
