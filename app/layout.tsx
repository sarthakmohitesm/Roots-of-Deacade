import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Syne } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Temple of the Euforia Core — Ancient Mysteries Revealed",
  description: "An interactive cinematic experience exploring the ancient jungle ruins of the Euforia Core. Discover the deconstructed architectural mystery and primeval energy core.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#ededed] overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
        {children}
      </body>
    </html>
  );
}
