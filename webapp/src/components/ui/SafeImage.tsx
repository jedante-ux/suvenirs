'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f3f4f6" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">Sin imagen</text></svg>`);

export function SafeImage({ src, alt, onError, className, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <span className="text-gray-400 text-xs">Sin imagen</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== PLACEHOLDER) {
          setImgSrc(PLACEHOLDER);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
