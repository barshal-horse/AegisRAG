import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AegisRAG // Zero-Trust Push-Down ReBAC Vector Proxy",
  description: "Enterprise Zero-Trust RAG Security Cockpit demonstrating Push-Down Pre-Filtering and Reversible PII Token Vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-text-primary font-sans antialiased min-h-screen selection:bg-accent/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
