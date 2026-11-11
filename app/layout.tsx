import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Sans_Thai } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// M17 (proposed): Chakra Petch for headings/prices, IBM Plex Sans Thai for body — both include Thai glyphs
const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin", "thai"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GEARAWAI — LEVEL UP YOUR GEAR",
    template: "%s | GEARAWAI",
  },
  description: "GEARAWAI ร้านค้าออนไลน์อุปกรณ์ Gaming Gear และอุปกรณ์ IT (โครงงานเพื่อการศึกษา)",
};

export const viewport: Viewport = {
  themeColor: "#0a0b1e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${chakra.variable} ${plexThai.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster theme="dark" position="top-right" duration={4000} visibleToasts={3} richColors closeButton />
      </body>
    </html>
  );
}
