import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Capture the off-screen Policy Brief document and emit a clean A4/Letter PDF.
 * The element passed in MUST be the dedicated brief layout (NOT the dashboard).
 */
export async function exportPolicyBriefAsPdf(
  briefEl: HTMLElement,
  filename = "EconLever-Policy-Brief.pdf"
) {
  // Move brief into the viewport so html2canvas can measure it correctly,
  // but keep it visually hidden behind everything via clip-path.
  const prev = {
    left: briefEl.style.left,
    top: briefEl.style.top,
    visibility: briefEl.style.visibility,
    pointerEvents: briefEl.style.pointerEvents,
    clipPath: briefEl.style.clipPath,
  };
  briefEl.style.left = "0";
  briefEl.style.top = "0";
  briefEl.style.pointerEvents = "none";
  // clip-path keeps the element invisible to the user but still rendered/measured
  briefEl.style.clipPath = "inset(0 100% 100% 0)";

  // Allow a paint frame so Recharts can measure and draw
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 60));

  try {
    const canvas = await html2canvas(briefEl, {
      // Higher scale = sharper text in the rasterized PDF (less blur,
      // visibly thicker strokes). 3x is the sweet spot before file size
      // balloons.
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: briefEl.offsetWidth,
      height: briefEl.offsetHeight,
      windowWidth: briefEl.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/png");

    // Letter size in points: 612 x 792 (PDF uses 72dpi)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
      compress: true,
    });

    // Embed proper PDF metadata so the document title shows the brand
    // (visible in browser PDF tab titles, OS file inspectors, and most readers).
    pdf.setProperties({
      title: "EconLever Policy Brief",
      subject: "U.S. Fiscal & Monetary Policy Simulation, 10-Year Projection",
      author: "EconLever",
      creator: "EconLever",
      keywords: "EconLever, policy, fiscal, monetary, GDP, deficit, Gini",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 0;
    const renderWidth = pageWidth - margin * 2;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    // Always fit the brief onto a single Letter page. If the rendered
    // content is slightly taller than the page, scale it down proportionally
    // and center it horizontally, this prevents stray blank trailing pages.
    let drawWidth = renderWidth;
    let drawHeight = renderHeight;
    if (renderHeight > pageHeight) {
      const scale = pageHeight / renderHeight;
      drawHeight = pageHeight;
      drawWidth = renderWidth * scale;
    }
    const offsetX = (pageWidth - drawWidth) / 2;
    const offsetY = 0;
    pdf.addImage(imgData, "PNG", offsetX, offsetY, drawWidth, drawHeight);

    pdf.save(filename);
  } finally {
    briefEl.style.left = prev.left || "-10000px";
    briefEl.style.top = prev.top || "0";
    briefEl.style.visibility = prev.visibility;
    briefEl.style.pointerEvents = prev.pointerEvents;
    briefEl.style.clipPath = prev.clipPath;
  }
}
