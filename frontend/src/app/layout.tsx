import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Playlist Generator — Deezer",
  description: "Generate AI-powered playlists enriched with Deezer album art and previews",
  icons: {
    icon: "https://cdn-files.dzcdn.net/cache/images/common/favicon/favicon-240x240.bb3a6a29ad16a77f10cb.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#A238FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
