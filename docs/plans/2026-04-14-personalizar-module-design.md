# Módulo Personalizar - Admin

## Tablas
- `site_banners`: id, imageUrl, alt, linkUrl, order, isActive, timestamps
- `site_settings`: id, key (unique), value, updatedAt

## Storage
- Supabase Storage bucket `banners` (público)

## API
- GET/POST/PUT/DELETE /api/admin/site/banners
- POST /api/admin/site/banners/upload
- POST /api/admin/site/banners/reorder
- GET /api/site/banners (público)
- GET/PUT /api/admin/site/settings
- GET /api/site/settings (público)

## Admin UI
- /gestion/personalizar con tabs: Banners y Colores
- Drag & drop para reordenar banners
- Color picker para colores del sitio

## Frontend
- Hero consume banners dinámicos
- Layout inyecta CSS vars desde settings
