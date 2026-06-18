import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstaVault | Instagram Media Downloader",
  description: "Next.js wrapper para extração em lote do Instagram via Instaloader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${hanken.className} ${jetbrains.variable} antialiased h-screen w-screen overflow-hidden flex flex-col bg-background text-on-surface`}>
        <LanguageProvider>
          <Navbar />
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
