// Uniform success / error response helpers for Vercel functions.
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §10 (error catalog)
//      and §11 (API contracts).

import type { VercelResponse } from '@vercel/node';
import { errorCatalog, ErrorCode } from './errorCatalog';

export function successResponse(res: VercelResponse, data: object, status = 200) {
  return res.status(status).json({ ok: true, ...data });
}

export function errorResponse(
  res: VercelResponse,
  code: ErrorCode | string,
  status: number,
  details?: Record<string, unknown>,
  extra?: Record<string, unknown>,
) {
  const entry = errorCatalog[code as ErrorCode] ?? {
    title: 'Something went wrong',
    message: code,
    hint: undefined,
  };
  return res.status(status).json({
    ok: false,
    error: {
      code,
      title: entry.title,
      message: details ? interpolate(entry.message, details) : entry.message,
      hint: entry.hint,
      details,
    },
    ...(extra ?? {}),
  });
}

function interpolate(template: string, details: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(details[k] ?? `{${k}}`));
}
