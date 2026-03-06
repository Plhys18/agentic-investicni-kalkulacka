import React, { useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import { useLanguage } from '@/hooks/useLanguage';

interface ExportButtonsProps {
  printRef: React.RefObject<HTMLDivElement>;
  pdfData: { title: string; inputs: Record<string, string>; results: Record<string, string> };
  tabName: string;
}

/** Strip diacritics for jsPDF which doesn't support them natively */
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ printRef, pdfData, tabName }) => {
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const { t } = useLanguage();

  const handlePDF = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toISOString().slice(0, 10);
    const s = stripDiacritics;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(s(`${pdfData.title}`), 20, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`${date}`, 20, 30);
    doc.setTextColor(0, 0, 0);

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 34, 190, 34);

    let y = 42;

    // Inputs section
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(s('Vstupni parametry'), 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(pdfData.inputs).forEach(([key, val]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(s(key), 25, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(s(val), 190, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    // Divider
    y += 3;
    doc.line(20, y, 190, y);
    y += 8;

    // Results section
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(s('Vysledky'), 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(pdfData.results).forEach(([key, val]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(s(key), 25, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(s(val), 190, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    // Footer
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(s('Investicni Kalkulacka — vojtazizka.cz'), 20, y);

    doc.save(`investicni-kalkulacka-${tabName}-${date}.pdf`);
  }, [pdfData, tabName]);

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
