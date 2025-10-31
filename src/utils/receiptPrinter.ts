import { format } from 'date-fns';

// Payment data interface for receipt printing
export interface ReceiptPaymentData {
  id?: string;
  patient_name: string;
  patients_id?: string;
  registration_no?: string;
  advance_amount: string | number;
  payment_date: string;
  payment_mode: string;
  reference_number?: string;
  remarks?: string;
  created_by?: string;
  billing_executive?: string;
  voucher_no?: string;
  is_refund?: boolean;
}

// Hospital configuration for receipt header
export interface HospitalInfo {
  name: string;
  address: string;
  city: string;
  pincode: string;
  email: string;
}

// Default hospital configuration
const defaultHospitalInfo: HospitalInfo = {
  name: 'Drm Hope Hospital Pvt. Ltd',
  address: '2,Teka Naka Square,Kamptee Road,Nagpur',
  city: 'Nagpur',
  pincode: '440017',
  email: 'cmd@hopehospitals.com',
};

/**
 * Convert numeric amount to Indian Rupees in words
 */
const amountInWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertToWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
    if (num < 100000) return convertToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertToWords(num % 1000) : '');
    if (num < 10000000) return convertToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertToWords(num % 100000) : '');
    return convertToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertToWords(num % 10000000) : '');
  };

  if (amount === 0) return 'Zero Rupees Only';
  return 'Rupee ' + convertToWords(Math.floor(amount)) + ' Only';
};

/**
 * Generate receipt number from payment ID or voucher number
 */
const generateReceiptNumber = (payment: ReceiptPaymentData): string => {
  // Use voucher_no if available
  if (payment.voucher_no) {
    return payment.voucher_no.toString();
  }
  // Otherwise use id
  if (payment.id) {
    return payment.id.slice(-6).toUpperCase();
  }
  // Fallback to random
  return Math.random().toString().slice(-6);
};

/**
 * Format payment mode for display
 */
const formatPaymentMode = (paymentMode: string, referenceNumber?: string): string => {
  const mode = paymentMode === 'CASH' ? 'CASH' : paymentMode.toUpperCase();
  if (referenceNumber && paymentMode !== 'CASH') {
    return `${mode} - ${referenceNumber}`;
  }
  return mode;
};

/**
 * Generate and print receipt in a new window
 */
export const printReceipt = (
  payment: ReceiptPaymentData,
  hospitalInfo: HospitalInfo = defaultHospitalInfo
): void => {
  const receiptNumber = generateReceiptNumber(payment);
  const amount = typeof payment.advance_amount === 'string'
    ? parseFloat(payment.advance_amount)
    : payment.advance_amount;

  const patientName = payment.patient_name || 'N/A';
  const registrationNo = payment.registration_no || payment.patients_id || 'N/A';
  const amountWords = amountInWords(amount);
  const paymentModeDisplay = formatPaymentMode(payment.payment_mode, payment.reference_number);
  const paymentDate = format(new Date(payment.payment_date), 'dd/MM/yyyy');
  const billingExecutive = payment.billing_executive || payment.created_by || 'System User';

  // Generate remarks if not provided
  const remarks = payment.remarks ||
    `Being ${payment.is_refund ? 'refund' : 'ONLINE'} received towards ${
      payment.is_refund ? 'refund' : 'IPD ADV'
    } from pt. ${patientName} against R. No.:`;

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${receiptNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 14px;
            line-height: 1.6;
          }

          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 0;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 20px;
            border-bottom: 2px solid #000;
          }

          .header-left {
            font-size: 13px;
          }

          .header-right {
            text-align: right;
            font-size: 13px;
          }

          .print-btn {
            background: #4a90e2;
            color: white;
            border: none;
            padding: 6px 20px;
            cursor: pointer;
            font-size: 14px;
            border-radius: 3px;
            margin-bottom: 8px;
          }

          .print-btn:hover {
            background: #357abd;
          }

          .hospital-info {
            text-align: center;
            padding: 15px 20px;
            border-bottom: 1px solid #000;
          }

          .hospital-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .hospital-address {
            font-size: 13px;
            line-height: 1.4;
          }

          .receipt-content {
            padding: 20px;
          }

          .info-row {
            display: flex;
            margin-bottom: 12px;
            align-items: baseline;
          }

          .info-label {
            width: 220px;
            font-style: italic;
            font-size: 13px;
            flex-shrink: 0;
          }

          .info-colon {
            width: 20px;
            flex-shrink: 0;
          }

          .info-value {
            flex: 1;
            font-weight: bold;
            font-size: 14px;
          }

          .amount-section {
            margin: 30px 0;
            padding: 20px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }

          .amount-value {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
          }

          .signature-box {
            text-align: center;
            width: 250px;
          }

          .signature-line {
            border-bottom: 2px solid #000;
            margin-bottom: 8px;
            height: 50px;
          }

          @media print {
            body {
              padding: 0;
              margin: 0;
            }

            .print-btn {
              display: none;
            }

            .receipt-container {
              border: 2px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="header-left">
              <strong>No. : ${receiptNumber}</strong>
            </div>
            <div class="header-right">
              <button class="print-btn" onclick="window.print()">Print</button>
              <div><strong>Dated: ${paymentDate}</strong></div>
            </div>
          </div>

          <div class="hospital-info">
            <div class="hospital-name">${hospitalInfo.name}</div>
            <div class="hospital-address">
              ${hospitalInfo.address}<br>
              ${hospitalInfo.city} - ${hospitalInfo.pincode}<br>
              E-Mail : ${hospitalInfo.email}
            </div>
          </div>

          <div class="receipt-content">
            <div class="info-row">
              <span class="info-label">Received with thanks from</span>
              <span class="info-colon">:</span>
              <span class="info-value">${patientName.toUpperCase()}</span>
            </div>

            <div class="info-row">
              <span class="info-label">The sum of</span>
              <span class="info-colon">:</span>
              <span class="info-value">${amountWords}</span>
            </div>

            <div class="info-row">
              <span class="info-label">By</span>
              <span class="info-colon">:</span>
              <span class="info-value">${paymentModeDisplay}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Remarks</span>
              <span class="info-colon">:</span>
              <span class="info-value">${remarks}</span>
            </div>

            <div class="amount-section">
              <div class="info-row">
                <span class="amount-value">Rs ${amount.toLocaleString('en-IN')}/-</span>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div><strong>Name & Sign of Patient</strong></div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div><strong>Authorised Signatory</strong></div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    // Auto-trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    console.error('Failed to open print window. Pop-ups might be blocked.');
    alert('Please allow pop-ups to print the receipt.');
  }
};

/**
 * Print receipt with custom hospital info
 */
export const printReceiptWithCustomHospital = (
  payment: ReceiptPaymentData,
  customHospitalInfo: HospitalInfo
): void => {
  printReceipt(payment, customHospitalInfo);
};
