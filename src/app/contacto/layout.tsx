import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos para cotizar regalos corporativos personalizados. WhatsApp, email o visítanos en Ñuñoa, Santiago. Suvenirs Corporativos SPA.',
  alternates: { canonical: '/contacto' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
