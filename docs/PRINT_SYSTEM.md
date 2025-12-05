# Print Column Selection System

A comprehensive, accessible print system that allows users to select specific columns for printing reports with customizable settings and layouts.

## Features

- ✅ **Column Selection Modal** - Interactive UI for selecting which columns to print
- ✅ **Print Presets** - Quick selection with predefined column sets (Summary, Detailed, etc.)
- ✅ **Print Settings** - Orientation, page size, headers, and formatting options
- ✅ **Persistence** - User selections saved per report using localStorage
- ✅ **Accessibility** - Full keyboard navigation and screen reader support
- ✅ **Print Preview** - See exactly how the report will look before printing
- ✅ **Responsive Design** - Optimized layouts for different page sizes
- ✅ **Filter Summary** - Shows active filters in the printed report
- ✅ **Professional Formatting** - Clean, printable table layouts with proper page breaks

## Architecture

### Core Components

1. **Types** (`/src/types/print.ts`)
   - `ReportColumn` - Column definition interface
   - `PrintSettings` - Configuration options
   - `PrintPreset` - Predefined column selections

2. **Hook** (`/src/hooks/usePrintColumns.ts`)
   - `usePrintColumns()` - Main state management hook
   - Handles localStorage persistence
   - Provides column selection utilities

3. **Components** (`/src/components/print/`)
   - `ColumnPickerModal` - Interactive column selection dialog
   - `PrintContainer` - Renders the print-optimized layout
   - `PrintPreview` - Preview functionality in new window

4. **Styling** (`/src/styles/print.css`)
   - Print-specific CSS with `@media print` rules
   - Responsive table layouts
   - Page break controls

## Quick Start

### 1. Define Your Columns

```typescript
import { ReportColumn, PrintPreset } from '@/types/print';

const REPORT_COLUMNS: ReportColumn[] = [
  {
    id: 'patient_name',
    label: 'Patient Name',
    accessorKey: 'patients.name',
    printable: true,
    widthPx: 200,
    align: 'left'
  },
  {
    id: 'visit_date',
    label: 'Visit Date',
    accessorKey: 'visit_date',
    printable: true,
    widthPx: 120,
    align: 'center',
    format: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '—'
  }
];

const PRESETS: PrintPreset[] = [
  {
    id: 'summary',
    label: 'Summary',
    columnIds: ['patient_name', 'visit_date']
  }
];
```

### 2. Use the Hook

```typescript
import { usePrintColumns } from '@/hooks/usePrintColumns';

function MyReportComponent() {
  const {
    selectedIds,
    setSelectedIds,
    settings,
    setSettings,
    openPicker,
    isPickerOpen,
    setIsPickerOpen
  } = usePrintColumns('my-report', REPORT_COLUMNS);

  return (
    <div>
      <Button onClick={openPicker}>
        <Printer className="h-4 w-4 mr-1" />
        Print Report
      </Button>
      
      {/* Your table/report content */}
    </div>
  );
}
```

### 3. Add the Modal Components

```typescript
import { ColumnPickerModal, PrintPreview } from '@/components/print';

function MyReportComponent() {
  // ... hook code above

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handlePrintConfirm = () => {
    setIsPickerOpen(false);
    setShowPrintPreview(true);
  };

  return (
    <div>
      {/* Your report content */}
      
      {/* Print Column Picker Modal */}
      <ColumnPickerModal
        isOpen={isPickerOpen}
        columns={REPORT_COLUMNS}
        selectedIds={selectedIds}
        presets={PRESETS}
        settings={settings}
        onSelectedIdsChange={setSelectedIds}
        onSettingsChange={setSettings}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handlePrintConfirm}
        onPreview={handlePrintConfirm}
      />

      {/* Print Preview */}
      {showPrintPreview && (
        <PrintPreview
          reportTitle="My Report"
          columns={REPORT_COLUMNS.filter(col => selectedIds.includes(col.id))}
          data={reportData}
          settings={settings}
          appliedFilters={getCurrentFilters()}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
}
```

## Column Configuration

### Basic Column Definition

```typescript
const column: ReportColumn = {
  id: 'unique_id',              // Unique identifier
  label: 'Display Name',        // Column header text
  accessorKey: 'data.path',     // Dot notation path to data
  printable: true,              // Whether column can be printed
  widthPx: 150,                 // Optional: fixed width in pixels
  align: 'left',                // Optional: text alignment
  format: (value) => string     // Optional: custom formatter
};
```

### Advanced Formatting

```typescript
// Date formatting
{
  id: 'admission_date',
  label: 'Admission Date',
  accessorKey: 'admission_date',
  printable: true,
  format: (value) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '—'
}

// Currency formatting
{
  id: 'amount',
  label: 'Amount',
  accessorKey: 'bill.amount',
  printable: true,
  align: 'right',
  format: (value) => value ? `₹${Number(value).toLocaleString()}` : '—'
}

// Conditional formatting
{
  id: 'status',
  label: 'Status',
  accessorKey: 'status',
  printable: true,
  format: (value) => {
    switch (value) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return value || '—';
    }
  }
}
```

