'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Image as ImageIcon, Upload, Trash2, GripVertical, Save, Loader2, Check, Link2, Palette, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function PersonalizarPage() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bannersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/site/banners', { headers }),
        fetch('/api/admin/site/settings', { headers }),
      ]);
      const bannersData = await bannersRes.json();
      const settingsData = await settingsRes.json();
      if (bannersData.success) setBanners(bannersData.data);
      if (settingsData.success) setSettings(settingsData.data);
    } catch {
      toast.error('Error cargando configuración');
    } finally {
      setLoading(false);
    }
  };

  // ── Banners ──

  const uploadBanner = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^.]+$/, ''));

      const res = await fetch('/api/admin/site/banners', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBanners([...banners, data.data]);
        toast.success('Banner subido');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Error subiendo banner');
    } finally {
      setUploading(false);
    }
  };

  const toggleBanner = async (id: string, isActive: boolean) => {
    const res = await fetch('/api/admin/site/banners', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    const data = await res.json();
    if (data.success) {
      setBanners(banners.map(b => b.id === id ? { ...b, isActive } : b));
    }
  };

  const updateBannerLink = async (id: string, linkUrl: string) => {
    await fetch('/api/admin/site/banners', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, linkUrl: linkUrl || null }),
    });
    setBanners(banners.map(b => b.id === id ? { ...b, linkUrl: linkUrl || null } : b));
  };

  const updateBannerAlt = async (id: string, alt: string) => {
    await fetch('/api/admin/site/banners', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, alt }),
    });
    setBanners(banners.map(b => b.id === id ? { ...b, alt } : b));
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    const res = await fetch(`/api/admin/site/banners?id=${id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (data.success) {
      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner eliminado');
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setBanners(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    await fetch('/api/admin/site/banners/reorder', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(b => b.id) }),
    });
    toast.success('Orden actualizado');
  };

  // ── Settings ──

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site/settings', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Colores guardados');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Error guardando colores');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const colorSettings = [
    { key: 'primaryColor', label: 'Color principal (vinotinto)', desc: 'Botones, links, navbar al hacer scroll' },
    { key: 'heroBackground', label: 'Fondo Hero (homepage)', desc: 'Color de fondo de la sección principal' },
    { key: 'categoryBackground', label: 'Fondo Categorías', desc: 'Sección de categorías en el home' },
    { key: 'kitsBackground', label: 'Fondo Kits', desc: 'Sección de kits corporativos' },
    { key: 'topHeaderBackground', label: 'Fondo Top Header', desc: 'Barra superior del sitio' },
    { key: 'topHeaderText', label: 'Texto Top Header', desc: 'Color del texto en la barra superior' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personalizar</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona banners y colores del sitio</p>
        </div>
      </div>

      <Tabs defaultValue="banners" className="space-y-6">
        <TabsList>
          <TabsTrigger value="banners" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="colores" className="gap-2">
            <Palette className="h-4 w-4" />
            Colores
          </TabsTrigger>
        </TabsList>

        {/* ── TAB BANNERS ── */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {banners.length} banner{banners.length !== 1 ? 'es' : ''} · Arrastra para reordenar
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadBanner(file);
                  e.target.value = '';
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir banner
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {banners.map((banner, index) => (
              <Card
                key={banner.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                className={`transition-all ${dragOverIndex === index ? 'ring-2 ring-primary' : ''} ${!banner.isActive ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing pt-2 text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Preview */}
                    <div className="w-40 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      <img src={banner.imageUrl} alt={banner.alt} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Texto alternativo"
                          defaultValue={banner.alt}
                          className="h-8 text-sm"
                          onBlur={(e) => updateBannerAlt(banner.id, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <Input
                          placeholder="Link al hacer clic (ej: /productos)"
                          defaultValue={banner.linkUrl || ''}
                          className="h-8 text-sm"
                          onBlur={(e) => updateBannerLink(banner.id, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        {banner.isActive ? <Eye className="h-3.5 w-3.5 text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        <Switch
                          checked={banner.isActive}
                          onCheckedChange={(v) => toggleBanner(banner.id, v)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteBanner(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {banners.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No hay banners. Sube el primero.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB COLORES ── */}
        <TabsContent value="colores" className="space-y-6">
          <div className="grid gap-6 max-w-2xl">
            {colorSettings.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border flex-shrink-0 cursor-pointer relative overflow-hidden"
                  style={{ backgroundColor: settings[key] || '#000' }}
                >
                  <input
                    type="color"
                    value={settings[key] || '#000000'}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Input
                  value={settings[key] || ''}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-28 h-8 text-sm font-mono text-center"
                  placeholder="#000000"
                />
              </div>
            ))}
          </div>

          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar colores
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
