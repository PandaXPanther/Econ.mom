// Policy brief PDF exporter. DOM-renders a hidden printable brief, captures
// it with html2canvas, and embeds the result into a single-page jsPDF.
// Usage:
//   await exportBriefFromElement(ref.current, "EconLever-Policy-Brief.pdf");
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportBriefFromElement(
  el: HTMLElement,
  filename: string
): Promise<void> {
  // Render at higher scale so the PDF is crisp. Force a white background
  // so dark mode users still get a print-friendly brief.
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter", // 612 x 792 pt
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit the brief to the page, preserving aspect ratio.
  const imgRatio = canvas.width / canvas.height;
  const pageRatio = pageWidth / pageHeight;

  let drawW = pageWidth;
  let drawH = pageWidth / imgRatio;
  if (imgRatio < pageRatio) {
    drawH = pageHeight;
    drawW = pageHeight * imgRatio;
  }

  const offsetX = (pageWidth - drawW) / 2;
  const offsetY = (pageHeight - drawH) / 2;

  pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH, undefined, "FAST");
  pdf.save(filename);
}

export function todayLong(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
