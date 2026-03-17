'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MailIcon, PhoneIcon, LocationIcon } from '@/components/icons';
import { Instagram, Music2, ExternalLink } from 'lucide-react';

const WHATSAPP_NUMBER = '56931464930';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });

  const subjectLabels: Record<string, string> = {
    cotizacion: 'Solicitar cotización',
    consulta: 'Consulta general',
    colaboracion: 'Propuesta de colaboración',
    soporte: 'Soporte post-venta',
    otro: 'Otro',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, subject: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = [
      `Hola, les escribo desde suvenirs.cl 👋`,
      ``,
      `*Nombre:* ${formData.name}`,
      formData.company ? `*Empresa:* ${formData.company}` : null,
      formData.email ? `*Email:* ${formData.email}` : null,
      formData.phone ? `*Teléfono:* ${formData.phone}` : null,
      formData.subject ? `*Asunto:* ${subjectLabels[formData.subject] || formData.subject}` : null,
      ``,
      `*Mensaje:*`,
      formData.message,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-accent text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-black/10 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-6 bg-white/15 text-white border border-white/30 backdrop-blur-sm hover:bg-white/20">
              Contacto
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Conversemos sobre<br className="hidden sm:block" /> tu proyecto
            </h1>
            <p className="text-lg text-white/75 max-w-lg mx-auto">
              Estamos aquí para ayudarte a crear regalos corporativos únicos y memorables.
            </p>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L1440 40L1440 20C1200 0 960 40 720 20C480 0 240 40 0 20L0 40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">

            {/* Left — dark info panel */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-[#1a1a1a] text-white p-8 space-y-8 sticky top-28">
                <div>
                  <h2 className="text-xl font-bold mb-1">Información de contacto</h2>
                  <p className="text-white/50 text-sm">Te respondemos a la brevedad.</p>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe5d] transition-colors text-white font-semibold px-5 py-3 rounded-xl"
                >
                  <WhatsAppIcon />
                  Escribir por WhatsApp
                  <ExternalLink size={14} className="ml-auto opacity-70" />
                </a>

                <div className="border-t border-white/10" />

                {/* Contact details */}
                <div className="space-y-5">
                  <a href="mailto:Contacto@suvenirs.cl" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/40 transition-colors">
                      <MailIcon size={18} className="text-white/70" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide font-medium">Email</p>
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">Contacto@suvenirs.cl</p>
                    </div>
                  </a>

                  <a href="tel:+56931464930" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/40 transition-colors">
                      <PhoneIcon size={18} className="text-white/70" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide font-medium">Teléfono</p>
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">+56 9 3146 4930</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <LocationIcon size={18} className="text-white/70" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide font-medium">Dirección</p>
                      <p className="text-sm font-medium text-white">Av. Irarrázaval 2401 Of. 607</p>
                      <p className="text-sm text-white/50">Ñuñoa, Región Metropolitana</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Social */}
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com/suvenirs.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    <Instagram size={16} />
                    Instagram
                  </a>
                  <a
                    href="https://tiktok.com/@suvenirs.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    <Music2 size={16} />
                    TikTok
                  </a>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-border/60 shadow-xl p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Envíanos un mensaje</h2>
                  <p className="text-sm text-muted-foreground">
                    Al enviar el formulario serás redirigido a WhatsApp con tu mensaje listo para enviar.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">Nombre completo <span className="text-primary">*</span></Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre"
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="company" className="text-sm font-medium">Empresa</Label>
                      <Input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+56 9 1234 5678"
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-sm font-medium">Asunto <span className="text-primary">*</span></Label>
                    <Select value={formData.subject} onValueChange={handleSelectChange} required>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Selecciona un asunto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cotizacion">Solicitar cotización</SelectItem>
                        <SelectItem value="consulta">Consulta general</SelectItem>
                        <SelectItem value="colaboracion">Propuesta de colaboración</SelectItem>
                        <SelectItem value="soporte">Soporte post-venta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm font-medium">Mensaje <span className="text-primary">*</span></Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Cuéntanos sobre tu proyecto, cantidad de personas, tipo de evento..."
                      className="resize-none rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-semibold"
                    size="lg"
                  >
                    <WhatsAppIcon />
                    <span className="ml-2">Enviar por WhatsApp</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
