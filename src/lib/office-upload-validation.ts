// Centralized client-side validation for Director's Files uploads.
// Accepts PDF, Word (.docx), Excel (.xlsx and legacy .xls). Other formats
// are rejected so that the View flow only ever has to render formats we
// can actually preview in-browser.

export const OFFICE_MAX_BYTES = 25 * 1024 * 1024;
export const SANITIZED_FILENAME_MAX_LENGTH = 200;

export type OfficeFileKind = 'pdf' | 'docx' | 'xlsx' | 'xls';

interface FileTypeSpec {
  kind: OfficeFileKind;
  extension: string;          // lowercase, including leading dot
  mimeTypes: readonly string[]; // browsers occasionally vary
  magicBytes: Uint8Array;     // expected file signature
  description: string;        // human-readable label for error messages
}

// PDF magic: literal '%PDF-' (5 bytes)
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]);
// OOXML (.docx / .xlsx) are ZIP archives → 'PK\x03\x04'
const ZIP_MAGIC = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
// Legacy OLE Compound Document (.xls / .doc / .ppt) signature
const OLE_MAGIC = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);

const FILE_TYPES: readonly FileTypeSpec[] = [
  {
    kind: 'pdf',
    extension: '.pdf',
    mimeTypes: ['application/pdf'],
    magicBytes: PDF_MAGIC,
    description: 'PDF',
  },
  {
    kind: 'docx',
    extension: '.docx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    magicBytes: ZIP_MAGIC,
    description: 'Word document',
  },
  {
    kind: 'xlsx',
    extension: '.xlsx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    magicBytes: ZIP_MAGIC,
    description: 'Excel spreadsheet',
  },
  {
    kind: 'xls',
    extension: '.xls',
    mimeTypes: ['application/vnd.ms-excel'],
    magicBytes: OLE_MAGIC,
    description: 'Excel (legacy) spreadsheet',
  },
];

/** HTML <input accept="..."> string covering all supported formats. */
export const OFFICE_ACCEPT_ATTR = [
  '.pdf', '.docx', '.xlsx', '.xls',
  ...FILE_TYPES.flatMap((t) => t.mimeTypes),
].join(',');

/** Server-side `allowed_mime_types` array for the Supabase bucket. */
export const OFFICE_ALLOWED_MIME_TYPES = FILE_TYPES.flatMap((t) => t.mimeTypes);

export type OfficeValidationResult =
  | { ok: true; kind: OfficeFileKind }
  | { ok: false; reason: string };

/**
 * Validate that a File is an acceptable Director's-Files upload.
 * Returns the detected kind on success; on failure, a human-readable reason
 * suitable for direct toast display.
 */
export async function validateOfficeFile(file: File): Promise<OfficeValidationResult> {
  if (file.size === 0) return { ok: false, reason: 'This file is empty.' };
  if (file.size > OFFICE_MAX_BYTES) return { ok: false, reason: 'File is larger than 25 MB.' };

  const lower = file.name.toLowerCase();
  const spec = FILE_TYPES.find((t) => lower.endsWith(t.extension));
  if (!spec) {
    return {
      ok: false,
      reason: 'Only PDF, Word (.docx), and Excel (.xlsx, .xls) files are accepted.',
    };
  }

  // file.type can be empty for files opened from some sources — accept empty
  // and rely on the magic-byte check below. Reject any non-empty MIME that
  // doesn't match the extension's expected MIME list.
  if (file.type && !spec.mimeTypes.includes(file.type)) {
    return {
      ok: false,
      reason: `This does not look like a ${spec.description} (wrong MIME type).`,
    };
  }

  try {
    const head = await file.slice(0, spec.magicBytes.length).arrayBuffer();
    if (!bytesEqual(new Uint8Array(head), spec.magicBytes)) {
      return { ok: false, reason: `This file is not a valid ${spec.description}.` };
    }
  } catch {
    return { ok: false, reason: 'Could not read the file. Please try again.' };
  }

  if (!sanitizeStorageFilename(file.name)) {
    return { ok: false, reason: 'Filename is not valid after sanitization.' };
  }

  return { ok: true, kind: spec.kind };
}

/** Infer kind from filename alone (for list rendering — no body read). */
export function inferOfficeKindFromName(name: string): OfficeFileKind | null {
  const lower = name.toLowerCase();
  const spec = FILE_TYPES.find((t) => lower.endsWith(t.extension));
  return spec?.kind ?? null;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Make a filename safe to use as a Supabase Storage object key.
 *
 * - Removes path separators and `..` so a malicious name cannot escape its
 *   bucket prefix.
 * - Strips control characters.
 * - Normalizes whitespace to `_`.
 * - Restricts to `[A-Za-z0-9._-]`.
 * - Collapses repeated `_`.
 * - Caps total length, preserving the file extension.
 *
 * Returns an empty string if nothing usable remains — callers should treat
 * that as a validation failure.
 */
export function sanitizeStorageFilename(name: string): string {
  if (!name) return '';

  const lastSep = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
  let base = lastSep >= 0 ? name.slice(lastSep + 1) : name;
  base = base.replace(/\.{2,}/g, '.');

  // Preserve any of our accepted extensions through truncation.
  const lower = base.toLowerCase();
  const matchedExt = ['.pdf', '.docx', '.xlsx', '.xls'].find((e) => lower.endsWith(e));
  const ext = matchedExt ?? '';
  const stem = ext ? base.slice(0, -ext.length) : base;

  let cleanStem = stem
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');

  const maxStemLength = Math.max(0, SANITIZED_FILENAME_MAX_LENGTH - ext.length);
  if (cleanStem.length > maxStemLength) {
    cleanStem = cleanStem.slice(0, maxStemLength).replace(/[._-]+$/g, '');
  }

  if (!cleanStem) return '';
  return `${cleanStem}${ext}`;
}
