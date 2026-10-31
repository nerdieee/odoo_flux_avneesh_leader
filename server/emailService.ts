import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface EmailConfig {
  user: string;
  pass: string;
  receiver: string;
  source: string;
}

export function loadEmailConfig(): EmailConfig {
  let user = 'lolkumarold@gmail.com';
  let pass = 'mizwwmwmxrqbkxbz';
  let receiver = 'yashchharra@gmail.com';
  let source = 'default';

  // Check possible paths for appid file
  const candidatePaths = [
    '/home/yash/Desktop/appid',
    path.resolve(process.cwd(), 'appid'),
    path.resolve(process.cwd(), '../Desktop/appid'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes('email id---')) {
            user = trimmed.split('email id---')[1].trim();
            source = filePath;
          } else if (trimmed.startsWith('SMTP_USER=')) {
            user = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
            source = filePath;
          }

          if (trimmed.includes('apppasowrd---') || trimmed.includes('apppassword---')) {
            const raw = trimmed.split(/---/)[1].trim();
            pass = raw.replace(/\s+/g, '');
            source = filePath;
          } else if (trimmed.startsWith('SMTP_PASS=')) {
            pass = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
            source = filePath;
          }

          if (trimmed.startsWith('INVOICE_RECEIVER_EMAIL=')) {
            receiver = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
          }
        }
        if (source === filePath) {
          break;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Allow env variable overrides
  if (process.env.SMTP_USER) user = process.env.SMTP_USER;
  if (process.env.SMTP_PASS) pass = process.env.SMTP_PASS.replace(/\s+/g, '');
  if (process.env.INVOICE_RECEIVER_EMAIL) receiver = process.env.INVOICE_RECEIVER_EMAIL;

  return { user, pass, receiver, source };
}

export function generateInvoiceHtml(invoice: any, lineItems: any[] = []): string {
  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (val: string) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  const balanceDue = Math.max(0, (invoice.total_amount || 0) - (invoice.paid_amount || 0));

  const itemsRows = lineItems && lineItems.length > 0
    ? lineItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 16px; font-size: 14px; color: #1E293B;">
            <strong>${item.product_name || 'Subscription Plan'}</strong>
            ${item.variant_name ? `<br/><span style="font-size: 12px; color: #64748B;">Variant: ${item.variant_name}</span>` : ''}
          </td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: center; color: #475569;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; color: #475569;">
            ${formatCurrency(item.unit_price)}
          </td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; color: #475569;">
            ${item.tax_rate ? `${item.tax_rate}%` : '0%'}
          </td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600; color: #0F172A;">
            ${formatCurrency(item.amount)}
          </td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 16px; font-size: 14px; color: #1E293B;">
            <strong>Subscription Recurring Charge</strong>
            <br/><span style="font-size: 12px; color: #64748B;">Plan Billing Cycle</span>
          </td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: center; color: #475569;">1</td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; color: #475569;">${formatCurrency(invoice.subtotal)}</td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; color: #475569;">${formatCurrency(invoice.tax_amount)}</td>
          <td style="padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600; color: #0F172A;">${formatCurrency(invoice.total_amount)}</td>
        </tr>
      `;

  const statusBg = invoice.status === 'paid' ? '#DCFCE7' : invoice.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7';
  const statusColor = invoice.status === 'paid' ? '#15803D' : invoice.status === 'confirmed' ? '#1D4ED8' : '#B45309';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
    
    <!-- Top Branded Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 40px; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Brightloop Software</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #E0E7FF;">Subscription Management & Recurring Invoicing</p>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 14px; border-radius: 9999px;">
                ${invoice.status || 'CONFIRMED'}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Invoice Details & Customer Info -->
    <tr>
      <td style="padding: 32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">Billed To</p>
              <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #0F172A;">${invoice.customer_name || 'Valued Customer'}</h3>
              <p style="margin: 0; font-size: 13px; color: #475569;">${invoice.customer_company || ''}</p>
              <p style="margin: 2px 0 0; font-size: 13px; color: #4F46E5; font-weight: 500;">${invoice.customer_email || 'yashchharra@gmail.com'}</p>
              ${invoice.customer_address ? `<p style="margin: 4px 0 0; font-size: 12px; color: #64748B;">${invoice.customer_address}</p>` : ''}
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">Invoice Details</p>
              <p style="margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #0F172A; font-family: monospace;">#${invoice.invoice_number}</p>
              <p style="margin: 0 0 2px; font-size: 13px; color: #475569;">Issue Date: <strong>${formatDate(invoice.issue_date || invoice.invoice_date)}</strong></p>
              <p style="margin: 0 0 2px; font-size: 13px; color: #475569;">Due Date: <strong>${formatDate(invoice.due_date)}</strong></p>
              ${invoice.subscription_number ? `<p style="margin: 2px 0 0; font-size: 12px; color: #64748B;">Subscription: <strong>${invoice.subscription_number}</strong></p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Line Items Table -->
    <tr>
      <td style="padding: 0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Description</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Qty</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Unit Price</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Tax</th>
              <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Financial Totals Summary -->
    <tr>
      <td style="padding: 24px 40px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-right: 16px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Payment Information</p>
                <p style="margin: 0 0 2px; font-size: 13px; color: #1E293B;">Account: <strong>Brightloop Software Private Limited</strong></p>
                <p style="margin: 0 0 2px; font-size: 13px; color: #1E293B;">Bank: <strong>HDFC Bank / IFSC: HDFC0001234</strong></p>
                <p style="margin: 0; font-size: 13px; color: #1E293B;">UPI ID: <strong>brightloop@hdfcbank</strong></p>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
                <tr>
                  <td style="color: #64748B;">Subtotal:</td>
                  <td style="text-align: right; font-weight: 500; color: #1E293B;">${formatCurrency(invoice.subtotal)}</td>
                </tr>
                ${invoice.discount_amount && invoice.discount_amount > 0 ? `
                  <tr>
                    <td style="color: #059669;">Discount:</td>
                    <td style="text-align: right; font-weight: 600; color: #059669;">-${formatCurrency(invoice.discount_amount)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="color: #64748B;">Tax Amount (GST):</td>
                  <td style="text-align: right; font-weight: 500; color: #1E293B;">${formatCurrency(invoice.tax_amount)}</td>
                </tr>
                <tr style="border-top: 2px solid #E2E8F0;">
                  <td style="font-weight: 700; font-size: 16px; color: #0F172A; padding-top: 8px;">Total Amount:</td>
                  <td style="text-align: right; font-weight: 700; font-size: 18px; color: #4F46E5; padding-top: 8px;">${formatCurrency(invoice.total_amount)}</td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Amount Paid:</td>
                  <td style="text-align: right; font-weight: 500; color: #16A34A;">${formatCurrency(invoice.paid_amount || 0)}</td>
                </tr>
                <tr style="border-top: 1px dashed #CBD5E1;">
                  <td style="font-weight: 600; color: #0F172A;">Balance Due:</td>
                  <td style="text-align: right; font-weight: 700; color: ${balanceDue > 0 ? '#DC2626' : '#16A34A'};">
                    ${formatCurrency(balanceDue)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center; color: #64748B; font-size: 12px;">
        <p style="margin: 0 0 4px;">Thank you for your business with Brightloop Software!</p>
        <p style="margin: 0;">This is an automated invoice dispatch generated by Brightloop Subscription Management System.</p>
        <p style="margin: 4px 0 0; color: #94A3B8;">Recipient: ${invoice.customer_email || 'yashchharra@gmail.com'}</p>
      </td>
    </tr>

  </table>
</body>
</html>
  `;
}

export async function sendInvoiceEmail(invoice: any, lineItems: any[] = [], targetRecipient?: string): Promise<{
  success: boolean;
  message: string;
  recipient: string;
  sender: string;
  messageId?: string;
  source: string;
  sent_at: string;
  error?: string;
  htmlPreview?: string;
}> {
  const config = loadEmailConfig();
  const recipient = targetRecipient || config.receiver || invoice.customer_email || 'yashchharra@gmail.com';
  const htmlContent = generateInvoiceHtml(invoice, lineItems);
  const now = new Date().toISOString();

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Useful socket timeouts for responsive failures
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"Brightloop Software" <${config.user}>`,
      to: recipient,
      subject: `Invoice #${invoice.invoice_number} from Brightloop Software - ${invoice.total_amount ? `₹${invoice.total_amount.toLocaleString('en-IN')}` : ''}`,
      text: `Hello ${invoice.customer_name || 'Customer'},\n\nPlease find your invoice #${invoice.invoice_number} for the total amount of ₹${invoice.total_amount || 0}.\nDue Date: ${invoice.due_date || 'N/A'}.\n\nThank you,\nBrightloop Software Team`,
      html: htmlContent,
    });

    return {
      success: true,
      message: `Invoice #${invoice.invoice_number} successfully emailed to ${recipient} via ${config.user}!`,
      recipient,
      sender: config.user,
      messageId: info.messageId,
      source: config.source,
      sent_at: now,
      htmlPreview: htmlContent,
    };
  } catch (err: any) {
    const isBadCredentials = err?.message?.includes('535') || err?.message?.includes('BadCredentials');
    const helpfulNote = isBadCredentials
      ? `Gmail SMTP Authentication Failed (535 BadCredentials). Google rejected the app password '${config.pass}' for '${config.user}' from ${config.source}. To resolve: Please visit https://myaccount.google.com/apppasswords with '${config.user}', ensure 2-Step Verification is enabled, generate a new 16-character App Password, and save it to /home/yash/Desktop/appid.`
      : `Email delivery failed: ${err.message}`;

    console.warn(`[EmailService] Failed to send invoice ${invoice.invoice_number}:`, helpfulNote);

    return {
      success: false,
      message: helpfulNote,
      error: err.message,
      recipient,
      sender: config.user,
      source: config.source,
      sent_at: now,
      htmlPreview: htmlContent,
    };
  }
}
