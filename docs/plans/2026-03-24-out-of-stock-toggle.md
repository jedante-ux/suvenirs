# Out-of-Stock Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "agotado" (out-of-stock) toggle to quote editor product items, allowing replacement products and excluding out-of-stock items from pricing.

**Architecture:** Add `outOfStock` and `replacesItemId` fields to `QuoteItem` in Prisma schema. Extend the editor UI with a toggle per item and a replacement product flow. Filter out-of-stock items from PDF, public view, and pricing calculations.

**Tech Stack:** Prisma (PostgreSQL), Next.js App Router, React, shadcn/ui, react-pdf

---

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `webapp/prisma/schema.prisma:123-134`

**Step 1: Add fields to QuoteItem model**

In `webapp/prisma/schema.prisma`, update the `QuoteItem` model to:

```prisma
model QuoteItem {
  id             String     @id @default(uuid()) @db.Uuid
  quoteId        String     @db.Uuid
  quote          Quote      @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId      String
  productName    String
  quantity       Int
  unitPrice      Float      @default(0)
  description    String     @default("")
  outOfStock     Boolean    @default(false)
  replacesItemId String?    @db.Uuid

  @@map("quote_items")
}
```

**Step 2: Run migration**

Run: `cd webapp && npx prisma migrate dev --name add-out-of-stock-fields`
Expected: Migration succeeds, 2 new columns added to `quote_items` table.

**Step 3: Commit**

