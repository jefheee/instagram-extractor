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
      <body className={`${hanken.className} ${jetbrains.variable} antialiased min-h-screen bg-surface text-on-surface flex flex-col`}>
        <LanguageProvider>
          <Navbar />
          <div className="flex-1 flex flex-col relative pt-16">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
