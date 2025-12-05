import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings,
  Monitor,
  FileText,
  Check,
  X,
  Eye,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { PrintModalProps } from '@/types/print';

export const ColumnPickerModal: React.FC<PrintModalProps> = ({
  isOpen,
  columns,
  selectedIds,
  presets,
  settings,
  onSelectedIdsChange,
  onSettingsChange,
  onClose,
  onConfirm,
  onPreview
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);
  const [showWarning, setShowWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'settings'>('columns');
  const firstCheckboxRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && firstCheckboxRef.current) {
      setTimeout(() => {
        firstCheckboxRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Sync with parent when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedIds);
      setShowWarning(false);
    }
  }, [isOpen, selectedIds]);

  const printableColumns = columns.filter(col => col.printable);

  const handleToggleColumn = (columnId: string) => {
    setLocalSelectedIds(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
    setShowWarning(false);
  };

  const handleSelectAll = () => {
    setLocalSelectedIds(printableColumns.map(col => col.id));
    setShowWarning(false);
  };

  const handleClearAll = () => {
    setLocalSelectedIds([]);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setLocalSelectedIds(preset.columnIds);
      setShowWarning(false);
    }
  };

  const handleConfirm = () => {
    if (localSelectedIds.length === 0) {
      setShowWarning(true);
      return;
    }
    onSelectedIdsChange(localSelectedIds);
    onConfirm();
  };

  const handlePreview = () => {
    if (localSelectedIds.length === 0) {
      setShowWarning(true);
      return;
    }
    onSelectedIdsChange(localSelectedIds);
    onPreview();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        onKeyDown={handleKeyDown}
        aria-labelledby="column-picker-title"
        aria-describedby="column-picker-description"
      >
        <DialogHeader>
          <DialogTitle id="column-picker-title" className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Column Selection
          </DialogTitle>
          <p id="column-picker-description" className="text-sm text-muted-foreground">
            Choose which columns to include in your printed report. 
            Selected: <Badge variant="secondary">{localSelectedIds.length}</Badge>
          </p>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('columns')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'columns' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={activeTab === 'columns'}
          >
            <FileText className="h-4 w-4 inline mr-1" />
            Columns
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={activeTab === 'settings'}
          >
            <Settings className="h-4 w-4 inline mr-1" />
            Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {activeTab === 'columns' && (
            <div className="space-y-4">
              {/* Presets */}
              {presets.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect(preset.id)}
                        className="h-8"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>

              <Separator />

              {/* Warning */}
              {showWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please select at least one column to print.
                  </AlertDescription>
                </Alert>
              )}

              {/* Column List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Available Columns ({printableColumns.length})
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {printableColumns.map((column, index) => {
                    const isSelected = localSelectedIds.includes(column.id);
                    return (
                      <div
                        key={column.id}
                        className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          ref={index === 0 ? firstCheckboxRef : undefined}
                          id={`column-${column.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleColumn(column.id)}
                          aria-describedby={`column-${column.id}-desc`}
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`column-${column.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {column.label}
                          </Label>
                          <p 
                            id={`column-${column.id}-desc`}
                            className="text-xs text-muted-foreground truncate"
                          >
                            {column.accessorKey}
                          </p>
                        </div>
                        {column.widthPx && (
                          <Badge variant="outline" className="text-xs">
                            {column.widthPx}px
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Page Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Page Settings</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orientation" className="text-sm">Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value: 'portrait' | 'landscape') => 
                        onSettingsChange({ orientation: value })
                      }
                    >
                      <SelectTrigger id="orientation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pageSize" className="text-sm">Page Size</Label>
                    <Select
                      value={settings.pageSize}
                      onValueChange={(value: 'A4' | 'Letter') => 
                        onSettingsChange({ pageSize: value })
                      }
                    >
                      <SelectTrigger id="pageSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Content Settings</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showFilters"
                      checked={settings.showFilters}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ showFilters: checked as boolean })
                      }
                    />
                    <Label htmlFor="showFilters" className="text-sm">
                      Show applied filters summary
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDateTime"
                      checked={settings.showDateTime}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ showDateTime: checked as boolean })
                      }
                    />
                    <Label htmlFor="showDateTime" className="text-sm">
                      Show report generation date and time
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPageNumbers"
                      checked={settings.showPageNumbers}
                      onCheckedChange={(checked) => 
                        onSettingsChange({ showPageNumbers: checked as boolean })
                      }
                    />
                    <Label htmlFor="showPageNumbers" className="text-sm">
                      Show page numbers
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button onClick={handleConfirm}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};