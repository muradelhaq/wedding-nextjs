import { isAdminRequest } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return new Response(null, { status: 302, headers: { Location: "/admin" } });
  const guests = await query<{ name: string; slug: string; category: string | null; phone: string | null; is_opened: boolean | null; view_count: number | null }>(
    `select name, slug, category, phone, is_opened, view_count from guests order by id desc`,
  );
  const origin = new URL(request.url).origin;
  const lines = guests.map((guest) => {
    const link = `${origin}/${guest.slug}`;
    const status = guest.is_opened ? `Sudah Dibuka (${guest.view_count || 1}x)` : "Belum Dibuka";
    return [
      guest.name,
      guest.category || "Tamu Undangan",
      link,
      guest.phone || "",
      status,
    ].join("\t");
  });

  const header = "Nama\tKategori\tTautan Undangan\tNomor Telepon\tStatus Undangan";
  return new Response([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename=tautan-undangan-${new Date().toISOString().slice(0, 10)}.tsv`,
    },
  });
}
