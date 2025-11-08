
import jsPDF from 'jspdf';
// FIX: Switched to functional import for jspdf-autotable to resolve module augmentation error.
import autoTable from 'jspdf-autotable';
import type { QuotationData, ProductItem } from '../types';
import { numberToWords } from '../utils/numberToWords';
import { watermarkImage } from '../assets/watermark';

// FIX: Removed module augmentation for 'jspdf' which was causing the error:
// "Invalid module name in augmentation, module 'jspdf' cannot be found."
/*
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
*/

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount).replace('₹', 'Rs.');
};

export const generatePdf = (data: QuotationData) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const topMargin = 12; 
    const bottomMargin = 20;
    let yPos = topMargin;

    // Header
    if (data.logo) {
      doc.addImage(data.logo, 'PNG', pageWidth / 2 - 25, yPos, 50, 20);
      yPos += 22;
    } else {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SREE MEDITEC', pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('New No: 18, Old No: 2, Bajanai Koil Street, Rajajipakkam, Chennai 600 073.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4.5;
    doc.text('Mob: 9884818398.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4.5;
    doc.text('GST NO: 33APGPS4675G2ZL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8; // Increased spacing
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleText = 'Quotation';
    const textWidth = doc.getTextWidth(titleText);
    const textX = pageWidth / 2;
    
    const lineLength = textWidth + 4; // Shortened line
    const lineX1 = textX - lineLength / 2;
    const lineX2 = textX + lineLength / 2;

    doc.setLineWidth(0.5);
    doc.line(lineX1, yPos + 2, lineX2, yPos + 2); // Increased space between text and line
    doc.text(titleText, textX, yPos, { align: 'center' });
    yPos += 8; // Increased spacing

    // Ref and Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${data.refNo}`, 14, yPos);
    doc.text(`Date: ${data.date}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 8; // Increased spacing

    // Client Details
    doc.text('To,', 14, yPos);
    yPos += 4.5;
    const clientAddressLines = doc.splitTextToSize(data.client.address, 80);
    doc.text(data.client.name, 14, yPos);
    yPos += 4.5;
    doc.text(clientAddressLines, 14, yPos);
    yPos += clientAddressLines.length * 4.5;
    if (data.client.gst) {
        doc.text(`GST: ${data.client.gst}`, 14, yPos);
        yPos += 4.5;
    }
    yPos += 8; // Increased spacing
    
    // Subject
    const productNames = data.products.map(p => p.name).join(' and ');
    doc.setFont('helvetica', 'bold');
    doc.text(`Sub: Reg. Price Quotation for ${productNames}.`, 14, yPos);
    yPos += 7; // Increased spacing
    
    doc.setFont('helvetica', 'normal');
    doc.text('Sir, this is with ref to the discussion we had with you we are happy in submitting our quotation for the same.', 14, yPos);
    yPos += 8; // Increased spacing

    // Products Table
    const tableData = data.products.map((p: ProductItem) => {
        const baseAmount = p.quantity * p.rate;
        const gstAmount = baseAmount * (p.gstRate / 100);
        const totalAmount = baseAmount + gstAmount;
        const featuresText = p.features.split('\n').map(f => `• ${f}`).join('\n');
        return [
            p.name,
            p.model,
            featuresText,
            `${p.quantity} no`,
            formatCurrency(p.rate),
            `${p.gstRate}%`,
            formatCurrency(gstAmount),
            `${formatCurrency(totalAmount)}\n(${numberToWords(totalAmount)})`
        ];
    });

    // FIX: Switched to functional call for jspdf-autotable.
    autoTable(doc, {
        startY: yPos,
        head: [['Product', 'Model', 'Features', 'Qty', 'Rate', 'GST %', 'GST Amount', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
        },
        styles: {
            cellPadding: 2,
            fontSize: 9,
            valign: 'top',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { cellWidth: 45, halign: 'left' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
        },
        didParseCell: function (data) {
            if (data.section === 'head') {
                if (data.column.index >= 3) { // Center headers for Qty, Rate, etc.
                    data.cell.styles.halign = 'center';
                }
            }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10; // Increased spacing

    // Totals
    const subTotal = data.products.reduce((acc, p) => {
        const baseAmount = p.quantity * p.rate;
        const totalAmount = baseAmount + (baseAmount * (p.gstRate / 100));
        return acc + totalAmount;
    }, 0);
    const freightGstAmount = data.freight > 0 ? data.freight * (data.freightGstRate / 100) : 0;
    const grandTotal = subTotal + data.freight + freightGstAmount;
    const roundedGrandTotal = Math.round(grandTotal);
    const roundingOff = roundedGrandTotal - grandTotal;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const totalsSectionWidth = 85;
    const totalsValueX = pageWidth - 14; 
    const totalsStartX = totalsValueX - totalsSectionWidth;
    const totalsLabelX = totalsValueX - 45; 


    doc.text('Sub Total:', totalsLabelX, yPos, { align: 'right' });
    doc.text(formatCurrency(subTotal), totalsValueX, yPos, { align: 'right' });
    yPos += 6; // Increased spacing
    
    if (data.freight > 0) {
      doc.text('Freight:', totalsLabelX, yPos, { align: 'right' });
      doc.text(formatCurrency(data.freight), totalsValueX, yPos, { align: 'right' });
      yPos += 6; // Increased spacing

      doc.text(`GST @ ${data.freightGstRate}% on Freight:`, totalsLabelX, yPos, { align: 'right' });
      doc.text(formatCurrency(freightGstAmount), totalsValueX, yPos, { align: 'right' });
      yPos += 6; // Increased spacing
    }
    
    if (roundingOff !== 0) {
        doc.text('Rounding Off:', totalsLabelX, yPos, { align: 'right' });
        doc.text(formatCurrency(roundingOff), totalsValueX, yPos, { align: 'right' });
        yPos += 6;
    }

    yPos += 2; // Add space before the line
    doc.setLineWidth(0.5);
    doc.line(totalsStartX, yPos, totalsValueX, yPos);
    yPos += 5; // Increased space after the line
    doc.text('Grand Total:', totalsLabelX, yPos, { align: 'right' });
    doc.text(formatCurrency(roundedGrandTotal), totalsValueX, yPos, { align: 'right' });
    yPos += 10; // Increased spacing

    // Terms and Conditions
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and condition:', 14, yPos);
    yPos += 6; // Increased spacing

    const terms = [
        { label: 'Validity', value: 'The above price is valid up to 30 days from the date of submission of the Quotation.' },
        { label: 'Taxes', value: `GST is applicable to the price mentioned as per item-wise rates.` },
        { label: 'Payment', value: data.terms.payment },
        { label: 'Banking details', value: `Bank name: ${data.bankDetails.name}\nBranch name: ${data.bankDetails.branch}\nA/C name: ${data.bankDetails.accName}\nA/C type: ${data.bankDetails.accType}\nA/C No: ${data.bankDetails.accNo}\nIFSC Code: ${data.bankDetails.ifsc}` },
        { label: 'Delivery', value: data.terms.delivery },
        { label: 'Warranty', value: data.terms.warranty },
    ];

    doc.setFont('helvetica', 'bold');
    const maxLabelWidth = Math.max(...terms.map(term => doc.getTextWidth(term.label)));
    
    const labelX = 20;
    const colonX = labelX + maxLabelWidth + 1;
    const valueX = colonX + 3;
    const valueWidth = pageWidth - valueX - 14;

    terms.forEach(term => {
        const valueLines = doc.splitTextToSize(term.value, valueWidth);
        const neededHeight = valueLines.length * 4.5 + 1.5;

        if (yPos + neededHeight > pageHeight - bottomMargin) {
            doc.addPage();
            yPos = topMargin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(term.label, labelX, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(':', colonX, yPos);
        doc.text(valueLines, valueX, yPos);
        yPos += neededHeight;
    });

    yPos += 4; // Add a bit of space after terms

    // Check if the entire closing section will fit on the current page
    const signatureBlockHeight = 25; // Increased height for stamp
    const closingHeight = 10 + 4.5 + 4.5 + signatureBlockHeight + 4.5 + 4.5;

    if (yPos + closingHeight > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = topMargin;
    }

    // Closing
    doc.setFont('helvetica', 'normal');
    doc.text('Thanking you and looking forward for your order.', 14, yPos);
    yPos += 10; // Increased spacing
    doc.text('With Regards,', 14, yPos);
    yPos += 4.5;
    doc.text('For SREE MEDITEC,', 14, yPos);

    const hasStamp = !!data.stamp;
    const hasSignature = !!data.signature;

    if (hasStamp) {
        yPos += 3;
        const stampProps = { x: 14, y: yPos, w: 40, h: 20 };
        const sigProps = { x: 14, y: yPos + (stampProps.h - 15) / 2, w: 40, h: 15 };

        doc.addImage(data.stamp!, 'PNG', stampProps.x, stampProps.y, stampProps.w, stampProps.h);
        if (hasSignature) {
            doc.addImage(data.signature!, 'PNG', sigProps.x, sigProps.y, sigProps.w, sigProps.h);
        }
        yPos += stampProps.h + 3;

    } else if (hasSignature) {
        yPos += 3;
        const sigProps = { x: 14, y: yPos, w: 40, h: 15 };
        doc.addImage(data.signature!, 'PNG', sigProps.x, sigProps.y, sigProps.w, sigProps.h);
        yPos += sigProps.h + 3;
    } else {
        yPos += 20; // Original empty space
    }

    doc.setFont('helvetica', 'bold');
    doc.text('S. Suresh Kumar.', 14, yPos);
    yPos += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.text('9884818398', 14, yPos);
    
    // Add watermark to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    const watermarkWidth = 120;
    const watermarkHeight = 120;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Set transparency. GState is not in the default types, so we cast to any.
      doc.setGState(new (doc as any).GState({ opacity: 0.3 }));

      // Add the watermark image to the center of the page
      const x = (pageWidth - watermarkWidth) / 2;
      const y = (pageHeight - watermarkHeight) / 2;
      doc.addImage(watermarkImage, 'PNG', x, y, watermarkWidth, watermarkHeight);

      // Reset transparency to avoid affecting other elements
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }

    doc.save(`Quotation-${data.refNo.replace(/\//g, '-')}.pdf`);
};
