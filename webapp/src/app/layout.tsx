import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
      <body className={`${poppins.variable} antialiased`}>
        <CartProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}
