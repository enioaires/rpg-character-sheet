import type { Metadata } from "next";
import {
  Barlow,
  Barlow_Semi_Condensed,
  JetBrains_Mono,
  Spectral,
} from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner"

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  variable: "--font-barlow-semi-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: 'Ficha Digital Obziammos',
  description: 'Sistema para digitalização de fichas do RPG Obziammos - Uso em sessões presenciais',
  keywords: ['RPG', 'ficha', 'digital', 'personagem', 'aventura'],
  authors: [{ name: 'Enio Aires' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${barlow.variable} ${spectral.variable} ${barlowSemiCondensed.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <main className="min-h-screen bg-background">
              {children}
            </main>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
