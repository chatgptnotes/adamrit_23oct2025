import React from 'react';

/**
 * Utility functions to avoid duplicate mapping patterns
 */

/**
 * ✅ CORRECT PATTERN - Single mapping with conditional rendering
 * Use this instead of duplicate .map() calls
 */
export const renderItemsWithCondition = <T>(
  items: T[],
  renderFn: (item: T, index: number) => React.ReactNode,
  condition?: (item: T, index: number) => boolean
) => {
  return items
    .filter((item, index) => condition ? condition(item, index) : true)
    .map((item, index) => renderFn(item, index));
};

/**
 * ✅ CORRECT PATTERN - For Conservative Treatment conditional rendering
 */
export const renderItemsExcludingConservative = <T>(
  items: T[],
  renderFn: (item: T, index: number) => React.ReactNode,
  section?: string
) => {
  return items
    .filter((item, index) => {
      // Skip if section is Conservative and item is conservative type
      if (section === "Conservative") {
        return false; // Don't render anything for Conservative section
      }
      return true;
    })
    .map((item, index) => renderFn(item, index));
};

/**
 * ✅ CORRECT PATTERN - Single mapping with multiple conditions
 */
export const renderItemsWithMultipleConditions = <T>(
  items: T[],
  renderFn: (item: T, index: number) => React.ReactNode,
  conditions: {
    excludeConservative?: boolean;
    excludeSection?: string;
    customFilter?: (item: T, index: number) => boolean;
  } = {}
) => {
  return items
    .filter((item, index) => {
      // Apply custom filter if provided
      if (conditions.customFilter && !conditions.customFilter(item, index)) {
        return false;
      }
      
      // Exclude Conservative section if specified
      if (conditions.excludeConservative && conditions.excludeSection === "Conservative") {
        return false;
      }
      
      return true;
    })
    .map((item, index) => renderFn(item, index));
};

/**
 * ❌ WRONG PATTERN - Don't do this:
 * {items.map(item => <Row item={item} />)}
 * {items.map(item => <Row item={item} />)} // Duplicate!
 * 
 * ✅ CORRECT PATTERN - Do this instead:
 * {renderItemsWithCondition(items, item => <Row item={item} />)}
 */
