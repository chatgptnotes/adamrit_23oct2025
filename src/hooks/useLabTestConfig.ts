import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NestedSubTest {
  name: string;
  unit: string;
  age_ranges?: any[];
  normal_ranges?: any[];
}

export interface SubTest {
  id: string;
  lab_id: string;
  test_name: string;
  sub_test_name: string;
  unit: string;
  min_age: number;
  max_age: number;
  age_unit: string;
  nested_sub_tests?: NestedSubTest[];
  normal_ranges?: any[];
  formula?: string | null;  // Formula for auto-calculation
  test_type?: string;        // Numeric or Text
  text_value?: string | null; // Text value for Text type
}

export interface TestResult {
  subTestId: string;
  subTestName: string;
  observedValue: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | '';
  comments: string;
  abnormal: boolean;
  file?: File;
}

export const useLabTestConfig = () => {
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingSubTests, setLoadingSubTests] = useState(false);

  const fetchAvailableTests = async () => {
    setLoadingTests(true);
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('test_name')
        .order('test_name');

      if (error) throw error;

      const uniqueTests = [...new Set(data?.map(item => item.test_name) || [])];
      setAvailableTests(uniqueTests);
    } catch (error) {
      console.error('Error fetching available tests:', error);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchSubTestsForTest = async (testName: string) => {
    console.log('🔍 Fetching sub-tests for:', testName);
    setLoadingSubTests(true);
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('id, lab_id, test_name, sub_test_name, unit, min_age, max_age, age_unit, nested_sub_tests, normal_ranges')
        .eq('test_name', testName)
        .order('display_order', { ascending: true })
        .order('sub_test_name');

      console.log('✅ Fetched sub-tests data:', data);
      if (error) {
        console.error('❌ Sub-tests fetch error:', error);
        throw error;
      }

      // Fetch formulas from lab_test_formulas table
      const { data: formulasData, error: formulaError } = await supabase
        .from('lab_test_formulas')
        .select('*')
        .eq('test_name', testName);

      console.log('✅ Fetched formulas data:', formulasData);
      if (formulaError) {
        console.error('❌ Formula fetch error:', formulaError);
      }
      if (!formulasData || formulasData.length === 0) {
        console.warn('⚠️ No formulas found for test:', testName);
      }

      // Create a map of formulas by sub_test_name
      const formulasMap = new Map<string, any>();
      if (formulasData) {
        formulasData.forEach(formula => {
          formulasMap.set(formula.sub_test_name, formula);
        });
      }

      // Merge formula data with sub-tests
      const subTestsWithFormulas = data?.map(subTest => {
        const formulaData = formulasMap.get(subTest.sub_test_name);
        return {
          ...subTest,
          formula: formulaData?.formula || null,
          test_type: formulaData?.test_type || 'Numeric',
          text_value: formulaData?.text_value || null
        };
      }) || [];

      // Log nested sub-tests for debugging
      subTestsWithFormulas.forEach(subTest => {
        if (subTest.nested_sub_tests && subTest.nested_sub_tests.length > 0) {
          console.log(`  📦 ${subTest.sub_test_name} has ${subTest.nested_sub_tests.length} nested sub-tests:`, subTest.nested_sub_tests);
        }
        if (subTest.formula) {
          console.log(`  📐 ${subTest.sub_test_name} has formula: ${subTest.formula}`);
        }
      });

      setSubTests(subTestsWithFormulas);
      console.log('✅ Sub-tests set to state with formulas');
    } catch (error) {
      console.error('❌ Error fetching sub tests:', error);
    } finally {
      setLoadingSubTests(false);
    }
  };

  const getNormalRange = (subTest: SubTest, patientAge: number, patientGender: string): string => {
    // For now, return a placeholder. You can add min/max values to your table later
    return `Consult reference values ${subTest.unit}`;
  };

  const isAbnormalValue = (value: string, subTest: SubTest, patientAge: number, patientGender: string): 'normal' | 'high' | 'low' | '' => {
    // For now, return empty. You can add min/max value logic later
    return '';
  };

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  // Debug function to log data
  const debugTestData = async (testName: string) => {
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', testName);

      console.log(`Debug data for test "${testName}":`, data);
      if (error) console.error('Debug error:', error);
    } catch (err) {
      console.error('Debug fetch error:', err);
    }
  };

  return {
    availableTests,
    subTests,
    loadingTests,
    loadingSubTests,
    fetchAvailableTests,
    fetchSubTestsForTest,
    getNormalRange,
    isAbnormalValue,
    debugTestData
  };
};

