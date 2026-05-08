'use client';

import './editor-styles.css';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Highlighter,
  Minus,
  Type,
  Pilcrow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del artículo aquí...',
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[1080px] p-6',
      },
    },
  });

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
      setImageUrl('');
      setImageAlt('');
      setImageDialogOpen(false);
    }
  }, [editor, imageUrl, imageAlt]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted text-primary'
      )}
      title={title}
    >
      {children}
    </Button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-border mx-1" />
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
        {/* Text Type Selector */}
        <Select
          value={
            editor.isActive('heading', { level: 1 })
              ? 'h1'
              : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
              ? 'h3'
              : 'paragraph'
          }
          onValueChange={(value) => {
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run();
            } else if (value === 'h1') {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            } else if (value === 'h2') {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else if (value === 'h3') {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }
          }}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">
              <span className="flex items-center gap-2">
                <Pilcrow className="h-4 w-4" />
                Párrafo
              </span>
            </SelectItem>
            <SelectItem value="h1">
              <span className="flex items-center gap-2">
                <Heading1 className="h-4 w-4" />
                Título 1
              </span>
            </SelectItem>
            <SelectItem value="h2">
              <span className="flex items-center gap-2">
                <Heading2 className="h-4 w-4" />
                Título 2
              </span>
            </SelectItem>
            <SelectItem value="h3">
              <span className="flex items-center gap-2">
                <Heading3 className="h-4 w-4" />
                Título 3
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <ToolbarDivider />

        {/* Basic Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Subrayado (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Resaltar"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Código"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea horizontal"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Links & Media */}
        <ToolbarButton
          onClick={() => setLinkDialogOpen(true)}
          isActive={editor.isActive('link')}
          title="Insertar enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton onClick={removeLink} title="Quitar enlace">
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}
        <ToolbarButton
          onClick={() => setImageDialogOpen(true)}
          title="Insertar imagen"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Bubble Menu for selected text */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrita"
          >
            <Bold className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Cursiva"
          >
            <Italic className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Subrayado"
          >
            <UnderlineIcon className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setLinkDialogOpen(true)}
            isActive={editor.isActive('link')}
            title="Enlace"
          >
            <LinkIcon className="h-3 w-3" />
          </ToolbarButton>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="overflow-auto" />

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insertar Enlace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL del enlace</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                onKeyDown={(e) => e.key === 'Enter' && addLink()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addLink}>Insertar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insertar Imagen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL de la imagen</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Texto alternativo (opcional)</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descripción de la imagen"
              />
            </div>
            {imageUrl && (
              <div className="border rounded-lg p-2 bg-muted">
                <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                <img
                  src={imageUrl}
                  alt={imageAlt || 'Vista previa'}
                  className="max-h-40 rounded object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addImage} disabled={!imageUrl}>
              Insertar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
