import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/gestion/', '/api/', '/resumen-pedido', '/cotizacion/'],
      },
    ],
    sitemap: 'https://suvenirs.cl/sitemap.xml',
  };
}
