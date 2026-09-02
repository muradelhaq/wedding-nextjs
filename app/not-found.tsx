import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-card">
        <strong>404</strong>
        <h1>Undangan Tidak Ditemukan</h1>
        <p>
          Mohon maaf, tautan undangan personal yang Anda tuju tidak terdaftar
          atau telah dipindahkan.
        </p>
        <Link href="/">Buka Undangan Umum</Link>
      </div>
    </main>
  );
}
