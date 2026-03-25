import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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
  title: "Suvenirs - Regalos Corporativos y Grabados Personalizados",
  description: "Tu socio corporativo líder en grabados, regalos y reconocimientos. Transformamos tus ideas en regalos personalizados únicos.",
  keywords: "regalos corporativos, grabados personalizados, regalos empresariales, reconocimientos, gifts chile",
  openGraph: {
    title: "Suvenirs - Regalos Corporativos Premium",
    description: "Transformamos tus ideas en regalos personalizados únicos",
    locale: "es_CL",
    type: "website",
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
        <script dangerouslySetInnerHTML={{ __html: `
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
        `}} />
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
