#!/usr/bin/env node
/**
 * Script to execute the surgeon import SQL via Supabase client
 * Run with: node execute_import.js
 */

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, 'import_ayushman_surgeons.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Split into individual INSERT statements
const statements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.startsWith('INSERT INTO'));

console.log(`Found ${statements.length} INSERT statements to execute`);

// Display the SQL statements for manual execution
console.log('\n=== SQL STATEMENTS TO EXECUTE ===\n');

statements.forEach((stmt, index) => {
  console.log(`-- Statement ${index + 1}`);
  console.log(stmt + ';\n');
});

console.log('=== END OF SQL STATEMENTS ===\n');

console.log('📋 Instructions:');
console.log('1. Go to your Supabase dashboard: https://app.supabase.com/');
console.log('2. Navigate to your project');
console.log('3. Go to SQL Editor');
console.log('4. Copy and paste the SQL statements above');
console.log('5. Click "Run" to execute the import');
console.log('\nAlternatively, you can execute the import_ayushman_surgeons.sql file directly in the SQL Editor.');

// Also create a consolidated single SQL file for easier execution
const consolidatedSql = statements.map(stmt => stmt + ';').join('\n\n');
const consolidatedFile = path.join(__dirname, 'consolidated_import.sql');

fs.writeFileSync(consolidatedFile, `-- Consolidated import SQL for ayushman_surgeons
-- Execute this in Supabase SQL Editor
-- Total records: ${statements.length}

${consolidatedSql}

-- Import completed successfully!
SELECT COUNT(*) as total_surgeons FROM public.ayushman_surgeons;
`);

console.log(`\n📄 Consolidated SQL file created: ${consolidatedFile}`);
console.log('You can upload this file directly to Supabase SQL Editor.');