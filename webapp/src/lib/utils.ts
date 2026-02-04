import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format text by replacing literal \n with actual line breaks
 * @param text - Text with literal \n characters
 * @returns Formatted text with proper line breaks
 */
export function formatDescription(text: string): string {
  if (!text) return '';

  return text
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
    .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newline
    .trim();
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ParsedProductDescription {
  productCode: string;
  description: string;
  specs: ProductSpec[];
  recommendations: string[];
}

/**
 * Parse product description to separate main description from specifications
 * @param rawDescription - Raw description from database with \\n characters
 * @returns Parsed object with description, specs, and recommendations
 */
export function parseProductDescription(rawDescription: string): ParsedProductDescription {
  if (!rawDescription) {
    return { productCode: '', description: '', specs: [], recommendations: [] };
  }

  // Replace literal \n with actual newlines and clean up
  const text = rawDescription
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Known spec labels to detect where specs section starts
  const specLabels = [
    'Tamaño',
    'Tamaño Cerrado',
    'Tamaño Abierto',
    'Material',
    'Argolla',
    'Presentación',
    'Embalaje',
    'Embalaje Master',
    'Tamaño Caja Master',
    'Peso Caja Master',
    'Opciones de Personalización',
    'Altura',
    'Diámetro',
    'Código',
    'Placa mm.',
  ];

  // Find where specs section starts
  let specsStartIndex = -1;
  for (const label of specLabels) {
    const regex = new RegExp(`\\n\\s*${label}\\s*\\n`, 'i');
    const match = text.search(regex);
    if (match !== -1 && (specsStartIndex === -1 || match < specsStartIndex)) {
      specsStartIndex = match;
    }
  }

  let mainText = text;
  let specsText = '';

  if (specsStartIndex !== -1) {
    mainText = text.substring(0, specsStartIndex).trim();
    specsText = text.substring(specsStartIndex).trim();
  }

  // Extract product code (first line if it looks like a code)
  const lines = mainText.split('\n').map(l => l.trim()).filter(l => l);
  let productCode = '';
  let description = mainText;

  if (lines.length > 0) {
    const firstLine = lines[0];
    // Check if first line is a product code (short alphanumeric, possibly with numbers)
    if (/^[A-Z0-9]{1,10}$/i.test(firstLine)) {
      productCode = firstLine;
      description = lines.slice(1).join('\n').trim();
    }
  }

  // Parse specs into key-value pairs
  const specs: ProductSpec[] = [];
  if (specsText) {
    // Split by known labels
    const specLines = specsText.split('\n').map(l => l.trim()).filter(l => l);

    for (let i = 0; i < specLines.length; i++) {
      const line = specLines[i];

      // Check if this line is a label
      const isLabel = specLabels.some(label =>
        line.toLowerCase() === label.toLowerCase() ||
        line.toLowerCase().startsWith(label.toLowerCase())
      );

      if (isLabel && i + 1 < specLines.length) {
        const value = specLines[i + 1];
        // Skip if value is also a label or is empty/just symbols
        const valueIsLabel = specLabels.some(l => value.toLowerCase() === l.toLowerCase());
        if (!valueIsLabel && value && !/^[\s\n]*$/.test(value)) {
          specs.push({ label: line, value });
          i++; // Skip the value line
        }
      }
    }
  }

  // Extract recommendations if present
  const recommendations: string[] = [];
  const recMatch = text.match(/Recomendaciones[^:]*:([\s\S]*?)(?=\n\n\n|$)/i);
  if (recMatch) {
    const recText = recMatch[1];
    const recLines = recText
      .split(/\d+\.-/)
      .map(l => l.trim())
      .filter(l => l);
    recommendations.push(...recLines);
  }

  // Filter out empty or useless specs
  const filteredSpecs = specs.filter(spec =>
    spec.value &&
    spec.value !== 'Unidades.' &&
    spec.value !== 'cms.' &&
    spec.value !== 'Kg.' &&
    !spec.label.toLowerCase().includes('opciones de personalización')
  );

  return {
    productCode,
    description,
    specs: filteredSpecs,
    recommendations,
  };
}
