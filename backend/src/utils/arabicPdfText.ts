/**
 * PDFKit renders text left-to-right. Fontkit applies Arabic shaping and RTL
 * glyph placement when the rtla OpenType feature is enabled — do not reshape
 * or bidi-reorder strings beforehand (that breaks rendering).
 */

/** Pass-through; kept for a single call site in the PDF generator. */
export function prepareArabicText(text: string): string {
  return text;
}

/** Western digits + percent — render with a Latin font, not through writeRtl. */
export function formatPercent(value: number): string {
  return `${value}%`;
}

/** Label + value pair for RTL lines. */
export function arabicLabel(label: string, value: string): string {
  return `${label} ${value}`;
}

export const PDF_RTL_FEATURES = ["rtla"] as const;
