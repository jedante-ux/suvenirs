'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BlogPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[1080px] border rounded-lg flex items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  isPublished: boolean;
}

export default function EditarArticuloPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    isPublished: false,
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_URL}/blog/admin/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (result.success) {
          setPost(result.data);
          setFormData({
            title: result.data.title,
            excerpt: result.data.excerpt,
            content: result.data.content,
            coverImage: result.data.coverImage || '',
            tags: result.data.tags.join(', '),
            isPublished: result.data.isPublished,
          });
        } else {
          alert('Artículo no encontrado');
          router.push('/gestion/blog');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        router.push('/gestion/blog');
      } finally {
        setLoading(false);
      }
    };

    if (token && postId) {
      fetchPost();
    }
  }, [token, postId, router]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    if (!formData.excerpt.trim()) {
      alert('El extracto es requerido');
      return;
    }
    if (!formData.content.trim()) {
      alert('El contenido es requerido');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await fetch(`${API_URL}/blog/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        router.push('/gestion/blog');
      } else {
        alert(result.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error al guardar el artículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/blog/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        router.push('/gestion/blog');
      } else {
        alert('Error al eliminar el artículo');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error al eliminar el artículo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/gestion/blog">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Artículo</h1>
            <p className="text-muted-foreground">Modifica el artículo del blog</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            {formData.isPublished ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {formData.isPublished ? 'Publicado' : 'Borrador'}
            </span>
            <Switch
              checked={formData.isPublished}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPublished: checked })
              }
            />
          </div>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/gestion/blog">Cancelar</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Título del artículo"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extracto *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Breve descripción del artículo que aparecerá en las tarjetas de vista previa (máx. 500 caracteres)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.excerpt.length}/500
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contenido *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) =>
                    setFormData({ ...formData, content })
                  }
                  placeholder="Escribe el contenido del artículo aquí..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagen de Portada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverImage">URL de la imagen</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              {formData.coverImage && (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={formData.coverImage}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="tendencias, regalos, navidad"
                />
                <p className="text-xs text-muted-foreground">
                  Separa las etiquetas con comas
                </p>
              </div>
              {formData.tags && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.split(',').map((tag, i) => (
                    tag.trim() && (
                      <span
                        key={i}
                        className="px-2 py-1 bg-muted rounded-md text-xs"
                      >
                        {tag.trim()}
                      </span>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {formData.isPublished ? 'Publicado' : 'Borrador'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublished
                      ? 'El artículo es visible públicamente'
                      : 'Solo visible para administradores'}
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {post && (
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vistas:</span>
                  <span>{post.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString('es-CL')}
                  </span>
                </div>
                {post.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publicado:</span>
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Artículo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el artículo &quot;
              {formData.title}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
