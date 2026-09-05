import { isAdminRequest } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { generateUniqueGuestSlug } from "@/lib/slug-helper";

export const dynamic = "force-dynamic";

interface GuestInput {
  name: string;
  category?: string;
  phone?: string;
  address?: string;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const defaultCategory = String(body.defaultCategory || "Tamu Undangan").trim() || "Tamu Undangan";
    let list: GuestInput[] = [];

    if (Array.isArray(body.guests)) {
      list = body.guests
        .map((item: Partial<GuestInput>) => ({
          name: String(item.name || "").trim(),
          category: String(item.category || defaultCategory).trim() || defaultCategory,
          phone: item.phone ? String(item.phone).trim() : undefined,
          address: item.address ? String(item.address).trim() : undefined,
        }))
        .filter((item: GuestInput) => item.name.length > 0);
    } else if (typeof body.text === "string") {
      const lines = body.text.split(/\r?\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const separator = line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
        if (separator) {
          const parts = line.split(separator).map((s: string) => s.trim());
          const name = parts[0] || "";
          if (!name) continue;
          const category = parts[1] || defaultCategory;
          const phone = parts[2] || undefined;
          const address = parts[3] || undefined;
          list.push({ name, category, phone, address });
        } else {
          list.push({ name: line, category: defaultCategory });
        }
      }
    }

    if (list.length === 0) {
      return Response.json({ message: "Tidak ada daftar tamu yang valid untuk diproses." }, { status: 422 });
    }

    const inserted: Array<{ id: number; name: string; slug: string; category: string; phone: string | null }> = [];

    for (const item of list) {
      const slug = await generateUniqueGuestSlug(item.name);
      const [row] = await query<{ id: number; name: string; slug: string; category: string; phone: string | null }>(
        `INSERT INTO guests (name, slug, category, phone, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING id, name, slug, category, phone`,
        [item.name, slug, item.category || defaultCategory, item.phone || null, item.address || null],
      );
      if (row) inserted.push(row);
    }

    return Response.json({
      success: true,
      count: inserted.length,
      guests: inserted,
    }, { status: 201 });
  } catch (error) {
    console.error("Error bulk inserting guests:", error);
    return Response.json({ message: "Gagal memproses pembuatan tamu massal." }, { status: 500 });
  }
}
