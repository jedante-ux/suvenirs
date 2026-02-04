'use client';

import React from 'react';
import Image from 'next/image';
import { StarIcon } from '../icons';

const testimonials = [
  {
    id: 1,
    name: 'María González',
    role: 'Gerente de RRHH',
    company: 'Tech Solutions Chile',
    content: 'Suvenirs ha sido un aliado increíble para nuestros eventos de reconocimiento. La calidad de los productos y la atención personalizada superaron todas nuestras expectativas.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    name: 'Carlos Muñoz',
    role: 'Director Comercial',
    company: 'Inversiones del Pacífico',
    content: 'Los regalos corporativos que encargamos para nuestros clientes VIP fueron un éxito total. El grabado personalizado le dio ese toque especial que buscábamos.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    name: 'Ana Fernández',
    role: 'Jefa de Marketing',
    company: 'Grupo Retail Plus',
    content: 'Trabajar con Suvenirs ha sido una excelente experiencia. Desde la cotización hasta la entrega, todo fue impecable. Definitivamente seguiremos trabajando juntos.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
];

export default function Testimonials() {
  return (
    <section className="section bg-gray-50">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-[#673de6]/10 text-[#673de6] rounded-full text-sm font-medium mb-4">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Miles de empresas confían en nosotros para sus regalos corporativos.
            Conoce sus experiencias.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} size={18} className="text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
