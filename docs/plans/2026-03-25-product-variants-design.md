# Product Variants from Imblasco CSV

## Decisions

- **Variant model**: Option A — single product with selectors (color, size, etc.)
- **Data**: Replace all current products from CSV
- **Images**: External links from imblasco.cl
- **Cart**: One color/variant per cart line
- **Attributes**: All attribute types as selectors (Color, Tamaño Copa, Sello, etc.)

## Data Model Changes

### Product (modified)
- Remove `image: String` → Add `images: String[]` (array of URLs)
- Add `weight`, `length`, `width`, `height` (Float?)
- Add relations to `ProductVariant[]` and `ProductAttribute[]`

### ProductAttribute (new)
- `id`, `productId` (FK)
- `name: String` — "Color", "Tamaño Copa", "Sello"
- `values: String[]` — ["Azul", "Rojo", "Negro"]
- `sortOrder: Int`

### ProductVariant (new)
- `id`, `productId` (FK)
- `sku: String @unique`
- `attributes: Json` — {"Color": "Azul"}
- `image: String?` — variant-specific photo
- `price: Float?`, `salePrice: Float?`
- `isActive: Boolean`
- `sortOrder: Int`

## Import Script
1. Delete all products, variants, attributes
2. Parse CSV: group `variable` + `variation` children by "Superior" field
3. Create Product + ProductVariant + ProductAttribute per variable
4. Create Product (no variants) per simple
5. Parse HTML description for specs
6. Map CSV categories to existing DB categories

## Frontend Changes
- Product detail: image carousel, dynamic attribute selectors
- Cart: variant SKU + attribute label per line
- Quote form: variant info carried through
- PDF: shows variant SKU and attribute in line items

## Admin Changes
- Product table: variant count badge
- Edit: view/manage variants
- Import replaced by new script
