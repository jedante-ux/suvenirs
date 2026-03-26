import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productos — Regalos Corporativos',
  description: 'Explora nuestro catálogo de regalos corporativos, trofeos, copas, merchandising y artículos promocionales personalizables. Envío a todo Chile.',
  alternates: { canonical: '/productos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
