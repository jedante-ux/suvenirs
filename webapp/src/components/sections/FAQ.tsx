'use client';

import React, { useState, useCallback } from 'react';
import { useInView } from '@/hooks/useInView';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '¿Cuál es el pedido mínimo para regalos corporativos?',
    answer:
      'No tenemos mínimo estricto, pero ofrecemos mejores precios desde 20 unidades. Para pedidos menores, contáctanos y armamos algo a tu medida.',
  },
  {
    question: '¿Qué tipos de personalización ofrecen?',
    answer:
      'Grabado láser, impresión UV, sublimación y serigrafía. Cada técnica se adapta a diferentes materiales — te asesoramos para elegir la mejor opción.',
  },
  {
    question: '¿Cuánto demora un pedido personalizado?',
    answer:
      'Entre 5 y 10 días hábiles dependiendo de la cantidad y tipo de personalización. Para pedidos urgentes, consulta por nuestro servicio express.',
  },
  {
    question: '¿Hacen envíos a todo Chile?',
    answer:
      'Sí, despachamos a todo el país. Envío gratuito en Región Metropolitana para pedidos sobre $150.000. Regiones tienen tarifa preferencial.',
  },
  {
    question: '¿Puedo ver una muestra antes de confirmar mi pedido?',
    answer:
      'Por supuesto. Enviamos una prueba digital del diseño antes de producir, y para pedidos grandes podemos hacer una muestra física.',
  },
  {
    question: '¿Cómo solicito una cotización?',
    answer:
      'Puedes cotizar directamente desde nuestra web, por WhatsApp o enviándonos un email. Respondemos en menos de 24 horas con una propuesta detallada.',
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
  isInView,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  isInView: boolean;
}) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      className="group"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(20px)',
        transition:
          'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
        transitionDelay: `${index * 0.08}s`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-5 md:gap-7 py-7 md:py-8 text-left cursor-pointer border-b border-foreground/[0.06] transition-colors duration-300 hover:border-[#F5D966]/40"
        aria-expanded={isOpen}
      >
        {/* Number */}
        <span
          className="text-sm font-semibold tabular-nums flex-shrink-0 mt-0.5 transition-colors duration-300"
          style={{ color: isOpen ? '#F5D966' : 'rgba(0,0,0,0.2)' }}
        >
          {num}
        </span>

        {/* Question */}
        <span className="flex-1 min-w-0">
          <span
            className="block text-lg md:text-xl font-semibold tracking-[-0.01em] transition-colors duration-300"
            style={{ color: isOpen ? '#FE248A' : 'inherit' }}
          >
            {item.question}
          </span>
        </span>

        {/* Toggle icon */}
        <span
          className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5 transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            backgroundColor: isOpen ? '#F5D966' : 'rgba(245,217,102,0.12)',
          }}
          aria-hidden="true"
        >
          <span
            className="absolute w-4 h-[2px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ backgroundColor: isOpen ? '#1F1F1F' : '#F5D966' }}
          />
          <span
            className="absolute w-4 h-[2px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              backgroundColor: isOpen ? '#1F1F1F' : '#F5D966',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
            }}
          />
        </span>
      </button>

      {/* Expandable answer */}
      <div
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pl-[calc(0.875rem+1.25rem)] md:pl-[calc(0.875rem+1.75rem)] pb-8 pt-2">
            <p className="text-muted-foreground text-base md:text-[1.0625rem] leading-[1.7] max-w-xl">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.1 });

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ backgroundColor: '#FAFAF7' }}
    >
      {/* Decorative gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5D966]/50 to-transparent" />

      {/* Subtle ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(245,217,102,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="container relative">
        {/* Header — left-aligned for asymmetry */}
        <div
          className="max-w-3xl mx-auto mb-16 md:mb-20"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(24px)',
            transition:
              'opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#F5D966] mb-4">
            Resuelve tus dudas
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground tracking-tight leading-[1.1]">
            Preguntas{' '}
            <span className="text-primary">Frecuentes</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg md:text-xl max-w-md leading-relaxed">
            Todo lo que necesitas saber antes de empezar.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto">
          {faqs.map((item, index) => (
            <AccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          className="max-w-3xl mx-auto mt-16 md:mt-20"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(16px)',
            transition:
              'opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
            transitionDelay: '0.55s',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 p-7 md:p-8 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05]">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-base">
                ¿No encuentras lo que buscas?
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Nuestro equipo responde en menos de 24 horas.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 group flex-shrink-0"
            >
              Contáctanos
              <svg
                className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
