import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const titles: Record<string, string> = {
  fr: 'Générateur de QR Codes Gratuit — QR by Traaaction',
  en: 'Free QR Code Generator — QR by Traaaction',
  es: 'Generador de Códigos QR Gratis — QR by Traaaction',
};

const descriptions: Record<string, string> = {
  fr: 'Créez des QR codes personnalisés gratuitement. Texte, contacts, logos, couleurs — téléchargez en PNG ou SVG. Un outil par traaaction.com.',
  en: 'Create custom QR codes for free. Text, contacts, logos, colors — download as PNG or SVG. A tool by traaaction.com.',
  es: 'Crea códigos QR personalizados gratis. Texto, contactos, logos, colores — descarga en PNG o SVG. Una herramienta de traaaction.com.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL('https://qr.traaaction.com'),
    title: {
      default: titles[locale] || titles.en,
      template: '%s | QR by Traaaction',
    },
    description: descriptions[locale] || descriptions.en,
    openGraph: {
      type: 'website',
      siteName: 'QR by Traaaction',
      locale,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'QR by Traaaction' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-image.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
