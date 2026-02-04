'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MailIcon } from '../icons';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
    }

    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <section className="section bg-gradient-to-r from-primary to-secondary">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailIcon size={32} className="text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Mantente al día con nuestras novedades
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Suscríbete a nuestro newsletter y recibe ofertas exclusivas, nuevos productos
            y tips para tus regalos corporativos.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="flex-1 h-12 px-5 rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/50"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              size="lg"
              className="rounded-full px-8 bg-white text-primary hover:bg-white/90"
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirse'}
            </Button>
          </form>

          {/* Status messages */}
          {status === 'success' && (
            <p className="mt-4 text-white bg-white/20 inline-block px-4 py-2 rounded-full text-sm">
              ¡Gracias por suscribirte! Pronto recibirás nuestras novedades.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-white bg-destructive/50 inline-block px-4 py-2 rounded-full text-sm">
              Hubo un error. Por favor intenta de nuevo.
            </p>
          )}

          <p className="mt-6 text-white/60 text-sm">
            Al suscribirte, aceptas recibir nuestras comunicaciones. Puedes darte de baja en cualquier momento.
          </p>
        </div>
      </div>
    </section>
  );
}
