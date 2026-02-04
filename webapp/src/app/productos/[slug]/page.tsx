'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug, getProducts } from '@/lib/api';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import {
  ShoppingCart,
  Package,
  ArrowLeft,
  Check,
  Share2,
  Heart,
  Truck,
  Shield,
  RefreshCw,
  Loader2,
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
import { addSearchToHistory } from '@/lib/searchHistory';
import { parseProductDescription } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductBySlug(slug);

        if (!productData) {
          setNotFoundState(true);
          return;
        }

        setProduct(productData);

        // Save to search history for recommendations
        addSearchToHistory(productData.name);

        // Fetch related products (same category or random)
        const categorySlug = typeof productData.category === 'object'
          ? (productData.category as Category).slug
          : undefined;

        if (categorySlug) {
          const related = await getProducts({
            category: categorySlug,
            limit: 4,
          });
          // Filter out current product
          setRelatedProducts(
            related.data.filter((p) => p._id !== productData._id).slice(0, 4)
          );
        } else {
          const related = await getProducts({ limit: 5, random: true });
          setRelatedProducts(
            related.data.filter((p) => p._id !== productData._id).slice(0, 4)
          );
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem(product, quantity);
    setAddedToCart(true);

    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;

    addItem(product, quantity);
    openCart();
  };

  const getCategoryName = (): string => {
    if (!product?.category) return 'Sin categoría';
    if (typeof product.category === 'object') {
      return (product.category as Category).name;
    }
    return 'Sin categoría';
  };

  const getSpecIcon = (label: string): LucideIcon => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('tamaño') || lowerLabel.includes('dimensi')) return Ruler;
    if (lowerLabel.includes('material')) return Layers;
    if (lowerLabel.includes('argolla') || lowerLabel.includes('diámetro')) return Circle;
    if (lowerLabel.includes('presentación')) return Gift;
    if (lowerLabel.includes('embalaje') || lowerLabel.includes('caja')) return Box;
    if (lowerLabel.includes('peso')) return Scale;
    if (lowerLabel.includes('código')) return Hash;
    if (lowerLabel.includes('placa')) return Square;
    if (lowerLabel.includes('altura')) return ArrowUpDown;
    return Package;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFoundState || !product) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Producto no encontrado</h1>
          <p className="text-muted-foreground mb-8">
            El producto que buscas no existe o ha sido eliminado.
          </p>
          <Button asChild>
            <Link href="/productos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a productos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Product Detail */}
      <section className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <Image
                  src={product.image || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {product.featured && (
                  <Badge className="absolute top-4 left-4 bg-pink-500">
                    Destacado
                  </Badge>
                )}
                {product.quantity === 0 && (
                  <Badge className="absolute top-4 right-4 bg-red-500">
                    Sin Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Inicio
                </Link>
                <span>/</span>
                <Link href="/productos" className="hover:text-foreground transition-colors">
                  Productos
                </Link>
                <span>/</span>
                <span className="text-foreground">{product.name}</span>
              </nav>

              {/* Category */}
              <div>
                <Badge variant="outline" className="text-primary border-primary/20">
                  {getCategoryName()}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {product.name}
              </h1>

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-4">
                {/* Quantity Selector */}
                {product.quantity > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Cantidad:</label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setQuantity(Math.min(product.quantity, quantity + 1))
                      }
                      disabled={quantity >= product.quantity}
                    >
                      +
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0 || addedToCart}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Agregar al carrito
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                    onClick={handleBuyNow}
                    disabled={product.quantity === 0}
                  >
                    Cotizar ahora
                  </Button>
                </div>
              </div>

              {/* Product ID */}
              <p className="text-sm text-muted-foreground font-mono">
                SKU: {product.productId}
              </p>

              {/* Description */}
              {(() => {
                const parsed = parseProductDescription(product.description || '');
                return (
                  <>
                    {/* Main Description */}
                    <div className="prose prose-gray max-w-none">
                      <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">
                        {parsed.description}
                      </p>
                    </div>

                    {/* Specifications Table */}
                    {parsed.specs.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Especificaciones</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {parsed.specs.map((spec, index) => {
                            const IconComponent = getSpecIcon(spec.label);
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg"
                              >
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
                            <li key={index} className="text-sm text-blue-700">
                              {rec}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                );
              })()}

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
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  href={`/productos/${relatedProduct.slug}`}
                >
                  <div
                    className="group rounded-2xl bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
                    style={{
                      boxShadow: `
                        inset 2px -2px 4px 0 rgba(255, 255, 255, 0.5),
                        inset -2px 2px 4px 0 rgba(255, 255, 255, 0.1),
                        inset 1px -1px 2px 0 rgba(255, 255, 255, 0.3)
                      `,
                    }}
                  >
                    <div className="p-3">
                      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-white/10">
                        <Image
                          src={relatedProduct.image || '/placeholder-product.jpg'}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                    <div className="px-3 pb-3">
                      <h3 className="font-bold text-sm text-white mb-1 group-hover:text-pink-500 transition-colors line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {relatedProduct.description}
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
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Contáctanos para obtener precios especiales por volumen y opciones de personalización.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Link href="/contacto">Solicitar cotización</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
