import { readFile } from "node:fs/promises";
import path from "node:path";
import { getGuest } from "@/lib/db";

const genericGuest = {
  id: null,
  name: "Tamu Undangan & Kerabat",
  slug: "",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function invitationResponse(slug?: string) {
  const guest = slug ? await getGuest(slug) : genericGuest;

  if (slug && !guest.name) {
    return new Response(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Undangan Tidak Ditemukan</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f7f4;color:#233327;font-family:'Plus Jakarta Sans',sans-serif}.card{width:min(460px,100%);padding:48px 32px;text-align:center;background:#fff;border:2px solid #d5e2d7;border-radius:28px;box-shadow:0 20px 60px rgba(35,51,39,.12)}strong{display:block;font:700 72px/1 'Playfair Display',serif;color:#6f9575}h1{font:700 28px/1.3 'Playfair Display',serif;margin:16px 0 12px}p{color:#526356;line-height:1.7;margin:0 0 28px}a{display:inline-block;padding:13px 24px;border-radius:999px;background:#57795c;color:#fff;text-decoration:none;font-weight:600}</style></head><body><main class="card"><strong>404</strong><h1>Undangan Tidak Ditemukan</h1><p>Mohon maaf, tautan undangan personal yang Anda tuju tidak terdaftar atau telah dipindahkan.</p><a href="/">Buka Undangan Umum</a></main></body></html>`, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const template = await readFile(
    path.join(process.cwd(), "public", "invitation-template.html"),
    "utf8",
  );
  const escapedName = escapeHtml(guest.name);
  const html = template
    .replaceAll("Tamu Undangan &amp; Kerabat", escapedName)
    .replaceAll("guestId: null", `guestId: ${guest.id ?? "null"}`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
