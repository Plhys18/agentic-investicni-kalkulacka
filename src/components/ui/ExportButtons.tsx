import React, { useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '@/hooks/useLanguage';

interface ExportButtonsProps {
  printRef: React.RefObject<HTMLDivElement>;
  pdfData: { title: string; inputs: Record<string, string>; results: Record<string, string> };
  tabName: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ printRef, pdfData, tabName }) => {
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const { t } = useLanguage();

  const handlePDF = useCallback(async () => {
    if (!printRef.current) return;

    const el = printRef.current;
    // Temporarily expand for capture
    const origOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    el.style.overflow = origOverflow;

    const imgData = canvas.toDataURL('image/png');
    const imgW = canvas.width;
    const imgH = canvas.height;

    // A4 dimensions in mm
    const pdfW = 210;
    const margin = 10;
    const contentW = pdfW - margin * 2;
    const contentH = (imgH * contentW) / imgW;

    const doc = new jsPDF({
      orientation: contentH > 297 - margin * 2 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageH = doc.internal.pageSize.getHeight() - margin * 2;

    if (contentH <= pageH) {
      doc.addImage(imgData, 'PNG', margin, margin, contentW, contentH);
    } else {
      // Multi-page: slice the canvas
      const pageCanvasH = (pageH / contentH) * imgH;
      let srcY = 0;
      let page = 0;
      while (srcY < imgH) {
        if (page > 0) doc.addPage();
        const sliceH = Math.min(pageCanvasH, imgH - srcY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgW;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const drawH = (sliceH * contentW) / imgW;
        doc.addImage(sliceData, 'PNG', margin, margin, contentW, drawH);
        srcY += sliceH;
        page++;
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`investicni-kalkulacka-${tabName}-${date}.pdf`);
  }, [printRef, tabName]);

  return (
    <div className="flex gap-3 no-print">
      <button onClick={handlePDF} className="btn-primary flex items-center gap-2">
        <Download size={16} />
        {t('common.exportPDF')}
      </button>
      <button onClick={() => handlePrint()} className="btn-secondary flex items-center gap-2">
        <Printer size={16} />
        {t('common.print')}
      </button>
    </div>
  );
};

export default ExportButtons;
