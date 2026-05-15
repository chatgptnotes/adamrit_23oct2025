// Server-side field validators. Mirrors src/lib/code-assistant/validate.ts (frontend).
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §9

export type FieldError = { code: string; message: string };

export const MAX_PROMPT_LENGTH = 10_000;
export const MIN_PROMPT_LENGTH = 5;
export const MAX_ATTACHED_FILES = 5;

export function validatePrompt(value: unknown): FieldError | null {
  if (typeof value !== 'string') {
    return { code: 'prompt-required', message: 'Please describe what you want to change.' };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { code: 'prompt-required', message: 'Please describe what you want to change.' };
  }
  if (trimmed.length < MIN_PROMPT_LENGTH) {
    return { code: 'prompt-too-short', message: `Tell us a bit more — at least ${MIN_PROMPT_LENGTH} characters.` };
  }
  if (value.length > MAX_PROMPT_LENGTH) {
    return {
      code: 'prompt-too-long',
      message: `Prompt is ${value.length.toLocaleString()} / ${MAX_PROMPT_LENGTH.toLocaleString()} characters. Shorten it or attach a file instead.`,
    };
  }
  return null;
}

export function validateAttachments(paths: unknown): FieldError | null {
  if (!Array.isArray(paths)) {
    return { code: 'too-many-files', message: 'Invalid attachments.' };
  }
  if (paths.length > MAX_ATTACHED_FILES) {
    return {
      code: 'too-many-files',
      message: `You can attach up to ${MAX_ATTACHED_FILES} files. Remove one to add another.`,
    };
  }
  for (const p of paths) {
    if (typeof p !== 'string') {
      return { code: 'file-not-found', message: 'Invalid file path.' };
    }
  }
  return null;
}
