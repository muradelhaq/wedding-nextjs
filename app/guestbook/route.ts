import { createWish, getWishes } from "@/lib/db";

export const dynamic = "force-dynamic";

const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, "").trim();

export async function GET(request: Request) {
  const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1);
  const result = await getWishes(page);
  return Response.json({
    current_page: page,
    last_page: result.pages,
    total: result.total,
    per_page: 5,
    data: result.data,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = clean(body.name);
  const message = clean(body.message);
  if (!name || name.length > 255 || message.length < 3 || message.length > 1000) {
    return Response.json({ message: "Data ucapan tidak valid." }, { status: 422 });
  }
  const data = await createWish({ guestId: body.guest_id || null, name, message });
  return Response.json({
    status: "success",
    message: "Ucapan dan doa restu Anda berhasil dikirimkan. Terima kasih!",
    data,
  });
}
