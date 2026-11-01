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
import { Check, CloudOff, Info, LoaderCircle, RefreshCw } from "lucide-react"

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
            <Toaster
              position="top-center"
              richColors
              style={
                {
                  "--normal-bg": "var(--popover)",
                  "--normal-text": "var(--popover-foreground)",
                  "--normal-border": "var(--border)",
                  "--success-bg": "var(--popover)",
                  "--success-text": "var(--popover-foreground)",
                  "--success-border": "var(--border)",
                  "--info-bg": "var(--popover)",
                  "--info-text": "var(--popover-foreground)",
                  "--info-border": "var(--border)",
                  "--warning-bg": "var(--popover)",
                  "--warning-text": "var(--popover-foreground)",
                  "--warning-border": "var(--warning)",
                  "--error-bg": "var(--popover)",
                  "--error-text": "var(--popover-foreground)",
                  "--error-border": "var(--destructive)",
                  "--border-radius": "var(--radius)",
                } as React.CSSProperties
              }
              icons={{
                success: <Check className="size-5 text-success" aria-hidden="true" />,
                error: <CloudOff className="size-5 text-destructive" aria-hidden="true" />,
                warning: (
                  <RefreshCw
                    className="size-5 animate-[ficha-spin_1.2s_linear_infinite] text-warning"
                    aria-hidden="true"
                  />
                ),
                info: <Info className="size-5 text-muted-foreground" aria-hidden="true" />,
                loading: (
                  <LoaderCircle
                    className="size-5 animate-ficha-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ),
              }}
              toastOptions={{
                classNames: {
                  toast: "items-start! gap-3! p-3.5! shadow-lg! font-sans!",
                  title: "text-[15px]! font-semibold! leading-snug!",
                  description: "text-sm! text-muted-foreground!",
                  icon: "size-5!",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
