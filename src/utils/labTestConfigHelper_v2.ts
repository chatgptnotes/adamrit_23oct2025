// Updated helper functions for saving nested sub-tests with multiple ranges
import { supabase } from '@/integrations/supabase/client';

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

export interface TestConfig {
  id?: string;
  lab_id: string;
  test_name: string;
  sub_test_name: string;
  unit: string | null;
  parent_config_id?: string | null;
  test_level?: number;
  display_order?: number;
  is_active?: boolean;
  // NEW: Multiple ranges as arrays
  age_ranges: AgeRange[];
  normal_ranges: NormalRange[];
  nested_configs?: TestConfig[]; // Nested sub-tests
}

/**
 * Recursively saves test configuration with nested sub-tests and multiple ranges
 */
export async function saveTestConfigWithNested(
  config: TestConfig,
  parentConfigId: string | null = null,
  testLevel: number = 1
): Promise<string[]> {
  const savedIds: string[] = [];

  try {
    // Get first age range and normal range for backward compatibility
    const firstAgeRange = config.age_ranges?.[0];
    const firstNormalRange = config.normal_ranges?.[0];

    const configData = {
      lab_id: config.lab_id,
      test_name: config.test_name,
      sub_test_name: config.sub_test_name,
      unit: config.unit || null,
      // Old columns (for backward compatibility)
      min_age: firstAgeRange ? parseInt(firstAgeRange.minAge) || 0 : 0,
      max_age: firstAgeRange ? parseInt(firstAgeRange.maxAge) || 100 : 100,
      age_unit: firstAgeRange?.unit || 'Years',
      age_description: firstAgeRange?.description || null,
      gender: firstNormalRange?.gender || 'Both',
      min_value: firstNormalRange ? parseFloat(firstNormalRange.minValue) || 0 : 0,
      max_value: firstNormalRange ? parseFloat(firstNormalRange.maxValue) || 0 : 0,
      normal_unit: config.unit || null,
      // Hierarchy
      parent_config_id: parentConfigId,
      test_level: testLevel,
      display_order: config.display_order || 0,
      is_active: config.is_active !== false,
      // NEW: Store all ranges as JSONB arrays
      age_ranges: JSON.stringify(config.age_ranges || []),
      normal_ranges: JSON.stringify(config.normal_ranges || [])
    };

    console.log(`💾 Saving config at level ${testLevel}:`, config.sub_test_name);

    const { data: savedConfig, error } = await supabase
      .from('lab_test_config')
      .insert(configData)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving lab test config:', error);
      throw new Error(`Failed to save config "${config.sub_test_name}": ${error.message}`);
    }

    const currentConfigId = savedConfig.id;
    savedIds.push(currentConfigId);

    console.log(`✅ Saved "${config.sub_test_name}" with ${config.age_ranges?.length || 0} age ranges, ${config.normal_ranges?.length || 0} normal ranges`);

    // Recursively save nested configs
    if (config.nested_configs && config.nested_configs.length > 0) {
      console.log(`📂 Saving ${config.nested_configs.length} nested configs for "${config.sub_test_name}"`);

      for (let i = 0; i < config.nested_configs.length; i++) {
        const nestedConfig = config.nested_configs[i];
        if (nestedConfig.display_order === undefined) {
          nestedConfig.display_order = i;
        }

        const nestedIds = await saveTestConfigWithNested(
          nestedConfig,
          currentConfigId,
          testLevel + 1
        );

        savedIds.push(...nestedIds);
      }
    }

    return savedIds;

  } catch (error) {
    console.error('Error in saveTestConfigWithNested:', error);
    throw error;
  }
}

/**
 * Load test configs with nested structure and multiple ranges
 */
export async function loadTestConfigsWithNested(
  labId: string,
  testName: string
): Promise<TestConfig[]> {
  try {
    const { data: allConfigs, error } = await supabase
      .from('lab_test_config')
      .select('*')
      .eq('lab_id', labId)
      .eq('test_name', testName)
      .eq('is_active', true)
      .order('test_level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading lab test configs:', error);
      throw error;
    }

    if (!allConfigs || allConfigs.length === 0) {
      return [];
    }

    // Build hierarchical structure
    const configsMap = new Map();
    const rootConfigs: TestConfig[] = [];

    // First pass: Create map
    allConfigs.forEach(config => {
      configsMap.set(config.id, {
        ...config,
        // Parse JSONB arrays
        age_ranges: typeof config.age_ranges === 'string'
          ? JSON.parse(config.age_ranges)
          : config.age_ranges || [],
        normal_ranges: typeof config.normal_ranges === 'string'
          ? JSON.parse(config.normal_ranges)
          : config.normal_ranges || [],
        nested_configs: []
      });
    });

    // Second pass: Build hierarchy
    allConfigs.forEach(config => {
      const configNode = configsMap.get(config.id);

      if (config.parent_config_id) {
        const parent = configsMap.get(config.parent_config_id);
        if (parent) {
          parent.nested_configs.push(configNode);
        }
      } else {
        rootConfigs.push(configNode);
      }
    });

    return rootConfigs;

  } catch (error) {
    console.error('Error in loadTestConfigsWithNested:', error);
    throw error;
  }
}

/**
 * Convert SubTest from UI component to TestConfig for database
 */
export function convertSubTestToConfig(
  subTest: any,
  labId: string,
  testName: string
): TestConfig {
  return {
    lab_id: labId,
    test_name: testName,
    sub_test_name: subTest.name,
    unit: subTest.unit || null,
    age_ranges: subTest.ageRanges || [],
    normal_ranges: subTest.normalRanges || [],
    nested_configs: subTest.subTests?.map((nested: any) =>
      convertSubTestToConfig(nested, labId, testName)
    ) || []
  };
}

/**
 * Save all sub-tests from TestConfigurationSection component
 */
export async function saveAllSubTestConfigs(
  labId: string,
  testName: string,
  subTests: any[]
): Promise<string[]> {
  const allSavedIds: string[] = [];

  for (let i = 0; i < subTests.length; i++) {
    const subTest = subTests[i];
    const config = convertSubTestToConfig(subTest, labId, testName);
    config.display_order = i;

    const savedIds = await saveTestConfigWithNested(config, null, 1);
    allSavedIds.push(...savedIds);
  }

  return allSavedIds;
}
