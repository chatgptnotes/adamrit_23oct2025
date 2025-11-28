import React from 'react';
import { PrintContainer } from './PrintContainer';
import { PrintContainerProps } from '@/types/print';

interface PrintPreviewProps extends PrintContainerProps {
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = (props) => {
  const { onClose, ...printProps } = props;

  React.useEffect(() => {
    // Trigger print dialog after a short delay
    const timeoutId = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="print-preview-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 99999,
        overflow: 'auto',
        padding: '20px'
      }}
    >
      {/* Close button - hidden during print */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 100000
        }}
        className="no-print"
      >
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Preview
        </button>
      </div>

      {/* Print Container */}
      <PrintContainer
        {...printProps}
        onPrintComplete={onClose}
      />

      <style>{`
        /* Screen styles */
        .print-preview-overlay {
          display: block;
        }

        /* Print styles */
        @media print {
          /* Convert overlay to normal flow for print */
          .print-preview-overlay {
            position: static !important;
            z-index: 99999 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
            visibility: visible !important;
          }

          /* CRITICAL: Force all print content to be visible */
          .print-preview-overlay,
          .print-preview-overlay *,
          [data-print-content="true"],
          [data-print-content="true"] *,
          .print-container,
          .print-container *,
          .print-table,
          .print-table *,
          .print-table-container,
          .print-table-container * {
            display: revert !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Ensure table elements display correctly */
          .print-table {
            display: table !important;
          }

          .print-table thead {
            display: table-header-group !important;
          }

          .print-table tbody {
            display: table-row-group !important;
          }

          .print-table tr {
            display: table-row !important;
          }

          .print-table th,
          .print-table td {
            display: table-cell !important;
          }

          /* Hide only the close button */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ensure body shows content */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Force print container to be visible */
          [data-print-content="true"] {
            display: block !important;
            visibility: visible !important;
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
};