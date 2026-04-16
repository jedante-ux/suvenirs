'use client';

import { useEffect } from 'react';

export default function DynamicTheme() {
  useEffect(() => {
    fetch('/api/site/settings')
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const s = d.data as Record<string, string>;
        const root = document.documentElement;
        if (s.primaryColor) root.style.setProperty('--primary', s.primaryColor);
      })
      .catch(() => {});
  }, []);

  return null;
}
