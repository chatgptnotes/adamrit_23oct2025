// Sticker data interface for patient sticker printing
export interface StickerData {
  patientName: string;
  uhid: string;
  visitId: string;
  age: string;
  gender: string;
  consultant: string;
  department: string;
  tariff: string;
}

/**
 * Generate a single sticker HTML
 */
const generateStickerHTML = (data: StickerData): string => {
  return `
    <div class="sticker">
      <div class="sticker-name">${data.patientName}</div>
      <div class="sticker-row">UHID :${data.uhid}</div>
      <div class="sticker-row">Visit ID: ${data.visitId}</div>
      <div class="sticker-row">Age/Gender: ${data.age} / ${data.gender}</div>
      <div class="sticker-row">Consultant: ${data.consultant}</div>
      <div class="sticker-row">${data.department}</div>
      <div class="sticker-row">Tariff: ${data.tariff}</div>
    </div>
  `;
};

/**
 * Generate and print sticker sheet (3x8 grid = 24 stickers) in a new window
 * Each sticker: 64mm width x 34mm height
 */
export const printSticker = (data: StickerData): void => {
  // Generate 24 stickers (3 columns x 8 rows)
  const totalStickers = 24;
  let stickersHTML = '';

  for (let i = 0; i < totalStickers; i++) {
    stickersHTML += generateStickerHTML(data);
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patient Stickers - ${data.patientName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 0;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            line-height: 1.2;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4a90e2;
            color: white;
            border: none;
            padding: 8px 20px;
            cursor: pointer;
            font-size: 14px;
            border-radius: 4px;
            z-index: 1000;
          }

          .print-btn:hover {
            background: #357abd;
          }

          .sticker-grid {
            display: grid;
            grid-template-columns: repeat(3, 64mm);
            grid-template-rows: repeat(8, 34mm);
            width: calc(64mm * 3);
            margin: 0 auto;
          }

          .sticker {
            width: 64mm;
            height: 34mm;
            padding: 2mm;
            border: 0.5px solid #ccc;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .sticker-name {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 1mm;
          }

          .sticker-row {
            font-size: 6pt;
            line-height: 1.2;
            word-wrap: break-word;
          }

          @media print {
            .print-btn {
              display: none !important;
            }

            body {
              margin: 0;
              padding: 0;
            }

            .sticker-grid {
              margin: 0;
            }

            .sticker {
              border: 0.5px solid #ddd;
              page-break-inside: avoid;
            }
          }

          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }

            .sticker-grid {
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print Stickers</button>
        <div class="sticker-grid">
          ${stickersHTML}
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
    alert('Please allow pop-ups to print the stickers.');
  }
};
