import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://llmlab.app";

const LOCALE_META: Record<string, { title: string; description: string; ogAlt: string }> = {
  en: {
    title: "LLM Lab — AI Training Simulator",
    description:
      "Experience the full lifecycle of training a Large Language Model — from dataset preparation to deployment — without expensive infrastructure.",
    ogAlt: "LLM Lab — Train your own AI model",
  },
  tr: {
    title: "LLM Lab — Yapay Zeka Eğitim Simülatörü",
    description:
      "Pahalı altyapıya gerek kalmadan veri hazırlığından dağıtıma kadar bir Büyük Dil Modelinin tam yaşam döngüsünü deneyimleyin.",
    ogAlt: "LLM Lab — Kendi yapay zeka modelini eğit",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale] ?? LOCALE_META.en;
  const ogImage = `/og-image-${locale}.png`;

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: meta.title,
      template: "%s | LLM Lab",
    },
    description: meta.description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: APP_URL,
      siteName: "LLM Lab",
      type: "website",
      locale: locale === "tr" ? "tr_TR" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider>{children}</TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
