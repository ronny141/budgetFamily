import { supabase } from '@/lib/supabase';

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  created_at: string;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay una sesión activa.');
  return user.id;
}

export async function listBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*');
  if (error) throw error;
  return data;
}

export async function setBudget(categoryId: string, monthlyLimit: number): Promise<Budget> {
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
    throw new Error('Ingresa un límite válido mayor a cero.');
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, category_id: categoryId, monthly_limit: monthlyLimit },
      { onConflict: 'user_id,category_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
