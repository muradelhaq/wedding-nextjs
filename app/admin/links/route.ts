import { isAdminRequest } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return new Response(null, { status: 302, headers: { Location: "/admin" } });
  const guests = await query<{ name: string; slug: string; phone: string | null }>(`select name,slug,phone from guests order by name`);
  const origin = new URL(request.url).origin;
  const lines = guests.map((guest) => `${guest.name}\t${origin}/${guest.slug}\t${guest.phone || ""}`);
  return new Response(["Nama\tTautan Undangan\tTelepon", ...lines].join("\n"), { headers: { "Content-Type": "text/tab-separated-values; charset=utf-8", "Content-Disposition": "attachment; filename=tautan-undangan.tsv" } });
}
