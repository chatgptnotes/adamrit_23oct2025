// Helper functions for saving nested sub-tests to lab_results table
import { supabase } from '@/integrations/supabase/client';

export interface SubTest {
  id: string;
  name: string;
  unit: string;
  ageRanges: AgeRange[];
  normalRanges: NormalRange[];
  subTests?: SubTest[];
  result_value?: string;
  reference_range?: string;
  comments?: string;
  is_abnormal?: boolean;
}

export interface AgeRange {
  id: string;
  minAge: string;
  maxAge: string;
  unit: 'Days' | 'Months' | 'Years';
  description: string;
}

export interface NormalRange {
  id: string;
  ageRange: string;
  gender: 'Male' | 'Female' | 'Both' | 'Child';
  minValue: string;
  maxValue: string;
  unit: string;
}

export interface SaveLabResultParams {
  mainTestName: string;
  testName: string;
  testCategory?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  comments?: string;
  isAbnormal?: boolean;
  resultStatus?: 'Preliminary' | 'Final';
  technicianName?: string;
  pathologistName?: string;
  authenticatedResult?: boolean;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  visitId?: string;
  labId?: string;
  parentTestId?: string;
  testLevel?: number;
  displayOrder?: number;
  subTestConfig?: any;
}

/**
 * Recursively saves a test and all its nested sub-tests to lab_results table
 * @param params - Parameters for the main test
 * @param subTests - Array of nested sub-tests
 * @param parentTestId - ID of parent test (null for main test)
 * @param testLevel - Hierarchy level (0=main, 1=sub-test, 2=nested sub-test)
 * @returns Array of saved test IDs
 */
export async function saveTestWithNestedSubTests(
  params: SaveLabResultParams,
  subTests: SubTest[] = [],
  parentTestId: string | null = null,
  testLevel: number = 0
): Promise<string[]> {
  const savedIds: string[] = [];

  try {
    // Prepare the main test data
    const labResultData = {
      main_test_name: params.mainTestName,
      test_name: params.testName,
      test_category: params.testCategory || 'GENERAL',
      result_value: params.resultValue || null,
      result_unit: params.resultUnit || '',
      reference_range: params.referenceRange || '',
      comments: params.comments || '',
      is_abnormal: params.isAbnormal || false,
      result_status: params.resultStatus || 'Preliminary',
      technician_name: params.technicianName || '',
      pathologist_name: params.pathologistName || '',
      authenticated_result: params.authenticatedResult || false,
      patient_name: params.patientName,
      patient_age: params.patientAge || null,
      patient_gender: params.patientGender || 'Unknown',
      visit_id: params.visitId || null,
      lab_id: params.labId || null,
      parent_test_id: parentTestId,
      test_level: testLevel,
      display_order: params.displayOrder || 0,
      sub_test_config: params.subTestConfig || {}
    };

    // Remove undefined values
    Object.keys(labResultData).forEach(key => {
      if (labResultData[key] === undefined) {
        delete labResultData[key];
      }
    });

    console.log(`💾 Saving test at level ${testLevel}:`, params.testName);

    // Insert the main test
    const { data: savedTest, error } = await supabase
      .from('lab_results')
      .insert(labResultData)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving lab result:', error);
      throw new Error(`Failed to save test "${params.testName}": ${error.message}`);
    }

    const currentTestId = savedTest.id;
    savedIds.push(currentTestId);

    console.log(`✅ Saved test "${params.testName}" with ID:`, currentTestId);

    // Recursively save nested sub-tests
    if (subTests && subTests.length > 0) {
      console.log(`📂 Saving ${subTests.length} nested sub-tests for "${params.testName}"`);

      for (let i = 0; i < subTests.length; i++) {
        const subTest = subTests[i];

        // Prepare sub-test configuration
        const subTestConfig = {
          unit: subTest.unit,
          ageRanges: subTest.ageRanges || [],
          normalRanges: subTest.normalRanges || []
        };

        // Calculate reference range from normal ranges
        let calculatedReferenceRange = '';
        if (subTest.normalRanges && subTest.normalRanges.length > 0) {
          const firstRange = subTest.normalRanges[0];
          calculatedReferenceRange = `${firstRange.minValue}-${firstRange.maxValue} ${firstRange.unit}`;
        }

        // Create parameters for nested sub-test
        const nestedParams: SaveLabResultParams = {
          mainTestName: params.mainTestName, // Keep original main test name
          testName: subTest.name,
          testCategory: params.testCategory,
          resultValue: subTest.result_value || '',
          resultUnit: subTest.unit,
          referenceRange: subTest.reference_range || calculatedReferenceRange,
          comments: subTest.comments || '',
          isAbnormal: subTest.is_abnormal || false,
          resultStatus: params.resultStatus,
          technicianName: params.technicianName,
          pathologistName: params.pathologistName,
          authenticatedResult: params.authenticatedResult,
          patientName: params.patientName,
          patientAge: params.patientAge,
          patientGender: params.patientGender,
          visitId: params.visitId,
          labId: params.labId,
          parentTestId: currentTestId,
          testLevel: testLevel + 1,
          displayOrder: i,
          subTestConfig: subTestConfig
        };

        // Recursively save this sub-test and its nested sub-tests
        const nestedIds = await saveTestWithNestedSubTests(
          nestedParams,
          subTest.subTests || [],
          currentTestId,
          testLevel + 1
        );

        savedIds.push(...nestedIds);
      }
    }

    return savedIds;

  } catch (error) {
    console.error('Error in saveTestWithNestedSubTests:', error);
    throw error;
  }
}

/**
 * Loads test results with nested structure
 * @param visitId - Visit ID to load tests for
 * @returns Hierarchical structure of tests
 */
export async function loadTestsWithNestedSubTests(visitId: string) {
  try {
    // Get all tests for this visit
    const { data: allTests, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('visit_id', visitId)
      .order('test_level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading lab results:', error);
      throw error;
    }

    // Build hierarchical structure
    const testsMap = new Map();
    const rootTests = [];

    // First pass: Create map of all tests
    allTests?.forEach(test => {
      testsMap.set(test.id, { ...test, subTests: [] });
    });

    // Second pass: Build hierarchy
    allTests?.forEach(test => {
      const testNode = testsMap.get(test.id);

      if (test.parent_test_id) {
        // This is a nested test, add to parent's subTests
        const parent = testsMap.get(test.parent_test_id);
        if (parent) {
          parent.subTests.push(testNode);
        }
      } else {
        // This is a root test
        rootTests.push(testNode);
      }
    });

    return rootTests;

  } catch (error) {
    console.error('Error in loadTestsWithNestedSubTests:', error);
    throw error;
  }
}

/**
 * Parse result_value JSON to get actual value
 */
export function parseResultValue(resultValue: string | null): string {
  if (!resultValue) return '';

  try {
    const parsed = JSON.parse(resultValue);
    return parsed.value || resultValue;
  } catch {
    return resultValue;
  }
}
