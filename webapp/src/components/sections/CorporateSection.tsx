'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, GiftIcon, StarIcon } from '../icons';

const features = [
  {
    icon: '🎯',
    title: 'Personalización Total',
    description: 'Cada producto puede ser personalizado con tu marca, colores y mensaje.',
  },
  {
    icon: '🚀',
    title: 'Entregas Rápidas',
    description: 'Cumplimos con los plazos más exigentes sin comprometer la calidad.',
  },
  {
    icon: '💎',
    title: 'Calidad Premium',
    description: 'Solo trabajamos con los mejores materiales y proveedores del mercado.',
  },
  {
    icon: '🤝',
    title: 'Asesoría Experta',
    description: 'Te acompañamos en todo el proceso para lograr el regalo perfecto.',
  },
];

export default function CorporateSection() {
  return (
    <section className="section bg-[#2f1c6a] text-white overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-medium mb-6">
              Soluciones Corporativas
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Tu socio en regalos corporativos de{' '}
              <span className="text-yellow-300">alto impacto</span>
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Ayudamos a las empresas a fortalecer sus relaciones comerciales y reconocer
              a sus colaboradores con regalos únicos y memorables.
            </p>

            {/* Features grid */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contacto" className="btn btn-white group">
                Solicitar cotización
                <ArrowRightIcon size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/nosotros" className="btn border-2 border-white/30 text-white hover:bg-white/10">
                Conoce más
              </Link>
            </div>
          </div>

          {/* Image grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop"
                    alt="Regalos corporativos"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=400&fit=crop"
                    alt="Productos personalizados"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop"
                    alt="Cajas de regalo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                    alt="Productos gourmet"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Stats card */}
            <div className="absolute -left-4 bottom-8 bg-white rounded-2xl shadow-2xl p-6 max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#673de6]/10 rounded-xl flex items-center justify-center">
                  <GiftIcon size={28} className="text-[#673de6]" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">+10,000</p>
                  <p className="text-gray-500 text-sm">Regalos entregados</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} size={16} className="text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-gray-600">4.9/5 satisfacción</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
