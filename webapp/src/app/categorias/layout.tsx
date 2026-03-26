import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Encuentra regalos corporativos por categoría: bolígrafos, mochilas, tazones, llaveros, trofeos, copas y más. Personaliza con tu marca.',
  alternates: { canonical: '/categorias' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
