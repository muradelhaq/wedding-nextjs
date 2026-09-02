import { saveRsvp } from "@/lib/db";

const allowedAttendance = new Set(["hadir", "tidak_hadir", "ragu"]);
const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, "").trim();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const guestName = clean(body.guest_name);
  const attendance = clean(body.attendance);
  const totalGuest = Number(body.total_guest);
  const notes = clean(body.notes) || null;
  if ((!body.guest_id && !guestName) || !allowedAttendance.has(attendance) || totalGuest < 1 || totalGuest > 10 || (notes?.length ?? 0) > 1000) {
    return Response.json({ message: "Data konfirmasi tidak valid." }, { status: 422 });
  }
  const data = await saveRsvp({ guestId: body.guest_id || null, guestName, attendance, totalGuest, notes });
  const messages: Record<string, string> = {
    hadir: "Terima kasih atas konfirmasi kehadiran Anda. Sampai jumpa di hari bahagia kami!",
    tidak_hadir: "Terima kasih atas konfirmasinya. Doa restu Anda sangat berarti bagi kami.",
    ragu: "Terima kasih telah mengonfirmasi. Kami tunggu kepastian kehadiran Anda.",
  };
  return Response.json({ status: "success", message: messages[attendance], data });
}
