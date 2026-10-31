import PDFDocument from 'pdfkit';

export function generateInvoicePdf(invoice: any, lineItems: any[] = []): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const formatCurrency = (val: number) => `INR ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      const formatDate = (val: string) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

      // --- Header Banner ---
      doc.rect(40, 40, 515, 65).fill('#4F46E5');

      doc.fillColor('#FFFFFF')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('BRIGHTLOOP SOFTWARE', 55, 52);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#E0E7FF')
         .text('Subscription Billing & Recurring Invoicing Platform', 55, 78);

      const status = (invoice.status || 'CONFIRMED').toUpperCase();
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text(`STATUS: ${status}`, 420, 64, { align: 'right', width: 120 });

      // --- Invoice Meta & Billed To ---
      doc.y = 125;

      // Left Column: Customer Info
      doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('BILLED TO:', 45, 125);
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text(invoice.customer_name || 'Customer', 45, 138);
      
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      let currentY = 153;
      if (invoice.customer_company) {
        doc.text(invoice.customer_company, 45, currentY);
        currentY += 13;
      }
      doc.fillColor('#4F46E5').text(invoice.customer_email || 'yashchharra@gmail.com', 45, currentY);
      currentY += 13;
      if (invoice.customer_address) {
        doc.fillColor('#64748B').text(invoice.customer_address, 45, currentY);
      }

      // Right Column: Invoice Details
      doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('INVOICE DETAILS:', 340, 125);
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`Invoice #: ${invoice.invoice_number}`, 340, 138);
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text(`Issue Date: ${formatDate(invoice.issue_date || invoice.invoice_date)}`, 340, 153);
      doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 340, 166);
      if (invoice.subscription_number) {
        doc.text(`Subscription: ${invoice.subscription_number}`, 340, 179);
      }
      if (invoice.billing_cycle_start && invoice.billing_cycle_end) {
        doc.text(`Cycle: ${formatDate(invoice.billing_cycle_start)} - ${formatDate(invoice.billing_cycle_end)}`, 340, 192);
      }

      // --- Line Items Table ---
      const tableTop = 225;
      doc.rect(40, tableTop, 515, 22).fill('#F1F5F9');

      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
      doc.text('ITEM DESCRIPTION', 50, tableTop + 6);
      doc.text('QTY', 280, tableTop + 6, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', 330, tableTop + 6, { width: 70, align: 'right' });
      doc.text('TAX', 410, tableTop + 6, { width: 50, align: 'right' });
      doc.text('AMOUNT', 470, tableTop + 6, { width: 75, align: 'right' });

      let rowY = tableTop + 28;
      const items = lineItems && lineItems.length > 0 ? lineItems : [
        {
          product_name: 'Subscription Plan Recurring Fee',
          variant_name: '',
          quantity: 1,
          unit_price: invoice.subtotal || invoice.total_amount,
          tax_rate: invoice.tax_rate || 18,
          tax_amount: invoice.tax_amount || 0,
          amount: invoice.total_amount
        }
      ];

      items.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.rect(40, rowY - 4, 515, 24).fill('#F8FAFC');
        }

        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
        doc.text(item.product_name || 'Software Subscription', 50, rowY);
        
        if (item.variant_name) {
          doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Variant: ${item.variant_name}`, 50, rowY + 11);
        }

        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        doc.text(String(item.quantity || 1), 280, rowY, { width: 40, align: 'center' });
        doc.text(formatCurrency(item.unit_price), 330, rowY, { width: 70, align: 'right' });
        doc.text(`${item.tax_rate || 0}%`, 410, rowY, { width: 50, align: 'right' });
        
        doc.font('Helvetica-Bold').fillColor('#0F172A');
        doc.text(formatCurrency(item.amount), 470, rowY, { width: 75, align: 'right' });

        rowY += item.variant_name ? 26 : 22;
      });

      // Divider line
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, rowY + 5).lineTo(555, rowY + 5).stroke();

      // --- Totals Section ---
      const totalsY = rowY + 15;
      const balanceDue = Math.max(0, (invoice.total_amount || 0) - (invoice.amount_paid || 0));

      // Left Box: Payment Details
      doc.rect(40, totalsY, 260, 105).fill('#F8FAFC');
      doc.rect(40, totalsY, 260, 105).strokeColor('#E2E8F0').lineWidth(1).stroke();

      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('PAYMENT INSTRUCTIONS', 52, totalsY + 10);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica');
      doc.text('Beneficiary: Brightloop Software Private Limited', 52, totalsY + 26);
      doc.text('Bank: HDFC Bank / Branch: Tech Park', 52, totalsY + 39);
      doc.text('Account Number: 50200088992211', 52, totalsY + 52);
      doc.text('IFSC Code: HDFC0001234', 52, totalsY + 65);
      doc.fillColor('#4F46E5').font('Helvetica-Bold').text('UPI ID: brightloop@hdfcbank', 52, totalsY + 80);

      // Right Box: Financial Summary
      let sumY = totalsY;
      const printSumLine = (label: string, amount: string, isBold: boolean = false, color: string = '#1E293B') => {
        doc.fillColor('#64748B').fontSize(9).font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(label, 320, sumY);
        doc.fillColor(color).fontSize(9).font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(amount, 440, sumY, { width: 105, align: 'right' });
        sumY += 15;
      };

      printSumLine('Subtotal:', formatCurrency(invoice.subtotal));
      if (invoice.discount_amount && invoice.discount_amount > 0) {
        printSumLine('Discount Applied:', `-${formatCurrency(invoice.discount_amount)}`, true, '#059669');
      }
      printSumLine(`GST (${invoice.tax_rate || 18}%):`, formatCurrency(invoice.tax_amount));

      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(320, sumY).lineTo(545, sumY).stroke();
      sumY += 6;

      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('Total Amount:', 320, sumY);
      doc.fillColor('#4F46E5').fontSize(12).font('Helvetica-Bold').text(formatCurrency(invoice.total_amount), 430, sumY, { width: 115, align: 'right' });
      sumY += 18;

      printSumLine('Amount Paid:', formatCurrency(invoice.amount_paid || 0), false, '#16A34A');
      printSumLine('Balance Due:', formatCurrency(balanceDue), true, balanceDue > 0 ? '#DC2626' : '#16A34A');

      // --- Footer ---
      doc.rect(40, 750, 515, 45).fill('#F8FAFC');
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
         .text('Thank you for choosing Brightloop Software! For questions regarding this invoice, contact billing@brightloop.io', 40, 760, { align: 'center', width: 515 });
      doc.text('This is an electronically generated official tax invoice and requires no physical signature.', 40, 774, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
