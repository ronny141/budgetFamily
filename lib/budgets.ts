import { supabase } from '@/lib/supabase';
import { getOrCreateHouseholdId } from '@/lib/family';

export type Budget = {
  id: string;
  household_id: string;
  category_id: string;
  monthly_limit: number;
  created_at: string;
};

export async function listBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*');
  if (error) throw error;
  return data;
}

export async function setBudget(categoryId: string, monthlyLimit: number): Promise<Budget> {
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
    throw new Error('Ingresa un límite válido mayor a cero.');
  }

  const householdId = await getOrCreateHouseholdId();
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { household_id: householdId, category_id: categoryId, monthly_limit: monthlyLimit },
      { onConflict: 'household_id,category_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
