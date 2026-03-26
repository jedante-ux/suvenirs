'use client';

import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { QuoteItem, StampingType } from '@/types';

interface Props {
  quoteNumber: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  items: QuoteItem[];
  stampingType?: StampingType | null;
  stampingPrice: number;
  shippingService?: string | null;
  shippingPrice?: number;
}

export function QuotePDFPreview(props: Props) {
  const docProps = { ...props };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex justify-end flex-shrink-0">
        <PDFDownloadLink
          document={<QuotePDF {...docProps} />}
          fileName={`cotizacion-${props.quoteNumber}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: 8, flex: 1 }}>
        <QuotePDF {...docProps} />
      </PDFViewer>
    </div>
  );
}
