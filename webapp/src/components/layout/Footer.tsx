'use client';

import React from 'react';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedInIcon, MailIcon, PhoneIcon, LocationIcon } from '../icons';

const footerLinks = {
  productos: [
    { name: 'Catálogo', href: '/productos' },
    { name: 'Categorías', href: '/categorias' },
  ],
  empresa: [
    { name: 'Nosotros', href: '/nosotros' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contacto', href: '/contacto' },
  ],
  ayuda: [
    { name: 'Pagos y entregas', href: '/pagos-entregas' },
    { name: 'Política de devoluciones', href: '/devoluciones' },
    { name: 'Preguntas frecuentes', href: '/faq' },
    { name: 'Términos y condiciones', href: '/terminos' },
  ],
};

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { name: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { name: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedInIcon },
];

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-white py-[75px]">
      {/* Main footer content */}
      <div className="container pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-white">Suvenirs</span>
            </Link>
            <p className="mt-4 text-gray-300 max-w-md">
              Tu socio corporativo líder en grabados, regalos y reconocimientos.
              Transformamos tus ideas en regalos personalizados únicos.
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-3">
              <a href="mailto:contacto@suvenirs.cl" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <MailIcon size={18} className="mr-3" />
                contacto@suvenirs.cl
              </a>
              <a href="tel:+56912345678" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <PhoneIcon size={18} className="mr-3" />
                +56 9 1234 5678
              </a>
              <div className="flex items-start text-gray-300">
                <LocationIcon size={18} className="mr-3 mt-1 flex-shrink-0" />
                <span>Santiago, Chile</span>
              </div>
            </div>
          </div>

          {/* Products column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-500">Productos</h3>
            <ul className="space-y-3">
              {footerLinks.productos.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-500">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-500">Ayuda</h3>
            <ul className="space-y-3">
              {footerLinks.ayuda.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Suvenirs. Todos los derechos reservados.
            </p>

            {/* Social links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-all"
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
