// Helper functions for saving nested sub-tests to lab_test_config table
import { supabase } from '@/integrations/supabase/client';

export interface TestConfig {
  id?: string;
  lab_id: string;
  test_name: string;
  sub_test_name: string;
  unit: string | null;
  min_age: number;
  max_age: number;
  age_unit: 'Days' | 'Months' | 'Years';
  age_description: string | null;
  gender: 'Male' | 'Female' | 'Both' | 'Child';
  min_value: number;
  max_value: number;
  normal_unit: string | null;
  parent_config_id?: string | null;
  test_level?: number;
  display_order?: number;
  is_active?: boolean;
  nested_configs?: TestConfig[]; // Nested sub-tests
}

/**
 * Recursively saves test configuration with nested sub-tests
 * @param config - Test configuration
 * @param parentConfigId - Parent config ID (null for root level)
 * @param testLevel - Hierarchy level (1=sub-test, 2=nested, etc.)
 * @returns Array of saved config IDs
 */
export async function saveTestConfigWithNested(
  config: TestConfig,
  parentConfigId: string | null = null,
  testLevel: number = 1
): Promise<string[]> {
  const savedIds: string[] = [];

  try {
    // Prepare config data
    const configData = {
      lab_id: config.lab_id,
      test_name: config.test_name,
      sub_test_name: config.sub_test_name,
      unit: config.unit || null,
      min_age: config.min_age,
      max_age: config.max_age,
      age_unit: config.age_unit || 'Years',
      age_description: config.age_description || null,
      gender: config.gender || 'Both',
      min_value: config.min_value,
      max_value: config.max_value,
      normal_unit: config.normal_unit || null,
      parent_config_id: parentConfigId,
      test_level: testLevel,
      display_order: config.display_order || 0,
      is_active: config.is_active !== false
    };

    console.log(`💾 Saving config at level ${testLevel}:`, config.sub_test_name);

    // Insert the config
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

    console.log(`✅ Saved config "${config.sub_test_name}" with ID:`, currentConfigId);

    // Recursively save nested configs
    if (config.nested_configs && config.nested_configs.length > 0) {
      console.log(`📂 Saving ${config.nested_configs.length} nested configs for "${config.sub_test_name}"`);

      for (let i = 0; i < config.nested_configs.length; i++) {
        const nestedConfig = config.nested_configs[i];

        // Set display order if not set
        if (nestedConfig.display_order === undefined) {
          nestedConfig.display_order = i;
        }

        // Recursively save nested config
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
 * Load test configs with nested structure
 * @param labId - Lab ID
 * @param testName - Main test name
 * @returns Hierarchical structure of configs
 */
export async function loadTestConfigsWithNested(
  labId: string,
  testName: string
): Promise<TestConfig[]> {
  try {
    // Get all configs for this lab and test
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

    // First pass: Create map of all configs
    allConfigs.forEach(config => {
      configsMap.set(config.id, { ...config, nested_configs: [] });
    });

    // Second pass: Build hierarchy
    allConfigs.forEach(config => {
      const configNode = configsMap.get(config.id);

      if (config.parent_config_id) {
        // This is a nested config, add to parent's nested_configs
        const parent = configsMap.get(config.parent_config_id);
        if (parent) {
          parent.nested_configs.push(configNode);
        }
      } else {
        // This is a root config (direct sub-test)
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
 * Update existing config
 */
export async function updateTestConfig(
  configId: string,
  updates: Partial<TestConfig>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('lab_test_config')
      .update(updates)
      .eq('id', configId);

    if (error) {
      throw new Error(`Failed to update config: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating test config:', error);
    throw error;
  }
}

/**
 * Delete config and all nested configs (cascades automatically)
 */
export async function deleteTestConfig(configId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('lab_test_config')
      .delete()
      .eq('id', configId);

    if (error) {
      throw new Error(`Failed to delete config: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting test config:', error);
    throw error;
  }
}

/**
 * Convert SubTest interface from TestConfigurationSection to TestConfig
 */
export function convertSubTestToConfig(
  subTest: any,
  labId: string,
  testName: string
): TestConfig {
  // Get first normal range for default values
  const firstNormalRange = subTest.normalRanges?.[0];
  const firstAgeRange = subTest.ageRanges?.[0];

  return {
    lab_id: labId,
    test_name: testName,
    sub_test_name: subTest.name,
    unit: subTest.unit || null,
    min_age: firstAgeRange ? parseInt(firstAgeRange.minAge) : 0,
    max_age: firstAgeRange ? parseInt(firstAgeRange.maxAge) : 100,
    age_unit: firstAgeRange?.unit || 'Years',
    age_description: firstAgeRange?.description || null,
    gender: firstNormalRange?.gender || 'Both',
    min_value: firstNormalRange ? parseFloat(firstNormalRange.minValue) : 0,
    max_value: firstNormalRange ? parseFloat(firstNormalRange.maxValue) : 0,
    normal_unit: subTest.unit || null,
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
