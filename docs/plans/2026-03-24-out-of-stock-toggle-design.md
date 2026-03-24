# Diseño: Toggle "Agotado" en Editor de Cotizaciones

## Resumen

Agregar un toggle de "agotado" a cada producto en el editor de cotizaciones. Un producto agotado no cuenta en el precio y permite agregar productos de reemplazo opcionales.

## Decisiones de diseño

- **Admin:** item agotado visible (tachado/gris, precio $0)
- **Cliente (PDF/link público):** item agotado oculto, reemplazos aparecen como items normales
- **Reemplazos:** heredan cantidad del item agotado (editable), precio del producto seleccionado
- **Múltiples reemplazos** permitidos por item agotado
- **Reversible:** al desmarcar agotado, los reemplazos se eliminan automáticamente

## Modelo de datos

Dos campos nuevos en `QuoteItem`:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `outOfStock` | Boolean | `false` | Marca el item como agotado |
| `replacesItemId` | String? | `null` | ID del item agotado que este reemplaza (FK a QuoteItem.id) |

Relación: un item agotado → 0..N reemplazos. Un reemplazo → exactamente 1 item agotado.

## Lógica de cálculos

- Items con `outOfStock = true` → unitPrice tratado como **0** en subtotal, neto, ganancia, IVA, total
- Items de reemplazo (`replacesItemId != null`) → se calculan normalmente
- `quotedAmount` y `finalAmount` solo consideran items activos

## UI del editor (admin)

### Item agotado
- Switch/toggle junto al botón eliminar
- Al activar: opacidad reducida, texto tachado, precio "$0"
- Botón "+ Agregar reemplazo" debajo del item

### Reemplazos
- Indentados debajo del item agotado con indicador visual
- Usan el buscador de productos existente
- Heredan cantidad del item agotado (editable)
- Pueden ser múltiples

### Revertir
- Desactivar toggle → item vuelve a normal
- Reemplazos se eliminan con confirmación

## Vista pública y PDF

- Items `outOfStock = true` → no se renderizan
- Reemplazos → se renderizan como items normales (sin indicación de reemplazo)

## API

- PUT `/api/quotes/[id]` se extiende para incluir `outOfStock` y `replacesItemId` en items
- No se necesitan endpoints nuevos

## Migración

- Agregar 2 campos a tabla `QuoteItem` en Prisma schema
- Migración con valores default (no rompe datos existentes)
