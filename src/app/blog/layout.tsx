import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, tendencias y novedades en regalos corporativos, merchandising y reconocimientos empresariales.',
  alternates: { canonical: '/blog' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
