import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kits Corporativos',
  description: 'Kits de regalos corporativos armados y listos para personalizar. Ideales para onboarding, eventos y reconocimientos. Cotiza online.',
  alternates: { canonical: '/kits' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
