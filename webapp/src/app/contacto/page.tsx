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

const contactInfo = [
  {
    icon: MailIcon,
    title: 'Email',
    content: 'contacto@suvenirs.cl',
    href: 'mailto:contacto@suvenirs.cl',
  },
  {
    icon: PhoneIcon,
    title: 'Teléfono',
    content: '+56 9 1234 5678',
    href: 'tel:+56912345678',
  },
  {
    icon: LocationIcon,
    title: 'Dirección',
    content: 'Santiago, Chile',
    href: null,
  },
];

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, subject: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus('success');
    setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });

    setTimeout(() => setStatus('idle'), 5000);
  };

  return (
    <div className="pt-20">
      {/* Hero section */}
      <section className="section bg-gradient-to-br from-primary to-accent text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-0">
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
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-foreground mb-6">Información de contacto</h2>
              <p className="text-muted-foreground mb-8">
                Puedes contactarnos por cualquiera de estos medios. Te responderemos a la brevedad.
              </p>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <info.icon size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{info.title}</p>
                      {info.href ? (
                        <a href={info.href} className="text-muted-foreground hover:text-primary transition-colors">
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hours */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">Horario de atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                  <p>Lunes a Viernes: 9:00 - 18:00</p>
                  <p>Sábado: 10:00 - 14:00</p>
                  <p>Domingo: Cerrado</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Envíanos un mensaje</CardTitle>
                </CardHeader>
                <CardContent>
                  {status === 'success' ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-emerald-600">✓</span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">¡Mensaje enviado!</h3>
                      <p className="text-muted-foreground">Te contactaremos pronto.</p>
                    </div>
                  ) : (
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
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
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

                      <Button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full"
                        size="lg"
                      >
                        {status === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map section */}
      <section className="h-96 bg-muted">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d212862.80853295!2d-70.76835545!3d-33.4724228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662c5410425af2f%3A0x8475d53c400f0931!2sSantiago%2C%20Regi%C3%B3n%20Metropolitana%2C%20Chile!5e0!3m2!1ses!2s!4v1697000000000!5m2!1ses!2s"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación de Suvenirs"
        />
      </section>
    </div>
  );
}
