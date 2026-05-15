// Frontend field validators. Mirror of api/lib/code-assistant/validate.ts.

import type { FieldError } from './types';

export const MAX_PROMPT_LENGTH = 10_000;
export const MIN_PROMPT_LENGTH = 5;
export const MAX_ATTACHED_FILES = 5;

export function validatePrompt(value: string): FieldError | null {
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

export function validateAttachments(paths: string[]): FieldError | null {
  if (paths.length > MAX_ATTACHED_FILES) {
    return { code: 'too-many-files', message: `You can attach up to ${MAX_ATTACHED_FILES} files. Remove one to add another.` };
  }
  return null;
}
