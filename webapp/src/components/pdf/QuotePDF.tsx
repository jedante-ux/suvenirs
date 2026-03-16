'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { company } from '@/config/company';
import { QuoteItem, StampingType } from '@/types';

Font.register({
  family: 'Helvetica',
  fonts: [],
});

const PRIMARY = '#E91E91';
const DARK = '#1F1F1F';
const GRAY = '#666666';
const LIGHT_GRAY = '#F5F5F5';
const BORDER = '#E0E0E0';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logoBlock: {
    flexDirection: 'column',
    gap: 2,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    letterSpacing: 1,
  },
  companyInfo: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.5,
    marginTop: 4,
  },
  quoteInfoBox: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 12,
    minWidth: 180,
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 3,
  },
  quoteInfoLabel: {
    fontSize: 8,
    color: GRAY,
  },
  quoteInfoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },

  // ── Divider ──────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 12,
  },
  dividerPrimary: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    marginBottom: 16,
  },

  // ── Client section ───────────────────────────────
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  clientGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  clientCol: {
    flex: 1,
    gap: 4,
  },
  clientRow: {
    flexDirection: 'row',
    gap: 4,
  },
  clientLabel: {
    fontSize: 8,
    color: GRAY,
    width: 50,
  },
  clientValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },

  // ── Table ────────────────────────────────────────
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 8.5,
    color: DARK,
  },
  tableCellGray: {
    fontSize: 8,
    color: GRAY,
  },

  // Column widths
  colCode:     { width: '12%' },
  colDesc:     { width: '40%' },
  colQty:      { width: '10%', textAlign: 'right' },
  colUnit:     { width: '18%', textAlign: 'right' },
  colTotal:    { width: '20%', textAlign: 'right' },

  // ── Totals ───────────────────────────────────────
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  totalsBox: {
    width: '45%',
    gap: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalLabel: {
    fontSize: 8.5,
    color: GRAY,
  },
  totalValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: PRIMARY,
    borderRadius: 3,
    marginTop: 2,
  },
  totalFinalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  totalFinalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },

  // ── Conditions ───────────────────────────────────
  conditionsBox: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  conditionsTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  conditionBullet: {
    fontSize: 8,
    color: PRIMARY,
    marginTop: 1,
  },
  conditionText: {
    fontSize: 8,
    color: GRAY,
    flex: 1,
    lineHeight: 1.4,
  },

  // ── Footer ───────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
  },
});

interface QuotePDFProps {
  quoteNumber: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  items: QuoteItem[];
  stampingType?: StampingType | null;
  stampingPrice: number;
  shippingService?: string | null;
  shippingPrice?: number;
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export function QuotePDF({
  quoteNumber,
  createdAt,
  customerName,
  customerEmail,
  customerPhone,
  customerCompany,
  items,
  stampingType,
  stampingPrice,
  shippingService,
  shippingPrice = 0,
}: QuotePDFProps) {
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const stampingPerUnit = totalUnits > 0 ? stampingPrice / totalUnits : 0;

  // Client-facing unit prices: (product cost + stamping per unit) × 1.5 markup
  const productSubtotal = items.reduce(
    (s, i) => s + Math.round((i.unitPrice + stampingPerUnit) * 1.5) * i.quantity,
    0,
  );
  const subtotal = productSubtotal;
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva + shippingPrice;

  const date = new Date(createdAt).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const validUntil = new Date(
    new Date(createdAt).getTime() + company.quoteValidity * 24 * 60 * 60 * 1000,
  ).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Document title={`Cotización ${quoteNumber}`} author={company.name}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.logoBlock}>
            <Text style={s.logoText}>Suvenirs</Text>
            <Text style={s.companyInfo}>
              {company.name}{'\n'}
              RUT: {company.rut}{'\n'}
              {company.address}{'\n'}
              {company.city}{'\n'}
              {company.phone}  ·  {company.email}
            </Text>
          </View>

