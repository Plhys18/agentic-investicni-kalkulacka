import React, { useRef, useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';

interface ExportButtonsProps {
  printRef: React.RefObject<HTMLDivElement>;
  pdfData: { title: string; inputs: Record<string, string>; results: Record<string, string> };
  tabName: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ printRef, pdfData, tabName }) => {
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handlePDF = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toISOString().slice(0, 10);

    doc.setFontSize(16);
    doc.text(`Investicni Kalkulacka - ${pdfData.title}`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Datum: ${date}`, 20, 30);

    let y = 45;
    doc.setFontSize(12);
    doc.text('Vstupni parametry:', 20, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(pdfData.inputs).forEach(([key, val]) => {
      doc.text(`${key}: ${val}`, 25, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    y += 5;
    doc.setFontSize(12);
    doc.text('Vysledky:', 20, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(pdfData.results).forEach(([key, val]) => {
      doc.text(`${key}: ${val}`, 25, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save(`investicni-kalkulacka-${tabName}-${date}.pdf`);
  }, [pdfData, tabName]);

  return (
    <div className="flex gap-3 no-print">
      <button onClick={handlePDF} className="btn-primary flex items-center gap-2">
        <Download size={16} />
        Exportovat PDF
      </button>
      <button onClick={() => handlePrint()} className="btn-secondary flex items-center gap-2">
        <Printer size={16} />
        Tisknout
      </button>
    </div>
  );
};

export default ExportButtons;
