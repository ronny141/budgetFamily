/**
 * Supabase/Postgrest errors are plain objects, not JS Error instances, so
 * `err instanceof Error` is always false for them and `String(err)` renders
 * as "[object Object]" instead of the actual message.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
