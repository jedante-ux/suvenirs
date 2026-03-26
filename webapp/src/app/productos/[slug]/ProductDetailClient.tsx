'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, ProductAttribute } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { addSearchToHistory } from '@/lib/searchHistory';
import { ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Save to search history on mount
  if (typeof window !== 'undefined') {
    addSearchToHistory(product.name);
  }

  const attributes = product.attributes || [];
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Find matching variant based on selected attributes
  const selectedVariant = useMemo(() => {
    if (!hasVariants || Object.keys(selectedAttrs).length === 0) return null;
    return variants.find(v => {
      const vAttrs = v.attributes as Record<string, string>;
      return Object.entries(selectedAttrs).every(([key, val]) => vAttrs[key] === val);
    }) || null;
  }, [hasVariants, variants, selectedAttrs]);

  // Build images list: product images + variant image if selected
  const allImages = useMemo(() => {
    const imgs = [...(product.images || [])];
    if (selectedVariant?.image && !imgs.includes(selectedVariant.image)) {
      imgs.unshift(selectedVariant.image);
    }
    return imgs.length > 0 ? imgs : ['/placeholder-product.jpg'];
  }, [product.images, selectedVariant]);

  // When variant changes, show its image
  const handleAttrChange = (attrName: string, value: string) => {
    const newAttrs = { ...selectedAttrs, [attrName]: value };
    setSelectedAttrs(newAttrs);

    // Find variant for new selection and jump to its image
    const matchedVariant = variants.find(v => {
      const vAttrs = v.attributes as Record<string, string>;
      return Object.entries(newAttrs).every(([k, val]) => vAttrs[k] === val);
    });
    if (matchedVariant?.image) {
      const idx = allImages.indexOf(matchedVariant.image);
      if (idx === -1) {
        // Image will be added at index 0 after re-render
        setCurrentImageIndex(0);
      } else {
        setCurrentImageIndex(idx);
      }
    }
  };

  // Check if all required attributes are selected
  const allAttrsSelected = attributes.length === 0 || attributes.every(a => selectedAttrs[a.name]);
  const canAdd = !hasVariants || (allAttrsSelected && selectedVariant);

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Selecciona una opción para cada atributo');
      return;
    }
    addItem(product, quantity, selectedVariant);
    const label = selectedVariant
      ? Object.values(selectedVariant.attributes as Record<string, string>).join(' / ')
      : '';
    toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'}`, {
      description: label ? `${product.name} — ${label}` : product.name,
    });
  };

  const handleBuyNow = () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Selecciona una opción para cada atributo');
      return;
    }
    addItem(product, quantity, selectedVariant);
    router.push('/resumen-pedido');
  };

  const prevImage = () => setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setCurrentImageIndex(i => (i + 1) % allImages.length);

  return (
    <div className="space-y-6">
      {/* Image Carousel */}
      <div className="space-y-3">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
          <Image
            src={allImages[currentImageIndex]}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {product.featured && (
            <Badge className="absolute top-4 left-4 bg-pink-500">Destacado</Badge>
          )}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  i === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-border'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Variant Selectors */}
      {attributes.map((attr) => (
        <div key={attr.id} className="space-y-2">
          <label className="text-sm font-medium">
            {attr.name}
            {selectedAttrs[attr.name] && (
              <span className="text-primary ml-2">— {selectedAttrs[attr.name]}</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {attr.values.map((val) => {
              const isSelected = selectedAttrs[attr.name] === val;
              const isColor = attr.name.toLowerCase().includes('color');
              return (
                <button
                  key={val}
                  onClick={() => handleAttrChange(attr.name, val)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* SKU display */}
      <p className="text-sm text-muted-foreground font-mono">
        SKU: {selectedVariant?.sku || product.productId}
      </p>

      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Cantidad:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            aria-label="Cantidad"
            value={quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) setQuantity(v);
              else if (e.target.value === '') setQuantity(1);
            }}
            className="w-16 h-10 text-center text-base font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setQuantity(q => q + 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={!canAdd}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar al carrito
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={handleBuyNow}
          disabled={!canAdd}
        >
          Cotizar ahora
        </Button>
      </div>

      {hasVariants && !allAttrsSelected && (
        <p className="text-sm text-amber-600">Selecciona todas las opciones para agregar al carrito</p>
      )}
    </div>
  );
}