          <View style={s.quoteInfoBox}>
            <Text style={s.quoteTitle}>Cotización</Text>
            <View style={s.quoteInfoRow}>
              <Text style={s.quoteInfoLabel}>N°</Text>
              <Text style={s.quoteInfoValue}>{quoteNumber}</Text>
            </View>
            <View style={s.quoteInfoRow}>
              <Text style={s.quoteInfoLabel}>Fecha</Text>
              <Text style={s.quoteInfoValue}>{date}</Text>
            </View>
            <View style={s.quoteInfoRow}>
              <Text style={s.quoteInfoLabel}>Válida hasta</Text>
              <Text style={s.quoteInfoValue}>{validUntil}</Text>
            </View>
            <View style={s.quoteInfoRow}>
              <Text style={s.quoteInfoLabel}>Total unidades</Text>
              <Text style={s.quoteInfoValue}>{totalUnits}</Text>
            </View>
          </View>
        </View>

        <View style={s.dividerPrimary} />

        {/* ── DATOS DEL CLIENTE ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Datos del cliente</Text>
          <View style={s.clientGrid}>
            <View style={s.clientCol}>
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>Nombre</Text>
                <Text style={s.clientValue}>{customerName || '—'}</Text>
              </View>
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>Empresa</Text>
                <Text style={s.clientValue}>{customerCompany || '—'}</Text>
              </View>
            </View>
            <View style={s.clientCol}>
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>Email</Text>
                <Text style={s.clientValue}>{customerEmail || '—'}</Text>
              </View>
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>Teléfono</Text>
                <Text style={s.clientValue}>{customerPhone || '—'}</Text>
              </View>
            </View>
            {shippingService && (
              <View style={s.clientCol}>
                <View style={s.clientRow}>
                  <Text style={s.clientLabel}>Despacho</Text>
                  <Text style={s.clientValue}>
                    {shippingService === 'santiago' ? 'Santiago' : 'Regiones'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* ── TABLA DE PRODUCTOS ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle de productos y servicios</Text>
          <View style={s.table}>
            {/* Header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, s.colCode]}>Código</Text>
              <Text style={[s.tableHeaderCell, s.colDesc]}>Descripción</Text>
              <Text style={[s.tableHeaderCell, s.colQty]}>Cant.</Text>
              <Text style={[s.tableHeaderCell, s.colUnit]}>P. Unitario</Text>
              <Text style={[s.tableHeaderCell, s.colTotal]}>Precio neto</Text>
            </View>

            {/* Product rows */}
            {items.map((item, i) => {
              const clientUnitPrice = Math.round((item.unitPrice + stampingPerUnit) * 1.5);
              const lineTotal = clientUnitPrice * item.quantity;
              return (
                <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCellGray, s.colCode]}>{item.productId}</Text>
                  <Text style={[s.tableCell, s.colDesc]}>{item.productName}</Text>
                  <Text style={[s.tableCell, s.colQty]}>{item.quantity}</Text>
                  <Text style={[s.tableCell, s.colUnit]}>{formatCLP(clientUnitPrice)}</Text>
                  <Text style={[s.tableCell, s.colTotal]}>{formatCLP(lineTotal)}</Text>
                </View>
              );
            })}

          </View>
        </View>

        {/* ── TOTALES ── */}
        <View style={s.totalsContainer}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal neto</Text>
              <Text style={s.totalValue}>{formatCLP(subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA (19%)</Text>
              <Text style={s.totalValue}>{formatCLP(iva)}</Text>
            </View>
            {shippingPrice > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  Despacho{shippingService ? ` (${shippingService === 'santiago' ? 'Santiago' : 'Regiones'})` : ''}
                </Text>
                <Text style={s.totalValue}>{formatCLP(shippingPrice)}</Text>
              </View>
            )}
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLabel}>TOTAL</Text>
              <Text style={s.totalFinalValue}>{formatCLP(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── CONDICIONES ── */}
        <View style={s.conditionsBox}>
          <Text style={s.conditionsTitle}>Términos y condiciones</Text>
          {company.conditions.map((c, i) => (
            <View key={i} style={s.conditionItem}>
              <Text style={s.conditionBullet}>•</Text>
              <Text style={s.conditionText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {company.email}  ·  {company.phone}  ·  {company.website}
          </Text>
          <Text style={s.footerBrand}>{company.name}</Text>
        </View>

      </Page>
    </Document>
  );
}