## Print Settings

```typescript
const settings: PrintSettings = {
  selectedColumnIds: ['col1', 'col2'],  // Selected columns
  orientation: 'portrait',              // 'portrait' | 'landscape'
  pageSize: 'A4',                      // 'A4' | 'Letter'
  showFilters: true,                   // Show filter summary
  showDateTime: true,                  // Show generation time
  showPageNumbers: true                // Show page numbers
};
```

## Presets

Create commonly used column combinations:

```typescript
const presets: PrintPreset[] = [
  {
    id: 'summary',
    label: 'Summary View',
    columnIds: ['name', 'date', 'status']
  },
  {
    id: 'detailed',
    label: 'Detailed Report',
    columnIds: ['name', 'date', 'status', 'amount', 'notes']
  },
  {
    id: 'billing',
    label: 'Billing Focus',
    columnIds: ['name', 'amount', 'payment_status']
  }
];
```

## Accessibility Features

- **Keyboard Navigation**: Full tab support, arrow keys for lists
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Auto-focus on modal open, focus trapping
- **High Contrast**: Works with system accessibility settings
- **Clear Labels**: Descriptive text for all interactive elements

### Keyboard Shortcuts

- `ESC` - Close modal
- `TAB` / `SHIFT+TAB` - Navigate between elements
- `SPACE` / `ENTER` - Toggle checkboxes and buttons
- `ARROW KEYS` - Navigate within lists

## CSS Classes for Styling

```css
/* Print-specific classes */
.print-container { }
.print-table { }
.print-header { }
.print-footer { }

/* Alignment classes */
.print-td.left { text-align: left; }
.print-td.center { text-align: center; }
.print-td.right { text-align: right; }

/* Responsive classes */
.print-table-large { } /* For many columns */
.print-table-compact { } /* For very wide tables */
```

## Storage and Persistence

User preferences are automatically saved to localStorage:

```typescript
// Storage keys format
const columnKey = `printColumns_${reportKey}`;
const settingsKey = `printSettings_${reportKey}`;

// Clear preferences for a report
clearPrintPreferences('my-report');
```

## Best Practices

### Column Design
- Keep column labels short but descriptive
- Use consistent alignment (numbers right, text left)
- Provide meaningful default widths
- Include format functions for dates, currency, and enums

### Performance
- Limit default column selection to essential fields
- Use meaningful report keys for localStorage
- Implement data pagination for large datasets

### User Experience
- Provide logical presets for common use cases
- Show column count in selection summary
- Include filter information in print headers
- Test print output on different page sizes

### Accessibility
- Always provide keyboard alternatives
- Use semantic HTML structure
- Include descriptive ARIA labels
- Test with screen readers

## Error Handling

The system gracefully handles:
- Missing or malformed localStorage data
- Invalid column references
- Network issues during data loading
- Browser print dialog cancellation

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Limited (print functionality varies)

## Integration Examples

### With React Query

```typescript
const { data: reportData, isLoading } = useQuery({
  queryKey: ['report-data'],
  queryFn: fetchReportData
});

// Use reportData in PrintPreview component
```

### With State Management

```typescript
// Redux/Zustand store integration
const filters = useSelector(state => state.report.filters);
const appliedFilters = generateFilterSummary(filters);
```

## Troubleshooting

### Common Issues

1. **Columns not showing in modal**
   - Ensure `printable: true` is set
   - Check column ID uniqueness

2. **Print layout issues**
   - Verify CSS import: `import '@/styles/print.css'`
   - Check browser print preview

3. **Data not displaying**
   - Validate `accessorKey` paths
   - Check data structure matches column definitions

4. **Persistence not working**
   - Ensure unique `reportKey` per report
   - Check localStorage availability

### Debug Tools

```typescript
// Log column validation
console.log('Printable columns:', columns.filter(c => c.printable));

// Check localStorage
console.log('Saved columns:', localStorage.getItem('printColumns_reportKey'));

// Validate data access
console.log('Sample data:', getNestedValue(data[0], 'column.path'));
```

## Migration Guide

### From Basic Print to Advanced System

1. **Replace window.print() calls**:
   ```typescript
   // Old
   const handlePrint = () => window.print();
   
   // New
   const handlePrint = () => openPrintPicker();
   ```

2. **Define column structure**:
   ```typescript
   // Map existing table columns to ReportColumn[]
   const columns = existingColumns.map(col => ({
     id: col.key,
     label: col.title,
     accessorKey: col.dataKey,
     printable: col.printable ?? true
   }));
   ```

3. **Update print button**:
   ```typescript
   // Add column picker modal and preview components
   ```

## Contributing

When adding new features:

1. Update type definitions in `/src/types/print.ts`
2. Add tests in `/src/utils/printTests.test.ts`
3. Update this documentation
4. Test accessibility with keyboard navigation
5. Verify print output in multiple browsers

## Support

For issues or questions:
- Check this documentation first
- Review the test files for usage examples
- Look at the IPD Dashboard implementation as a reference
- File issues with detailed reproduction steps