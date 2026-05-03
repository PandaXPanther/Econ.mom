// Generic policy brief PDF exporter — used by every tool that supports
// "Export Policy Brief (PDF)". Same engine as the EconLever exporter
// (jsPDF + html2canvas, scale=3, single Letter page) but tool-neutral.
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface BriefMeta {
  title: string;       // PDF doc title (browser tab + reader UI)
  subject?: string;
  filename: string;    // download filename, including ".pdf"
  author?: string;
}

/** Capture an off-screen brief element and download it as a single-page PDF. */
export async function exportBriefAsPdf(
  briefEl: HTMLElement,
  meta: BriefMeta,
) {
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
  briefEl.style.clipPath = "inset(0 100% 100% 0)";

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 80));

  try {
    const canvas = await html2canvas(briefEl, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: briefEl.offsetWidth,
      height: briefEl.offsetHeight,
      windowWidth: briefEl.scrollWidth,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter", compress: true });
    pdf.setProperties({
      title: meta.title,
      subject: meta.subject ?? meta.title,
      author: meta.author ?? "econ.mom",
      creator: "econ.mom",
      keywords: "econ.mom, policy brief, economics",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const renderWidth = pageWidth;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;
    let drawWidth = renderWidth;
    let drawHeight = renderHeight;
    if (renderHeight > pageHeight) {
      const scale = pageHeight / renderHeight;
      drawHeight = pageHeight;
      drawWidth = renderWidth * scale;
    }
    const offsetX = (pageWidth - drawWidth) / 2;
    pdf.addImage(imgData, "PNG", offsetX, 0, drawWidth, drawHeight);
    pdf.save(meta.filename);
  } finally {
    briefEl.style.left = prev.left || "-10000px";
    briefEl.style.top = prev.top || "0";
    briefEl.style.visibility = prev.visibility;
    briefEl.style.pointerEvents = prev.pointerEvents;
    briefEl.style.clipPath = prev.clipPath;
  }
}
