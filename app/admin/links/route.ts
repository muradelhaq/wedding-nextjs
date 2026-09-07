import { isAdminRequest } from "@/lib/admin-auth";
import { resources, type AdminResource } from "@/lib/admin-resources";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  id: "ID", guest_id: "ID Tamu", guest_name: "Nama Tamu", name: "Nama",
  attendance: "Status Kehadiran", total_guest: "Jumlah Tamu", notes: "Catatan",
  category: "Kategori", phone: "Nomor Telepon", address: "Alamat", link: "Tautan Undangan",
  opened_status: "Status Undangan", message: "Ucapan", is_approved: "Disetujui",
  key: "Kunci", value: "Nilai", group: "Grup", type: "Tipe", title: "Judul",
  date_label: "Tanggal", description: "Deskripsi", image_path: "Lokasi Gambar",
  sort_order: "Urutan", file_path: "Lokasi File", media_type: "Jenis Media", is_featured: "Unggulan",
};

function cell(value: unknown) {
  const text = String(value ?? "").replace(/[\t\r\n]+/g, " ");
  // Keep user input as text when opened in spreadsheet software.
  return /^\s*[=+@-]/.test(text) || /^0\d+$/.test(text) ? "'" + text : text;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return new Response(null, { status: 302, headers: { Location: "/admin" } });
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "guests";
  if (!Object.hasOwn(resources, resource)) return Response.json({ message: "Not found" }, { status: 404 });
  const schema = resources[resource as AdminResource];
  let columns: string[] = ["id", ...schema.columns];
  let sql = `select * from ${resource} order by id desc`;
  if (resource === "guests") {
    columns = ["name", "category", "link", "phone", "address", "opened_status", "attendance", "total_guest", "notes"];
    sql = `select g.*, r.attendance, r.total_guest, r.notes from guests g
           left join rsvps r on r.guest_id = g.id order by g.id desc`;
  } else if (resource === "rsvps") {
    columns = ["id", "guest_id", "guest_name", "category", "phone", "address", "attendance", "total_guest", "notes"];
    sql = `select r.*, g.name as guest_name, g.category, g.phone, g.address from rsvps r
           left join guests g on g.id = r.guest_id order by r.id desc`;
  }
  const rows = await query<Record<string, unknown>>(sql);
  const attendance: Record<string, string> = { hadir: "Hadir", tidak_hadir: "Tidak Hadir", ragu: "Ragu-ragu" };
  const lines = rows.map(row => columns.map(column => {
    let value = row[column];
    if (column === "link") value = `${url.origin}/${row.slug}`;
    if (column === "opened_status") value = row.is_opened ? `Sudah Dibuka (${row.view_count || 1}x)` : "Belum Dibuka";
    if (column === "guest_name") value = value || "Tamu tidak ditemukan";
    if (column === "attendance") value = attendance[String(value)] || value;
    if (typeof value === "boolean") value = value ? "Ya" : "Tidak";
    return cell(value);
  }).join("\t"));
  const header = columns.map(column => labels[column] || column).join("\t");
  const filename = resource === "guests" ? "tautan-undangan" : resource === "rsvps" ? "daftar-rsvp" : resource;
  return new Response("\uFEFF" + [header, ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.tsv"`,
      "Cache-Control": "no-store",
    },
  });
}
