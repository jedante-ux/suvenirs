import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  Shield,
  RefreshCw,
  Ruler,
  Layers,
  Circle,
  Gift,
  Box,
  Scale,
  Hash,
  Square,
  ArrowUpDown,
  type LucideIcon,
} from 'lucide-react';
import { parseProductDescription } from '@/lib/utils';
import ProductActions from './ProductDetailClient';

// --- Data fetching ---

async function getProduct(slug: string) {
  const include = {
    category: { select: { name: true, slug: true, description: true, icon: true } },
    variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
    attributes: { orderBy: { sortOrder: 'asc' as const } },
  };
  let product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include,
  });
  if (!product) {
    product = await prisma.product.findFirst({
      where: { productId: slug, isActive: true },
      include,
    });
  }
  return product;
}

async function getRelatedProducts(product: { id: string; category: { slug: string } | null }) {
  const categorySlug = product.category?.slug;
  if (categorySlug) {
    const cat = await prisma.category.findFirst({ where: { slug: categorySlug }, select: { id: true } });
    if (cat) {
      const products = await prisma.product.findMany({
        where: { categoryId: cat.id, isActive: true, id: { not: product.id } },
        include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
        take: 4,
      });
      return products;
    }
  }
  const count = await prisma.product.count({ where: { isActive: true, id: { not: product.id } } });
  const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, count - 4)));
  return prisma.product.findMany({
    where: { isActive: true, id: { not: product.id } },
    include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
    take: 4,
    skip,
  });
}

// --- SEO: generateMetadata ---

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Producto no encontrado | Suvenirs' };
  }

  const categoryName = product.category?.name || 'Regalos Corporativos';
  const description = `${product.name} — ${categoryName}. Regalo corporativo personalizable con envío a todo Chile. Solicita tu cotización en Suvenirs.`;
  const imageUrl = product.images?.[0] && product.images[0] !== '/placeholder-product.jpg'
    ? product.images[0]
    : undefined;

  return {
    title: `${product.name} | Suvenirs`,
    description,
    keywords: `${product.name}, ${categoryName}, regalos corporativos, personalizable, chile, cotización`,
    openGraph: {
      title: `${product.name} | Suvenirs`,
      description,
      type: 'website',
      locale: 'es_CL',
      siteName: 'Suvenirs',
      ...(imageUrl && { images: [{ url: imageUrl, width: 800, height: 800, alt: product.name }] }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: `${product.name} | Suvenirs`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: {
      canonical: `https://suvenirs.vercel.app/productos/${product.slug || product.productId}`,
    },
  };
}

// --- Helpers ---

function getSpecIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('tamaño') || l.includes('dimensi')) return Ruler;
  if (l.includes('material')) return Layers;
  if (l.includes('argolla') || l.includes('diámetro')) return Circle;
  if (l.includes('presentación')) return Gift;
  if (l.includes('embalaje') || l.includes('caja')) return Box;
  if (l.includes('peso')) return Scale;
  if (l.includes('código')) return Hash;
  if (l.includes('placa')) return Square;
  if (l.includes('altura')) return ArrowUpDown;
  return Package;
}

function toClientProduct(p: any): Product {
  return {
    id: p.id,
    productId: p.productId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId ?? undefined,
    category: p.category ?? undefined,
    quantity: p.quantity,
    price: p.price ?? undefined,
    salePrice: p.salePrice ?? undefined,
    currency: p.currency,
    images: p.images || [],
    featured: p.featured,
    isActive: p.isActive,
    weight: p.weight,
    length: p.length,
    width: p.width,
    height: p.height,
    variants: p.variants?.map((v: any) => ({
      ...v,
      attributes: v.attributes ?? {},
    })) || [],
    attributes: p.attributes || [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// --- Page ---

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product);
  const parsed = parseProductDescription(product.description || '');
  const categoryName = product.category?.name || 'Sin categoría';
  const categorySlug = product.category?.slug;
  const clientProduct = toClientProduct(product);

  // JSON-LD structured data
  const mainImage = product.images?.[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: parsed.description || product.description,
    image: mainImage && mainImage !== '/placeholder-product.jpg' ? mainImage : undefined,
    sku: product.productId,
    brand: { '@type': 'Brand', name: 'Suvenirs' },
    category: categoryName,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Suvenirs' },
    },
  };

  // BreadcrumbList structured data
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://suvenirs.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: 'https://suvenirs.vercel.app/productos' },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen pt-20">
        {/* Product Detail */}
        <section className="py-12">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left: Image carousel + variant selectors + actions (client component) */}
              <ProductActions product={clientProduct} />

              {/* Right: Product Info */}
              <div className="space-y-6">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
                  <span>/</span>
                  <Link href="/productos" className="hover:text-foreground transition-colors">Productos</Link>
                  <span>/</span>
                  <span className="text-foreground">{product.name}</span>
                </nav>

                {/* Category */}
                <div>
                  {categorySlug ? (
                    <Link href={`/productos?category=${categorySlug}`}>
                      <Badge variant="outline" className="text-primary border-primary/20 text-sm px-4 py-1.5 hover:bg-primary/10 transition-colors cursor-pointer">
                        {categoryName}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary/20 text-sm px-4 py-1.5">
                      {categoryName}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {product.name}
                </h1>

                {/* Description */}
                {parsed.description && (
                  <div className="prose prose-gray max-w-none">
                    <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">
                      {parsed.description}
                    </p>
                  </div>
                )}

                {/* Specifications */}
                {parsed.specs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Especificaciones</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {parsed.specs.map((spec, index) => {
                        const IconComponent = getSpecIcon(spec.label);
                        return (
                          <div key={index} className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg">
                            <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs text-muted-foreground">{spec.label}</span>
                              <span className="text-sm font-medium truncate">{spec.value}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {parsed.recommendations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800">Recomendaciones</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {parsed.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700">{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">Envío a todo Chile</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">Calidad garantizada</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-full bg-primary/10">
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">Personalización</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-[#1F1F1F]">
            <div className="container">
              <h2 className="text-2xl font-bold mb-8 text-white">Productos relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((rp) => (
                  <Link key={rp.id} href={`/productos/${rp.slug || rp.productId}`}>
                    <div
                      className="group rounded-2xl bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 border border-white/10 hover:border-white/25 overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-white/10">
                          <Image
                            src={rp.images?.[0] || '/placeholder-product.jpg'}
                            alt={rp.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                      <div className="px-3 pb-3">
                        <h3 className="font-bold text-sm text-white mb-1 group-hover:text-pink-500 transition-colors line-clamp-1">
                          {rp.name}
                        </h3>
                        <p className="text-xs text-muted-foreground/70 line-clamp-1">
                          {rp.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-12">
          <div className="container">
            <div className="bg-[#1F1F1F] rounded-2xl p-8 md:p-12 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                ¿Necesitas una cotización personalizada?
              </h2>
              <p className="text-muted-foreground/50 mb-6 max-w-2xl mx-auto">
                Contáctanos para obtener precios especiales por volumen y opciones de personalización.
              </p>
              <Button asChild size="lg" className="bg-pink-500 hover:bg-pink-600">
                <Link href="/contacto">Solicitar cotización</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
