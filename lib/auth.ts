import { supabase } from '@/lib/supabase';

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, email, display_name: displayName });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Maps Supabase auth errors to the user-facing messages required by
 * specs/user-auth/spec.md, without leaking whether an email exists on login.
 */
export function describeAuthError(error: unknown, context: 'signUp' | 'signIn'): string {
  const code = (error as { code?: string } | undefined)?.code;
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();

  if (context === 'signIn') {
    if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos.';
    }
    // Anything else (network failure, misconfiguration, rate limiting, etc.)
    // is a real problem, not an intentionally-generic security message -
    // show it as-is so it's actually debuggable.
    return message || 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  if (code === 'user_already_exists' || lower.includes('already registered') || lower.includes('already exists')) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (code === 'weak_password' || lower.includes('password should be at least') || lower.includes('weak')) {
    return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
  }
  if (code === 'validation_failed' || (lower.includes('email') && lower.includes('invalid'))) {
    return 'Ingresa un correo electrónico válido.';
  }

  return message || 'Ocurrió un error inesperado. Intenta de nuevo.';
}
