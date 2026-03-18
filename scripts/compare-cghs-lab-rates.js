import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Matching helpers ---

/** Normalize a name: lowercase, strip parenthetical content, punctuation, extra whitespace */
function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')       // remove parenthetical content
    .replace(/['\-\/,\.]/g, ' ')     // replace punctuation with space
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

/** Extract abbreviation from parentheses, e.g. "Thyroid stimulating hormone (TSH)" → "TSH" */
function extractAbbreviation(name) {
  const matches = name.match(/\(([A-Za-z0-9\s\/\-]+)\)/g);
  if (!matches) return null;
  // Return the shortest parenthetical that looks like an abbreviation (≤10 chars, mostly uppercase)
  for (const m of matches) {
    const inner = m.slice(1, -1).trim();
    if (inner.length <= 15 && /[A-Z]/.test(inner)) {
      return inner.replace(/\s+/g, '').toUpperCase();
    }
  }
  return null;
}

/** Check if a string itself is an abbreviation (short, has uppercase letters) */
function isAbbreviation(name) {
  const trimmed = name.trim();
  return trimmed.length <= 15 && /^[A-Za-z0-9\/\-\s]+$/.test(trimmed) && /[A-Z]/.test(trimmed);
}

/** Extract significant keywords from a name (≥3 chars, excluding stopwords) */
const STOPWORDS = new Set([
  'test', 'serum', 'level', 'total', 'the', 'and', 'for', 'of', 'in', 'by',
  'with', 'from', 'each', 'per', 'all', 'blood', 'urine', 'estimation',
  'determination', 'quantitative', 'qualitative',
]);

function extractKeywords(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

/** Calculate what fraction of `wordsA` appear in `wordsB` */
function overlapFraction(wordsA, wordsB) {
  if (wordsA.length === 0) return 0;
  const setB = new Set(wordsB);
  const hits = wordsA.filter(w => setB.has(w)).length;
  return hits / wordsA.length;
}

// --- Main ---

async function main() {
  console.log('=== CGHS Lab Rates — Multi-Pass Fuzzy Comparison (Dry Run) ===\n');

  // 1. Load PDF data (LB-prefixed entries only)
  const allEntries = JSON.parse(readFileSync('/tmp/cghs_all_entries.json', 'utf8'));
  const pdfLabEntries = allEntries.filter(e => e.code && e.code.startsWith('LB'));
  console.log(`PDF lab entries (LB codes): ${pdfLabEntries.length}`);

  // 2. Fetch all records from the lab table
  const { data: dbRecords, error } = await supabase
    .from('lab')
    .select('id, name, CGHS_code, NABH_rates_in_rupee');

  if (error) {
    console.error('Error fetching lab table:', error.message);
    process.exit(1);
  }
  console.log(`DB lab records: ${dbRecords.length}\n`);

  // Track what's matched
  const allMatches = [];            // { pass, pdfEntry, dbRecord, confidence }
  const matchedPdfIndices = new Set();
  const matchedDbIds = new Set();

  // Helpers to get remaining unmatched
  const unmatchedPdf = () => pdfLabEntries.filter((_, i) => !matchedPdfIndices.has(i));
  const unmatchedDb = () => dbRecords.filter(db => !matchedDbIds.has(db.id));

  function addMatch(pass, confidence, pdfIdx, pdfEntry, dbRecord) {
    matchedPdfIndices.add(pdfIdx);
    matchedDbIds.add(dbRecord.id);
    allMatches.push({ pass, confidence, pdfEntry, dbRecord });
  }

  // ========== PASS 1: Exact match (case-insensitive, trimmed) ==========
  for (let i = 0; i < pdfLabEntries.length; i++) {
    if (matchedPdfIndices.has(i)) continue;
    const pdfName = pdfLabEntries[i].name.trim().toLowerCase();
    const dbMatch = unmatchedDb().find(db => db.name && db.name.trim().toLowerCase() === pdfName);
    if (dbMatch) {
      addMatch(1, 'high', i, pdfLabEntries[i], dbMatch);
    }
  }
  const pass1Count = allMatches.filter(m => m.pass === 1).length;
  console.log(`Pass 1 (exact):        ${pass1Count} matches`);

  // ========== PASS 2: Normalized match ==========
  for (let i = 0; i < pdfLabEntries.length; i++) {
    if (matchedPdfIndices.has(i)) continue;
    const pdfNorm = normalize(pdfLabEntries[i].name);
    if (!pdfNorm) continue;
    const dbMatch = unmatchedDb().find(db => db.name && normalize(db.name) === pdfNorm);
    if (dbMatch) {
      addMatch(2, 'high', i, pdfLabEntries[i], dbMatch);
    }
  }
  const pass2Count = allMatches.filter(m => m.pass === 2).length;
  console.log(`Pass 2 (normalized):   ${pass2Count} matches`);

  // ========== PASS 3: Abbreviation extraction match ==========
  for (let i = 0; i < pdfLabEntries.length; i++) {
    if (matchedPdfIndices.has(i)) continue;
    const pdfName = pdfLabEntries[i].name;
    const pdfAbbr = extractAbbreviation(pdfName);
    const pdfKeywords = extractKeywords(pdfName);

    for (const db of unmatchedDb()) {
      if (!db.name) continue;
      const dbAbbr = extractAbbreviation(db.name);
      const dbName = db.name;

      let matched = false;

      // Case A: Both have abbreviations in parentheses that match
      if (pdfAbbr && dbAbbr && pdfAbbr === dbAbbr) {
        // Also check some keyword overlap to avoid false positives
        const dbKeywords = extractKeywords(dbName);
        const overlap = Math.max(
          overlapFraction(pdfKeywords, dbKeywords),
          overlapFraction(dbKeywords, pdfKeywords)
        );
        if (overlap >= 0.3 || pdfKeywords.length <= 1 || dbKeywords.length <= 1) {
          matched = true;
        }
      }

      // Case B: DB name IS the abbreviation, PDF has it in parentheses
      if (!matched && isAbbreviation(dbName.trim())) {
        const dbNameNorm = dbName.trim().replace(/[\s\/\-]/g, '').toUpperCase();
        if (pdfAbbr && pdfAbbr === dbNameNorm) {
          matched = true;
        }
        // Also check if PDF name contains the abbreviation in parentheses
        if (!matched) {
          const pdfLower = pdfName.toLowerCase();
          const dbLower = dbName.trim().toLowerCase();
          if (pdfLower.includes(`(${dbLower})`) || pdfLower.includes(`(${dbLower} `)) {
            matched = true;
          }
        }
      }

      // Case C: PDF name IS the abbreviation, DB has it in parentheses
      if (!matched && isAbbreviation(pdfName.trim())) {
        const pdfNameNorm = pdfName.trim().replace(/[\s\/\-]/g, '').toUpperCase();
        if (dbAbbr && dbAbbr === pdfNameNorm) {
          matched = true;
        }
      }

      if (matched) {
        addMatch(3, 'medium-high', i, pdfLabEntries[i], db);
        break;
      }
    }
  }
  const pass3Count = allMatches.filter(m => m.pass === 3).length;
  console.log(`Pass 3 (abbreviation): ${pass3Count} matches`);

  // ========== PASS 4: Keyword/substring containment match ==========
  for (let i = 0; i < pdfLabEntries.length; i++) {
    if (matchedPdfIndices.has(i)) continue;
    const pdfKeywords = extractKeywords(pdfLabEntries[i].name);
    if (pdfKeywords.length === 0) continue;

    let bestMatch = null;
    let bestScore = 0;

    for (const db of unmatchedDb()) {
      if (!db.name) continue;
      const dbKeywords = extractKeywords(db.name);
      if (dbKeywords.length === 0) continue;

      // Bidirectional: check both directions
      const dbInPdf = overlapFraction(dbKeywords, pdfKeywords);
      const pdfInDb = overlapFraction(pdfKeywords, dbKeywords);
      const score = Math.max(dbInPdf, pdfInDb);

      if (score >= 0.7 && score > bestScore) {
        bestScore = score;
        bestMatch = db;
      }
    }

    if (bestMatch) {
      addMatch(4, 'medium', i, pdfLabEntries[i], bestMatch);
    }
  }
  const pass4Count = allMatches.filter(m => m.pass === 4).length;
  console.log(`Pass 4 (keyword):      ${pass4Count} matches`);

  // ========== REPORT ==========
  const remaining = unmatchedPdf();
  const remainingDb = unmatchedDb();

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total matched:       ${allMatches.length} / ${pdfLabEntries.length} PDF entries`);
  console.log(`  Pass 1 (exact):      ${pass1Count}`);
  console.log(`  Pass 2 (normalized): ${pass2Count}`);
  console.log(`  Pass 3 (abbreviation): ${pass3Count}`);
  console.log(`  Pass 4 (keyword):    ${pass4Count}`);
  console.log(`Unmatched PDF:       ${remaining.length}`);
  console.log(`Unmatched DB:        ${remainingDb.length}`);
  console.log();

  // --- Pass 1 matches ---
  const pass1Matches = allMatches.filter(m => m.pass === 1);
  if (pass1Matches.length > 0) {
    console.log('--- PASS 1: Exact Matches (high confidence) ---');
    for (const m of pass1Matches) {
      const rateChanged = m.pdfEntry.rate !== String(m.dbRecord.NABH_rates_in_rupee) ? ' ← DIFFERENT' : '';
      console.log(`  ${m.pdfEntry.code} | "${m.pdfEntry.name}" → DB[${m.dbRecord.id}] "${m.dbRecord.name}" | PDF ₹${m.pdfEntry.rate} vs DB ₹${m.dbRecord.NABH_rates_in_rupee ?? 'null'}${rateChanged}`);
    }
    console.log();
  }

  // --- Pass 2 matches ---
  const pass2Matches = allMatches.filter(m => m.pass === 2);
  if (pass2Matches.length > 0) {
    console.log('--- PASS 2: Normalized Matches (high confidence) ---');
    for (const m of pass2Matches) {
      const rateChanged = m.pdfEntry.rate !== String(m.dbRecord.NABH_rates_in_rupee) ? ' ← DIFFERENT' : '';
      console.log(`  ${m.pdfEntry.code} | "${m.pdfEntry.name}" → DB[${m.dbRecord.id}] "${m.dbRecord.name}" | PDF ₹${m.pdfEntry.rate} vs DB ₹${m.dbRecord.NABH_rates_in_rupee ?? 'null'}${rateChanged}`);
    }
    console.log();
  }

  // --- Pass 3 matches ---
  const pass3Matches = allMatches.filter(m => m.pass === 3);
  if (pass3Matches.length > 0) {
    console.log('--- PASS 3: Abbreviation Matches (medium-high confidence) ---');
    for (const m of pass3Matches) {
      const rateChanged = m.pdfEntry.rate !== String(m.dbRecord.NABH_rates_in_rupee) ? ' ← DIFFERENT' : '';
      console.log(`  ${m.pdfEntry.code} | "${m.pdfEntry.name}" → DB[${m.dbRecord.id}] "${m.dbRecord.name}" | PDF ₹${m.pdfEntry.rate} vs DB ₹${m.dbRecord.NABH_rates_in_rupee ?? 'null'}${rateChanged}`);
    }
    console.log();
  }

  // --- Pass 4 matches ---
  const pass4Matches = allMatches.filter(m => m.pass === 4);
  if (pass4Matches.length > 0) {
    console.log('--- PASS 4: Keyword Matches (medium confidence — review these!) ---');
    for (const m of pass4Matches) {
      const rateChanged = m.pdfEntry.rate !== String(m.dbRecord.NABH_rates_in_rupee) ? ' ← DIFFERENT' : '';
      console.log(`  ${m.pdfEntry.code} | "${m.pdfEntry.name}" → DB[${m.dbRecord.id}] "${m.dbRecord.name}" | PDF ₹${m.pdfEntry.rate} vs DB ₹${m.dbRecord.NABH_rates_in_rupee ?? 'null'}${rateChanged}`);
    }
    console.log();
  }

  // --- Unmatched PDF ---
  if (remaining.length > 0) {
    console.log('--- UNMATCHED PDF ENTRIES (not found in DB) ---');
    for (const u of remaining) {
      console.log(`  ${u.code} | "${u.name}" | ₹${u.rate}`);
    }
    console.log();
  }

  // --- Unmatched DB ---
  if (remainingDb.length > 0) {
    console.log('--- UNMATCHED DB RECORDS (not found in PDF) ---');
    for (const u of remainingDb) {
      console.log(`  ID: ${u.id} | "${u.name}" | CGHS: ${u.CGHS_code ?? 'null'} | ₹${u.NABH_rates_in_rupee ?? 'null'}`);
    }
    console.log();
  }

  console.log('=== DRY RUN COMPLETE — No data was modified ===');
}

main().catch(console.error);
