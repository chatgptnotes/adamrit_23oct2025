// ============================================================================
// EXAMPLE: How to save nested sub-tests to lab_test_config table
// ============================================================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TestConfigurationSection, { SubTest } from '@/components/lab/TestConfigurationSection';
import {
  saveTestConfigWithNested,
  saveAllSubTestConfigs,
  loadTestConfigsWithNested,
  TestConfig
} from '@/utils/labTestConfigHelper';

// Example Component
export default function LabTestConfigExample() {
  const [testName, setTestName] = useState('');
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [labId] = useState('your-lab-uuid-here'); // Replace with actual lab ID
  const { toast } = useToast();

  // Handle save button click
  const handleSaveConfig = async () => {
    if (!testName) {
      toast({
        title: 'Error',
        description: 'Please enter test name',
        variant: 'destructive'
      });
      return;
    }

    if (subTests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one sub-test',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Save all sub-tests with nested structure
      const savedIds = await saveAllSubTestConfigs(labId, testName, subTests);

      toast({
        title: 'Success',
        description: `Saved ${savedIds.length} test configurations (including nested)`,
      });

      console.log('Saved config IDs:', savedIds);

    } catch (error) {
      console.error('Error saving configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to save test configurations',
        variant: 'destructive'
      });
    }
  };

  // Handle load button click
  const handleLoadConfig = async () => {
    if (!testName) {
      toast({
        title: 'Error',
        description: 'Please enter test name',
        variant: 'destructive'
      });
      return;
    }

    try {
      const loadedConfigs = await loadTestConfigsWithNested(labId, testName);

      // Convert TestConfig back to SubTest format
      const convertedSubTests: SubTest[] = loadedConfigs.map((config) => ({
        id: config.id || `config_${Date.now()}`,
        name: config.sub_test_name,
        unit: config.unit || '',
        ageRanges: [{
          id: `ar_${Date.now()}`,
          minAge: config.min_age.toString(),
          maxAge: config.max_age.toString(),
          unit: config.age_unit,
          description: config.age_description || ''
        }],
        normalRanges: [{
          id: `nr_${Date.now()}`,
          ageRange: `${config.min_age}-${config.max_age} ${config.age_unit}`,
          gender: config.gender,
          minValue: config.min_value.toString(),
          maxValue: config.max_value.toString(),
          unit: config.normal_unit || ''
        }],
        subTests: config.nested_configs?.map((nested) => convertConfigToSubTest(nested)) || []
      }));

      setSubTests(convertedSubTests);

      toast({
        title: 'Success',
        description: `Loaded ${loadedConfigs.length} test configurations`,
      });

    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test configurations',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Test Name</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g., CBC, Liver Function Test"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <Button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700">
          Save Configuration
        </Button>
        <Button onClick={handleLoadConfig} variant="outline">
          Load Configuration
        </Button>
      </div>

      <TestConfigurationSection
        testName={testName}
        onTestNameChange={setTestName}
        subTests={subTests}
        onSubTestsChange={setSubTests}
      />
    </div>
  );
}

// Helper function to convert TestConfig to SubTest
function convertConfigToSubTest(config: TestConfig): SubTest {
  return {
    id: config.id || `config_${Date.now()}`,
    name: config.sub_test_name,
    unit: config.unit || '',
    ageRanges: [{
      id: `ar_${Date.now()}`,
      minAge: config.min_age.toString(),
      maxAge: config.max_age.toString(),
      unit: config.age_unit,
      description: config.age_description || ''
    }],
    normalRanges: [{
      id: `nr_${Date.now()}`,
      ageRange: `${config.min_age}-${config.max_age} ${config.age_unit}`,
      gender: config.gender,
      minValue: config.min_value.toString(),
      maxValue: config.max_value.toString(),
      unit: config.normal_unit || ''
    }],
    subTests: config.nested_configs?.map((nested) => convertConfigToSubTest(nested)) || []
  };
}

// ============================================================================
// DIRECT USAGE EXAMPLE (without component)
// ============================================================================

export async function saveTestConfigExample() {
  const labId = 'your-lab-uuid';
  const testName = 'CBC';

  // Define nested structure
  const cbcConfig: TestConfig = {
    lab_id: labId,
    test_name: testName,
    sub_test_name: 'Hemoglobin',
    unit: 'g/dL',
    min_age: 18,
    max_age: 65,
    age_unit: 'Years',
    age_description: 'Adult Male',
    gender: 'Male',
    min_value: 13.0,
    max_value: 17.0,
    normal_unit: 'g/dL',
    display_order: 0,
    nested_configs: [
      {
        lab_id: labId,
        test_name: testName,
        sub_test_name: 'HbA1c',
        unit: '%',
        min_age: 18,
        max_age: 65,
        age_unit: 'Years',
        age_description: 'Adult',
        gender: 'Both',
        min_value: 4.0,
        max_value: 5.6,
        normal_unit: '%',
        display_order: 0
      },
      {
        lab_id: labId,
        test_name: testName,
        sub_test_name: 'HbA2',
        unit: '%',
        min_age: 18,
        max_age: 65,
        age_unit: 'Years',
        age_description: 'Adult',
        gender: 'Both',
        min_value: 2.0,
        max_value: 3.5,
        normal_unit: '%',
        display_order: 1
      }
    ]
  };

  // Save with nested structure
  const savedIds = await saveTestConfigWithNested(cbcConfig, null, 1);
  console.log('Saved IDs:', savedIds);

  // Load back
  const loadedConfigs = await loadTestConfigsWithNested(labId, testName);
  console.log('Loaded configs:', loadedConfigs);
}
