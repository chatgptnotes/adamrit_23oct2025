// Complete component to save nested sub-tests from TestConfigurationSection
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TestConfigurationSection, { SubTest } from './TestConfigurationSection';

export default function LabTestConfigManager() {
  const [testName, setTestName] = useState('');
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [labId, setLabId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to save sub-tests (now saves nested sub-tests in JSONB)
  const saveSubTest = async (subTest: SubTest, index: number): Promise<void> => {
    try {
      console.log('=== SAVING SUB-TEST ===');
      console.log('Sub-test name:', subTest.name);
      console.log('Sub-test unit:', subTest.unit);
      console.log('Sub-test ageRanges:', subTest.ageRanges);
      console.log('Sub-test normalRanges:', subTest.normalRanges);
      console.log('Sub-test subTests:', subTest.subTests);

      // Get first values for backward compatibility
      const firstAgeRange = subTest.ageRanges?.[0];
      const firstNormalRange = subTest.normalRanges?.[0];

      // Prepare age_ranges JSONB data
      const ageRangesData = subTest.ageRanges?.map(ar => ({
        min_age: parseInt(ar.minAge) || 0,
        max_age: parseInt(ar.maxAge) || 100,
        unit: ar.unit || 'Years',
        description: ar.description || null,
        gender: 'Both'
      })) || [];

      // Prepare normal_ranges JSONB data
      const normalRangesData = subTest.normalRanges?.map(nr => ({
        age_range: nr.ageRange,
        gender: nr.gender || 'Both',
        min_value: nr.minValue !== '' && nr.minValue !== undefined ? parseFloat(nr.minValue) : null,
        max_value: nr.maxValue !== '' && nr.maxValue !== undefined ? parseFloat(nr.maxValue) : null,
        unit: nr.unit || subTest.unit || null
      })) || [];

      // Prepare nested_sub_tests JSONB data (inherits parent's is_mandatory)
      const nestedSubTestsData = subTest.subTests?.map(nst => {
        console.log('=== NESTED SUB-TEST ===');
        console.log('Nested name:', nst.name);
        console.log('Nested unit:', nst.unit);
        console.log('Nested ageRanges:', nst.ageRanges);
        console.log('Nested normalRanges:', nst.normalRanges);

        return {
          name: nst.name,
          unit: nst.unit || null,
          is_mandatory: nst.isMandatory !== false, // Use nested's own status
          age_ranges: nst.ageRanges?.map(ar => ({
            min_age: parseInt(ar.minAge) || 0,
            max_age: parseInt(ar.maxAge) || 100,
            unit: ar.unit || 'Years',
            description: ar.description || null,
            gender: 'Both'
          })) || [],
          normal_ranges: nst.normalRanges?.map(nr => ({
            age_range: nr.ageRange,
            gender: nr.gender || 'Both',
            min_value: nr.minValue !== '' && nr.minValue !== undefined ? parseFloat(nr.minValue) : null,
            max_value: nr.maxValue !== '' && nr.maxValue !== undefined ? parseFloat(nr.maxValue) : null,
            unit: nr.unit || nst.unit || null
          })) || []
        };
      }) || [];

      console.log('=== FINAL DATA TO SAVE ===');
      console.log('ageRangesData:', JSON.stringify(ageRangesData, null, 2));
      console.log('normalRangesData:', JSON.stringify(normalRangesData, null, 2));
      console.log('nestedSubTestsData:', JSON.stringify(nestedSubTestsData, null, 2));

      // Insert this sub-test with nested sub-tests in JSONB
      const { data, error } = await supabase
        .from('lab_test_config')
        .insert({
          lab_id: labId,
          test_name: testName,
          sub_test_name: subTest.name,
          unit: subTest.unit || null,
          is_mandatory: subTest.isMandatory !== false, // Default to true for mandatory
          min_age: firstAgeRange ? parseInt(firstAgeRange.minAge) || 0 : 0,
          max_age: firstAgeRange ? parseInt(firstAgeRange.maxAge) || 100 : 100,
          age_unit: firstAgeRange?.unit || 'Years',
          age_description: firstAgeRange?.description || null,
          gender: firstNormalRange?.gender || 'Both',
          min_value: firstNormalRange && firstNormalRange.minValue !== '' ? parseFloat(firstNormalRange.minValue) : null,
          max_value: firstNormalRange && firstNormalRange.maxValue !== '' ? parseFloat(firstNormalRange.maxValue) : null,
          normal_unit: subTest.unit || null,
          test_level: 1,
          display_order: index,
          is_active: true,
          age_ranges: ageRangesData,
          normal_ranges: normalRangesData,
          nested_sub_tests: nestedSubTestsData
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to save ${subTest.name}: ${error.message}`);
      }

      console.log(`✅ Saved ${subTest.name} with ID: ${data.id}`);
      console.log(`   Age Ranges: ${ageRangesData.length}, Normal Ranges: ${normalRangesData.length}`);
      console.log(`   Nested Sub-Tests: ${nestedSubTestsData.length}`);
    } catch (error) {
      console.error(`Error saving ${subTest.name}:`, error);
      throw error;
    }
  };

  // Main save function
  const handleSave = async () => {
    console.log('🚀 HANDLE SAVE CALLED!');
    console.log('📝 testName:', testName);
    console.log('🏥 labId:', labId);
    console.log('📊 subTests count:', subTests.length);
    console.log('📊 subTests:', subTests);

    if (!testName.trim()) {
      console.log('❌ SAVE BLOCKED: Test name is empty');
      toast({
        title: 'Cannot Auto-Save',
        description: 'Please enter test name first',
        variant: 'destructive'
      });
      return;
    }

    if (!labId.trim()) {
      console.log('❌ SAVE BLOCKED: Lab ID is empty');
      toast({
        title: 'Cannot Auto-Save',
        description: 'Please enter lab ID first',
        variant: 'destructive'
      });
      return;
    }

    if (subTests.length === 0) {
      console.log('❌ No sub-tests added');
      toast({
        title: 'Error',
        description: 'Please add at least one sub-test',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Validation passed, starting save...');
    setIsLoading(true);

    try {
      console.log('Starting save process...');
      console.log('Test Name:', testName);
      console.log('Lab ID:', labId);
      console.log('Sub-Tests:', JSON.stringify(subTests, null, 2));

      // Delete existing records for this test to ensure clean save with new sequence
      console.log('🗑️ Deleting old records for:', testName, 'Lab ID:', labId);
      const { error: deleteError } = await supabase
        .from('lab_test_config')
        .delete()
        .eq('test_name', testName)
        .eq('lab_id', labId);

      if (deleteError) {
        console.error('Error deleting old records:', deleteError);
        throw new Error(`Failed to delete old records: ${deleteError.message}`);
      }
      console.log('✅ Old records deleted successfully');

      let totalSaved = 0;
      let totalNested = 0;

      // Save each sub-test with nested sub-tests in JSONB
      for (let i = 0; i < subTests.length; i++) {
        await saveSubTest(subTests[i], i);
        totalSaved++;
        if (subTests[i].subTests && subTests[i].subTests.length > 0) {
          totalNested += subTests[i].subTests.length;
        }
      }

      toast({
        title: 'Success!',
        description: `Saved ${totalSaved} sub-tests with ${totalNested} nested sub-tests`,
      });

      // Verify saved data
      const { data: verifyData, error: verifyError } = await supabase
        .from('lab_test_config')
        .select('sub_test_name, nested_sub_tests, age_ranges, normal_ranges')
        .eq('lab_id', labId)
        .eq('test_name', testName);

      if (!verifyError && verifyData) {
        console.log('Verification - Saved data:');
        console.table(verifyData);
        verifyData.forEach(row => {
          console.log(`${row.sub_test_name}:`, {
            nested_count: row.nested_sub_tests?.length || 0,
            age_ranges: row.age_ranges?.length || 0,
            normal_ranges: row.normal_ranges?.length || 0
          });
        });
      }

    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing configuration
  const handleLoad = async () => {
    if (!labId.trim() || !testName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both lab ID and test name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('lab_id', labId)
        .eq('test_name', testName)
        .eq('test_level', 1) // Only get top-level sub-tests
        .order('display_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Not Found',
          description: 'No configuration found for this test',
          variant: 'destructive'
        });
        return;
      }

      // Transform data to SubTest format
      const loadedSubTests: SubTest[] = data.map((config, idx) => {
        // Load age ranges from JSONB or fallback to individual fields
        const ageRanges = (config.age_ranges && config.age_ranges.length > 0)
          ? config.age_ranges.map((ar: any, arIdx: number) => ({
              id: `ar_${idx}_${arIdx}`,
              minAge: ar.min_age?.toString() || '0',
              maxAge: ar.max_age?.toString() || '100',
              unit: ar.unit || 'Years',
              description: ar.description || ''
            }))
          : [{
              id: `ar_${idx}_0`,
              minAge: config.min_age?.toString() || '0',
              maxAge: config.max_age?.toString() || '100',
              unit: config.age_unit || 'Years',
              description: config.age_description || ''
            }];

        // Load normal ranges from JSONB or fallback to individual fields
        const normalRanges = (config.normal_ranges && config.normal_ranges.length > 0)
          ? config.normal_ranges.map((nr: any, nrIdx: number) => ({
              id: `nr_${idx}_${nrIdx}`,
              ageRange: nr.age_range || '- Years',
              gender: nr.gender || 'Both',
              minValue: nr.min_value !== null && nr.min_value !== undefined ? nr.min_value.toString() : '',
              maxValue: nr.max_value !== null && nr.max_value !== undefined ? nr.max_value.toString() : '',
              unit: nr.unit || ''
            }))
          : [{
              id: `nr_${idx}_0`,
              ageRange: `${config.min_age}-${config.max_age} ${config.age_unit}`,
              gender: config.gender || 'Both',
              minValue: config.min_value !== null && config.min_value !== undefined ? config.min_value.toString() : '',
              maxValue: config.max_value !== null && config.max_value !== undefined ? config.max_value.toString() : '',
              unit: config.normal_unit || ''
            }];

        // Load nested sub-tests from JSONB
        const nestedSubTests = (config.nested_sub_tests && config.nested_sub_tests.length > 0)
          ? config.nested_sub_tests.map((nst: any, nstIdx: number) => ({
              id: `nst_${idx}_${nstIdx}`,
              name: nst.name || '',
              unit: nst.unit || '',
              ageRanges: (nst.age_ranges || []).map((ar: any, arIdx: number) => ({
                id: `nst_${idx}_${nstIdx}_ar_${arIdx}`,
                minAge: ar.min_age?.toString() || '0',
                maxAge: ar.max_age?.toString() || '100',
                unit: ar.unit || 'Years',
                description: ar.description || ''
              })),
              normalRanges: (nst.normal_ranges || []).map((nr: any, nrIdx: number) => ({
                id: `nst_${idx}_${nstIdx}_nr_${nrIdx}`,
                ageRange: nr.age_range || '- Years',
                gender: nr.gender || 'Both',
                minValue: nr.min_value !== null && nr.min_value !== undefined ? nr.min_value.toString() : '',
                maxValue: nr.max_value !== null && nr.max_value !== undefined ? nr.max_value.toString() : '',
                unit: nr.unit || ''
              })),
              subTests: []
            }))
          : [];

        return {
          id: config.id,
          name: config.sub_test_name,
          unit: config.unit || '',
          ageRanges,
          normalRanges,
          subTests: nestedSubTests
        };
      });

      setSubTests(loadedSubTests);

      toast({
        title: 'Loaded',
        description: `Loaded ${loadedSubTests.length} sub-tests`,
      });

    } catch (error: any) {
      console.error('Error loading:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Lab Test Configuration Manager</h1>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Lab ID</Label>
          <Input
            placeholder="Enter lab UUID"
            value={labId}
            onChange={(e) => setLabId(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Get lab ID: SELECT id FROM lab LIMIT 1;
          </p>
        </div>
        <div>
          <Label>Test Name</Label>
          <Input
            placeholder="e.g., CBC"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button
            onClick={handleLoad}
            disabled={isLoading}
            variant="outline"
          >
            Load
          </Button>
        </div>
      </div>

      <TestConfigurationSection
        testName={testName}
        onTestNameChange={setTestName}
        subTests={subTests}
        onSubTestsChange={setSubTests}
        onReorder={handleSave}
        isLoading={isLoading}
      />

      {subTests.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Preview (will be saved):</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(subTests, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
