import { supabase } from '@/lib/supabase';

export type Household = {
  id: string;
  invite_code: string;
  created_at: string;
};

export type MyHousehold = {
  household: Household;
  memberCount: number;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay una sesión activa.');
  return user.id;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getMyHousehold(): Promise<MyHousehold | null> {
  const userId = await getCurrentUserId();

  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', membership.household_id)
    .single();
  if (householdError) throw householdError;

  const { count, error: countError } = await supabase
    .from('household_members')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', membership.household_id);
  if (countError) throw countError;

  return { household, memberCount: count ?? 1 };
}

export async function getOrCreateHouseholdId(): Promise<string> {
  const existing = await getMyHousehold();
  if (existing) return existing.household.id;

  const userId = await getCurrentUserId();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: household, error } = await supabase
      .from('households')
      .insert({ invite_code: generateInviteCode() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') continue; // invite_code collision, retry
      throw error;
    }

    const { error: memberError } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: userId });
    if (memberError) throw memberError;

    return household.id;
  }

  throw new Error('No se pudo crear el hogar. Intenta de nuevo.');
}

export async function joinHousehold(code: string): Promise<void> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Ingresa un código de invitación.');

  const userId = await getCurrentUserId();

  const { data: matches, error: findError } = await supabase.rpc('find_household_by_code', {
    code: trimmed,
  });
  if (findError) throw findError;

  const match = matches?.[0];
  if (!match) throw new Error('Código de invitación inválido.');
  if (Number(match.member_count) >= 2) throw new Error('Ese hogar ya tiene dos miembros.');

  // Leave the current household, if any, before joining the new one.
  const { error: leaveError } = await supabase.from('household_members').delete().eq('user_id', userId);
  if (leaveError) throw leaveError;

  const { error: joinError } = await supabase
    .from('household_members')
    .insert({ household_id: match.id, user_id: userId });
  if (joinError) throw joinError;
}
