import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { Toaster } from "@/components/ui/sonner";
import GlitterCursor from "@/components/effects/GlitterCursor";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://suvenirs.cl"),
  title: {
    default: "Suvenirs - Regalos Corporativos y Grabados Personalizados",
    template: "%s | Suvenirs",
  },
  description: "Tu socio corporativo líder en grabados, regalos y reconocimientos. Transformamos tus ideas en regalos personalizados únicos. Envío a todo Chile.",
  keywords: "regalos corporativos, grabados personalizados, regalos empresariales, reconocimientos, trofeos, copas, merchandising, chile",
  authors: [{ name: "Suvenirs Corporativos SPA" }],
  openGraph: {
    title: "Suvenirs - Regalos Corporativos Premium",
    description: "Transformamos tus ideas en regalos personalizados únicos. Envío a todo Chile.",
    locale: "es_CL",
    type: "website",
    siteName: "Suvenirs",
    url: "https://suvenirs.cl",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suvenirs - Regalos Corporativos Premium",
    description: "Transformamos tus ideas en regalos personalizados únicos.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: "https://suvenirs.cl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N1JWT23MNW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N1JWT23MNW');
          `}
        </Script>
        <Script id="chunk-error-handler" strategy="afterInteractive">
          {`
            window.addEventListener('error', function(e) {
              if (e.message && (
                e.message.includes('Loading chunk') ||
                e.message.includes('Failed to fetch dynamically imported module') ||
                e.message.includes('Importing a module script failed') ||
                e.message.includes('ChunkLoadError')
              )) {
                window.location.reload();
              }
            });
          `}
        </Script>
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <CartProvider>
          <GlitterCursor />
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster richColors position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  );
}
