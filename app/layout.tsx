import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Wedding of Ramazan & Dede",
  description: "Tasyakuran Pernikahan Ramazan & Dede",
  openGraph: { title: "The Wedding of Ramazan & Dede", description: "Dengan memohon Rahmat & Ridho Allah SWT, kami mengundang Anda untuk hadir.", images: ["/images/cartoon_couple_cover.webp"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
