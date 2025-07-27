import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Ficha Digital de RPG',
  description: 'Sistema para digitalização de fichas de RPG - Uso em sessões presenciais',
  keywords: ['RPG', 'ficha', 'digital', 'personagem', 'aventura'],
  authors: [{ name: 'RPG Digital Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
