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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MailIcon, PhoneIcon, LocationIcon } from '@/components/icons';
import { Instagram, Music2 } from 'lucide-react';

const WHATSAPP_NUMBER = '56931464930';

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
      {/* Hero section */}
      <section className="section bg-gradient-to-br from-primary to-accent text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              Contacto
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Conversemos sobre tu proyecto
            </h1>
            <p className="text-xl text-white/80">
              Estamos aquí para ayudarte a crear regalos corporativos únicos y memorables.
            </p>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact info */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Información de contacto</h2>
              <p className="text-muted-foreground mb-6">
                Puedes contactarnos por cualquiera de estos medios. Te responderemos a la brevedad.
              </p>

              {/* Info cards */}
              <a
                href="mailto:Contacto@suvenirs.cl"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors block"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MailIcon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email</p>
                  <p className="text-muted-foreground text-sm">Contacto@suvenirs.cl</p>
                </div>
              </a>

              <a
                href="tel:+56931464930"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors block"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PhoneIcon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Teléfono / WhatsApp</p>
                  <p className="text-muted-foreground text-sm">+56 9 3146 4930</p>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LocationIcon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Dirección</p>
                  <p className="text-muted-foreground text-sm">Av. Irarrázaval 2401 Of. 607</p>
                  <p className="text-muted-foreground text-sm">Ñuñoa, Región Metropolitana</p>
                </div>
              </div>

              {/* Social media */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Instagram size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Redes sociales</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <a
                      href="https://instagram.com/suvenirs.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Instagram size={13} />
                      @suvenirs.cl
                    </a>
                    <a
                      href="https://tiktok.com/@suvenirs.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Music2 size={13} />
                      @suvenirs.cl
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Horario de atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Lunes a Viernes</span>
                    <span className="font-medium text-foreground">9:00 – 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábado</span>
                    <span className="font-medium text-foreground">10:00 – 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingo</span>
                    <span className="text-muted-foreground/60">Cerrado</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Envíanos un mensaje</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Al enviar el formulario serás redirigido a WhatsApp con tu mensaje listo para enviar.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo *</Label>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Nombre de tu empresa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto *</Label>
                      <Select value={formData.subject} onValueChange={handleSelectChange} required>
                        <SelectTrigger>
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

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Cuéntanos sobre tu proyecto..."
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white" size="lg">
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Enviar por WhatsApp
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
