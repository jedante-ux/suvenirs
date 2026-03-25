'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = '/placeholder-product.jpg';

export function SafeImage({ src, alt, onError, className, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(PLACEHOLDER)}
    />
  );
}
