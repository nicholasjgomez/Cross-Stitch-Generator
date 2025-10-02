import { jsPDF } from 'jspdf';

export const generatePdf = async (
    patternCanvas: HTMLCanvasElement, 
    instructions: string, 
    stitchesX: number, 
    stitchesY: number
): Promise<void> => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        // --- Page 1: Pattern Image with Grid ---
        doc.setFontSize(20);
        doc.text('Cross-Stitch Silhouette Pattern', margin, margin);

        const imgData = patternCanvas.toDataURL('image/png');
        const imgWidth = patternCanvas.width;
        const imgHeight = patternCanvas.height;
        const aspectRatio = imgWidth / imgHeight;

        let pdfImgWidth = contentWidth;
        let pdfImgHeight = contentWidth / aspectRatio;
        
        if (pdfImgHeight > contentHeight * 0.8) {
             pdfImgHeight = contentHeight * 0.8;
             pdfImgWidth = pdfImgHeight * aspectRatio;
        }

        const gridX = margin;
        const gridY = margin + 30; // Extra space for title and top numbers

        // Draw Grid
        doc.setLineWidth(0.5);
        doc.setDrawColor('#E2E8F0'); // slate-200 for minor lines

        // Minor grid lines
        for (let i = 0; i <= stitchesX; i++) {
            const x = gridX + (i / stitchesX) * pdfImgWidth;
            doc.line(x, gridY, x, gridY + pdfImgHeight);
        }
        for (let i = 0; i <= stitchesY; i++) {
            const y = gridY + (i / stitchesY) * pdfImgHeight;
            doc.line(gridX, y, gridX + pdfImgWidth, y);
        }

        // Major grid lines (every 10)
        doc.setLineWidth(1);
        doc.setDrawColor('#94A3B8'); // slate-400 for major lines
        for (let i = 0; i <= stitchesX; i += 10) {
            const x = gridX + (i / stitchesX) * pdfImgWidth;
            doc.line(x, gridY, x, gridY + pdfImgHeight);
        }
        for (let i = 0; i <= stitchesY; i += 10) {
            const y = gridY + (i / stitchesY) * pdfImgHeight;
            doc.line(gridX, y, gridX + pdfImgWidth, y);
        }
        
        // Grid numbers
        doc.setFontSize(8);
        doc.setTextColor('#475569'); // slate-600
        
        for (let i = 10; i <= stitchesX; i += 10) {
            const x = gridX + (i / stitchesX) * pdfImgWidth;
            doc.text(String(i), x, gridY - 5, { align: 'center' });
        }

        for (let i = 10; i <= stitchesY; i += 10) {
            const y = gridY + (i / stitchesY) * pdfImgHeight + 3; // +3 to vertically center
            doc.text(String(i), gridX - 5, y, { align: 'right' });
        }

        doc.addImage(imgData, 'PNG', gridX, gridY, pdfImgWidth, pdfImgHeight);

        // --- Page 2: Instructions ---
        if (instructions) {
            doc.addPage();
            doc.setFontSize(20);
            doc.text('Instructions', margin, margin);
            
            doc.setFontSize(10);
            const instructionLines = doc.splitTextToSize(instructions, contentWidth);
            doc.text(instructionLines, margin, margin + 20);
        }

        doc.save('cross-stitch-silhouette-pattern.pdf');

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Could not generate PDF. Please try again.');
    }
};