```bash
git add webapp/prisma/
git commit -m "feat: add outOfStock and replacesItemId fields to QuoteItem schema"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `webapp/src/types/index.ts:109-116`

**Step 1: Update QuoteItem interface**

```typescript
export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  description: string;
  outOfStock: boolean;
  replacesItemId: string | null;
}
```

**Step 2: Commit**

```bash
git add webapp/src/types/index.ts
git commit -m "feat: add outOfStock and replacesItemId to QuoteItem type"
```

---

### Task 3: Update Quote API (PUT endpoint)

**Files:**
- Modify: `webapp/src/app/api/quotes/[id]/route.ts:30-53`

**Step 1: Update the items create mapping in the PUT handler**

The `items.map(...)` inside the transaction (line 41) currently maps: `productId, productName, quantity, unitPrice, description`. Add the two new fields:

```typescript
items.map((item: { productId: string; productName: string; quantity: number; unitPrice?: number; description?: string; outOfStock?: boolean; replacesItemId?: string | null }) => ({
  productId: item.productId,
  productName: item.productName,
  quantity: item.quantity,
  unitPrice: item.unitPrice ?? 0,
  description: item.description || '',
  outOfStock: item.outOfStock ?? false,
  replacesItemId: item.replacesItemId ?? null,
})),
```

**Step 2: Update totalItems and totalUnits to exclude out-of-stock items**

Change lines 27-28 from counting all items to excluding out-of-stock:

```typescript
const activeItems = items?.filter((i: { outOfStock?: boolean }) => !i.outOfStock) ?? [];
const totalItems = items ? activeItems.length : undefined;
const totalUnits = items ? activeItems.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) : undefined;
```

**Step 3: Commit**

```bash
git add webapp/src/app/api/quotes/[id]/route.ts
git commit -m "feat: persist outOfStock and replacesItemId in quote items API"
```

---

### Task 4: Update Public Quote API to Filter Out-of-Stock Items

**Files:**
- Modify: `webapp/src/app/api/quotes/public/[token]/route.ts`

**Step 1: Filter out-of-stock items from response**

After fetching the quote, filter items before returning:

```typescript
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const quote = await prisma.quote.findUnique({
      where: { publicToken: token },
      include: { items: true, stampingType: true, kit: { select: { name: true, slug: true } } },
    })
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }
    // Filter out-of-stock items from public view — replacements appear as normal items
    const filteredQuote = {
      ...quote,
      items: quote.items.filter(item => !item.outOfStock),
    }
    return NextResponse.json({ success: true, data: filteredQuote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quote' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add webapp/src/app/api/quotes/public/[token]/route.ts
git commit -m "feat: filter out-of-stock items from public quote API"
```

---

### Task 5: Update Editor UI — Out-of-Stock Toggle & Replacement Flow

**Files:**
- Modify: `webapp/src/app/gestion/(dashboard)/cotizaciones/page.tsx`

This is the largest task. It involves several changes to the editor component:

**Step 1: Add state for replacement product dialog**

Add new state variables after the existing `selectedQty` state (around line 93):

```typescript
const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
```

**Step 2: Add `toggleOutOfStock` handler**

Add after `removeItem` function (around line 317):

```typescript
const toggleOutOfStock = (index: number) => {
  const item = editForm.items[index];
  if (item.outOfStock) {
    // Reverting: remove all replacements for this item
    const replacementIds = editForm.items
      .filter(i => i.replacesItemId === item.id)
      .map(i => i.id);
    if (replacementIds.length > 0) {
      if (!confirm('Al desmarcar agotado se eliminarán los productos de reemplazo. ¿Continuar?')) return;
    }
    const items = editForm.items
      .filter(i => i.replacesItemId !== item.id)
      .map(i => i.id === item.id ? { ...i, outOfStock: false } : i);
    setEditForm({ ...editForm, items });
  } else {
    const items = [...editForm.items];
    items[index] = { ...items[index], outOfStock: true };
    setEditForm({ ...editForm, items });
  }
};
```

**Step 3: Add `addReplacementProduct` handler**

Add after `toggleOutOfStock`:

```typescript
const openAddReplacement = (itemId: string) => {
  setReplacingItemId(itemId);
  setProductSearch('');
  setProductResults([]);
  setSelectedProduct(null);
  setSelectedQty(1);
  setAddProductOpen(true);
};
```

**Step 4: Update `confirmAddProduct` to handle replacements**

Modify the `confirmAddProduct` function. When `replacingItemId` is set, the new product should inherit the quantity from the replaced item and set `replacesItemId`:

```typescript
const confirmAddProduct = () => {
  if (!selectedProduct) return;
  const qty = Math.max(1, selectedQty);

  if (replacingItemId) {
    // Adding as a replacement
    const newItem: QuoteItem = {
      id: `new-${Date.now()}`,
      productId: selectedProduct.productId,
      productName: selectedProduct.name,
      quantity: qty,
      unitPrice: selectedProduct.price || 0,
      description: selectedProduct.description || '',
      outOfStock: false,
      replacesItemId: replacingItemId,
    };
    setEditForm({ ...editForm, items: [...editForm.items, newItem] });
    setReplacingItemId(null);
  } else {
    // Normal add (existing logic)
    const existing = editForm.items.findIndex(i => i.productId === selectedProduct.productId && !i.replacesItemId);
    if (existing >= 0) {
      const items = [...editForm.items];
      items[existing] = { ...items[existing], quantity: items[existing].quantity + qty };
      setEditForm({ ...editForm, items });
    } else {
      const newItem: QuoteItem = {
        id: `new-${Date.now()}`,
        productId: selectedProduct.productId,
        productName: selectedProduct.name,
        quantity: qty,
        unitPrice: selectedProduct.price || 0,
        description: selectedProduct.description || '',
        outOfStock: false,
        replacesItemId: null,
      };
      setEditForm({ ...editForm, items: [...editForm.items, newItem] });
    }
  }
  resetAddProduct();
};
```

**Step 5: Update `resetAddProduct` to also clear `replacingItemId`**

```typescript
const resetAddProduct = () => {
  setAddProductOpen(false);
  setProductSearch('');
  setProductResults([]);
  setSelectedProduct(null);
  setSelectedQty(1);
  setReplacingItemId(null);
};
```

**Step 6: Update `openEdit` to include new fields when loading items**

In the `openEdit` function, ensure items include the new fields. Update the items mapping (around line 147):

```typescript
let items = quote.items.map(i => ({ ...i, outOfStock: i.outOfStock ?? false, replacesItemId: i.replacesItemId ?? null }));
```

**Step 7: Update the product item rendering in the editor (TAB 2)**

Replace the product item rendering block (lines 738-795) with a version that:
- Shows a toggle button (PackageX icon) next to the trash icon
- When out of stock: dims the item, strikes through name, shows "$0"
- Shows replacement items indented below with a visual indicator
- Shows "+ Agregar reemplazo" button below out-of-stock items

The product list section (inside `<div className="border rounded-lg divide-y flex-1">`) should be updated to:

```tsx
{editForm.items.map((item, index) => {
  // Skip replacement items — they're rendered under their parent
  if (item.replacesItemId) return null;

  const replacements = editForm.items
    .map((ri, ri_index) => ({ ...ri, _index: ri_index }))
    .filter(ri => ri.replacesItemId === item.id);

  const subtotal = item.outOfStock ? 0 : (item.unitPrice || 0) * item.quantity;

  return (
    <div key={item.id}>
      {/* Main item */}
      <div className={`px-4 py-3 space-y-2 ${item.outOfStock ? 'opacity-50 bg-muted/30' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono leading-none mb-0.5">{item.productId}</p>
            <p className={`text-sm font-medium leading-snug ${item.outOfStock ? 'line-through text-muted-foreground' : ''}`}>
              {item.productName}
            </p>
            {item.outOfStock && (
              <span className="text-xs text-red-500 font-medium">Agotado</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 -mt-0.5">
            <Button
              variant="ghost" size="icon"
              className={`h-6 w-6 ${item.outOfStock ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              title={item.outOfStock ? 'Marcar como disponible' : 'Marcar como agotado'}
              onClick={() => toggleOutOfStock(index)}
            >
              <PackageX className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600"
              onClick={() => removeItem(index)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {!item.outOfStock && (
          <div className="flex items-center gap-3">
            {/* Qty */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7"
                onClick={() => updateItemQty(index, item.quantity - 1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <Input type="number" min="0" className="w-14 h-7 text-center text-sm"
                value={item.quantity}
                onChange={e => updateItemQty(index, parseInt(e.target.value) || 0)} />
              <Button variant="outline" size="icon" className="h-7 w-7"
                onClick={() => updateItemQty(index, item.quantity + 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {/* Unit price */}
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs text-muted-foreground">$</span>
              <Input type="number" min="0" className="h-7 text-right text-sm"
                placeholder="Precio unit."
                value={item.unitPrice || ''}
                onChange={e => {
                  const updated = [...editForm.items];
                  updated[index] = { ...updated[index], unitPrice: parseFloat(e.target.value) || 0 };
                  setEditForm({ ...editForm, items: updated });
                }} />
            </div>
            {/* Subtotal */}
            <div className="text-right flex-shrink-0 w-24">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-sm font-semibold">
                {subtotal > 0 ? `$${subtotal.toLocaleString('es-CL')}` : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Replacement items */}
      {item.outOfStock && (
        <div className="border-l-2 border-primary/30 ml-4">
          {replacements.map(rep => {
            const repSubtotal = (rep.unitPrice || 0) * rep.quantity;
            return (
              <div key={rep.id} className="px-4 py-3 space-y-2 bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">Reemplazo</span>
                      <p className="text-xs text-muted-foreground font-mono leading-none">{rep.productId}</p>
                    </div>
                    <p className="text-sm font-medium leading-snug">{rep.productName}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 flex-shrink-0 -mt-0.5"
                    onClick={() => removeItem(rep._index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7"
                      onClick={() => updateItemQty(rep._index, rep.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input type="number" min="0" className="w-14 h-7 text-center text-sm"
                      value={rep.quantity}
                      onChange={e => updateItemQty(rep._index, parseInt(e.target.value) || 0)} />
                    <Button variant="outline" size="icon" className="h-7 w-7"
                      onClick={() => updateItemQty(rep._index, rep.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input type="number" min="0" className="h-7 text-right text-sm"
                      placeholder="Precio unit."
                      value={rep.unitPrice || ''}
                      onChange={e => {
                        const updated = [...editForm.items];
                        updated[rep._index] = { ...updated[rep._index], unitPrice: parseFloat(e.target.value) || 0 };
                        setEditForm({ ...editForm, items: updated });
                      }} />
                  </div>
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-sm font-semibold">
                      {repSubtotal > 0 ? `$${repSubtotal.toLocaleString('es-CL')}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors"
            onClick={() => openAddReplacement(item.id)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Agregar reemplazo
          </button>
        </div>
      )}
    </div>
  );
})}
```

**Step 8: Add `PackageX` to the lucide-react imports**

Update the import line (line 37) to include `PackageX`:

```typescript
import { Eye, Loader2, MessageCircle, Trash2, Pencil, Link2, Check, Minus, Plus, Truck, RefreshCw, FileText, User, Package, Search, PlusCircle, PackageX } from 'lucide-react';
```

**Step 9: Update `openAddReplacement` to set default quantity from parent item**

When opening the add product dialog for a replacement, pre-set the quantity to the out-of-stock item's quantity:

```typescript
const openAddReplacement = (itemId: string) => {
  const parentItem = editForm.items.find(i => i.id === itemId);
  setReplacingItemId(itemId);
  setProductSearch('');
  setProductResults([]);
  setSelectedProduct(null);
  setSelectedQty(parentItem?.quantity ?? 1);
  setAddProductOpen(true);
};
```

**Step 10: Commit**

```bash
git add webapp/src/app/gestion/\(dashboard\)/cotizaciones/page.tsx
git commit -m "feat: add out-of-stock toggle and replacement product UI in quote editor"
```

---

### Task 6: Update Pricing Calculations to Exclude Out-of-Stock Items

**Files:**
- Modify: `webapp/src/app/gestion/(dashboard)/cotizaciones/page.tsx` (pricing sections)

**Step 1: Update `handleSaveEdit` pricing calculations (lines 187-218)**

In the `handleSaveEdit` function, update the items filter and calculation to exclude out-of-stock items:

Change line 187 from:
```typescript
const items = editForm.items.filter(i => i.quantity > 0);
```
to:
```typescript
const items = editForm.items.filter(i => i.quantity > 0);
const activeItems = items.filter(i => !i.outOfStock);
```

Then update `quotedAmount` and `finalAmount` calculations to use `activeItems` instead of `items`:

```typescript
quotedAmount: (() => {
  const neto = activeItems.reduce((s: any, i: any) => s + (i.unitPrice || 0) * i.quantity, 0)
    + (editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : 0);
  return neto;
})(),
finalAmount: (() => {
  const stampingVal = editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : 0;
  const shippingVal = editForm.shippingPrice ? parseFloat(editForm.shippingPrice) : 0;
  const totalUnits = activeItems.reduce((s: any, i: any) => s + i.quantity, 0);
  const stampingPerUnit = totalUnits > 0 ? stampingVal / totalUnits : 0;
  const neto = activeItems.reduce((s: any, i: any) => s + (i.unitPrice || 0) * i.quantity, 0) + stampingVal;
  const sumaUnitarios = activeItems.reduce((s: any, i: any) =>
    s + Math.round((i.unitPrice || 0) + stampingPerUnit) * i.quantity, 0);
  const ganancia = Math.round(sumaUnitarios * 0.5);
  return Math.round((neto + ganancia) * 1.19) + shippingVal;
})(),
```

Keep sending ALL `items` (including out-of-stock) to the API so they persist.

**Step 2: Update the totals display section (lines 860-957)**

In the totals IIFE, filter to active items only:

```typescript
{(() => {
  const activeItems = editForm.items.filter(i => !i.outOfStock);
  const totalUnits = activeItems.reduce((s, i) => s + i.quantity, 0);
  const subtotalProductos = activeItems.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0);
  // ... rest stays the same but uses activeItems where items was used
```

Also update the "Valor unitario por producto" section to only show active items:

```typescript
{activeItems.map((item, i) => (
```

**Step 3: Commit**

```bash
git add webapp/src/app/gestion/\(dashboard\)/cotizaciones/page.tsx
git commit -m "feat: exclude out-of-stock items from pricing calculations"
```

---

### Task 7: Update PDF to Filter Out-of-Stock Items

**Files:**
- Modify: `webapp/src/components/pdf/QuotePDF.tsx:300-490`

**Step 1: Filter items at the top of the component**

Inside the `QuotePDF` function, right after destructuring props, filter:

```typescript
const activeItems = items.filter(i => !i.outOfStock);
```

Then replace all references to `items` with `activeItems` for:
- `totalUnits` calculation (line 313)
- `productSubtotal` calculation (line 317)
- The `.map()` that renders product rows (line 425)

**Step 2: Update the PDF preview call in the editor**

In the editor's PDF preview section (around line 989), the items passed to `QuotePDFPreview` should still be all items — the filtering happens inside `QuotePDF` itself.

**Step 3: Commit**

```bash
git add webapp/src/components/pdf/QuotePDF.tsx
git commit -m "feat: filter out-of-stock items from PDF output"
```

---

### Task 8: Update Public Quote Page to Handle Filtered Items

**Files:**
- Modify: `webapp/src/app/cotizacion/[token]/page.tsx`

**Step 1: No changes needed**

Since we filter out-of-stock items in the public API (Task 4), the public page already receives only active items. No changes required here.

**Step 2: Verify by checking the public page still renders correctly**

Run: `cd webapp && npm run build`
Expected: Build succeeds with no type errors.

**Step 3: Commit (if any changes were needed)**

No commit needed for this task.

---

### Task 9: Final Build Verification

**Step 1: Run build**

Run: `cd webapp && npm run build`
Expected: Build succeeds with no errors.

**Step 2: Manual testing checklist**

Run the dev server and test:
- [ ] Toggle a product as "agotado" — it shows dimmed with strikethrough
- [ ] Price updates to exclude agotado item from totals
- [ ] Click "+ Agregar reemplazo" — opens product search dialog
- [ ] Add a replacement — it appears indented below the agotado item with "Reemplazo" badge
- [ ] Replacement quantity defaults to parent item's quantity
- [ ] Can add multiple replacements per agotado item
- [ ] Revert agotado toggle — replacements are removed after confirmation
- [ ] Save quote — all items persist correctly
- [ ] Reopen edit — agotado state and replacements load correctly
- [ ] PDF preview — only shows active items, no agotado
- [ ] Public link — only shows active items

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: add out-of-stock toggle with replacement products in quote editor"
```
