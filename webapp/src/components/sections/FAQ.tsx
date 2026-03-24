'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="border-b border-foreground/[0.08] last:border-b-0"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(16px)',
        transition:
          'opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        transitionDelay: `${index * 0.07}s`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 md:py-7 text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-base md:text-lg font-medium text-foreground pr-8 transition-colors duration-300 group-hover:text-primary">
          {item.question}
        </span>
        <span
          className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Horizontal line */}
          <span className="absolute w-4 h-[2px] bg-[#D3DC2A] rounded-full transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]" />
          {/* Vertical line — rotates to 0 when open */}
          <span
            className="absolute w-4 h-[2px] bg-[#D3DC2A] rounded-full transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
            }}
          />
        </span>
      </button>

      {/* Expandable answer — uses grid-template-rows for smooth height animation */}
      <div
        className="grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden" ref={contentRef}>
          <p className="pb-7 text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            {item.answer}
          </p>
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
      className="py-20 lg:py-28 relative"
      style={{ backgroundColor: '#FAFAF7' }}
    >
      <div className="container">
        {/* Header */}
        <div
          className="text-center mb-14 md:mb-18"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition:
              'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-foreground tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Todo lo que necesitas saber para empezar tu próximo proyecto con nosotros.
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
          className="text-center mt-14 md:mt-18"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(16px)',
            transition:
              'opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
            transitionDelay: '0.5s',
          }}
        >
          <p className="text-muted-foreground mb-5 text-sm md:text-base">
            ¿Tienes otra pregunta?
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-300 group"
          >
            Contáctanos
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
