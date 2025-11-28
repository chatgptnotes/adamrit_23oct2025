
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { SearchableFieldSelect } from './SearchableFieldSelect';

interface ComplicationsSelectorProps {
  selectedComplications: string[];
  customComplication: string;
  availableComplications: string[];
  onAddComplication: (complication: string) => void;
  onRemoveComplication: (complication: string) => void;
  onCustomComplicationChange: (value: string) => void;
  onAddCustomComplication: () => void;
}

export const ComplicationsSelector: React.FC<ComplicationsSelectorProps> = ({
  selectedComplications,
  customComplication,
  availableComplications,
  onAddComplication,
  onRemoveComplication,
  onCustomComplicationChange,
  onAddCustomComplication
}) => {
  const handleComplicationsChange = (value: string) => {
    // This will be called when complications are selected from the master list
    const newComplications = value.split(', ').filter(comp => comp.trim());
    // Update the selected complications by comparing with current state
    newComplications.forEach(comp => {
      if (!selectedComplications.includes(comp)) {
        onAddComplication(comp);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Complications</Label>
        <p className="text-sm text-gray-600 mb-3">
          Search and select from complications master list or add custom complications
        </p>
        
        {/* Search and select from complications master list */}
        <SearchableFieldSelect
          tableName="complications"
          fieldName="name"
          value=""
          onChange={handleComplicationsChange}
          placeholder="Search complications from master list"
          displayField="name"
          searchFields={['name', 'description']}
        />
      </div>

      {/* Available complications from diagnosis (existing functionality) */}
      {availableComplications.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Common complications for this diagnosis:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableComplications.map((complication) => (
              <Button
                key={complication}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddComplication(complication)}
                disabled={selectedComplications.includes(complication)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {complication}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom complication input */}
      <div>
        <Label className="text-sm font-medium">Add Custom Complication</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter custom complication"
            value={customComplication}
            onChange={(e) => onCustomComplicationChange(e.target.value)}
            className="border-2 border-gray-300 focus:border-primary"
          />
          <Button
            type="button"
            onClick={onAddCustomComplication}
            disabled={!customComplication.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected complications */}
      {selectedComplications.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Selected Complications:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedComplications.map((complication) => (
              <Badge key={complication} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white">
                {complication}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onRemoveComplication(complication)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
