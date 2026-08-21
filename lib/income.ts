import { supabase } from '@/lib/supabase';
import { currentMonthRange } from '@/lib/expenses';

export type Income = {
  id: string;
  user_id: string;
  currency: string;
  original_amount: number;
  exchange_rate: number;
  amount_cop: number;
  income_date: string;
  description: string | null;
  created_at: string;
};

export type IncomeInput = {
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  date: string;
  description?: string;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay una sesión activa.');
  return user.id;
}

function validateIncomeInput({ currency, originalAmount, exchangeRate }: IncomeInput) {
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
    throw new Error('Ingresa un monto válido mayor a cero.');
  }
  const isCop = currency.trim().toUpperCase() === 'COP';
  if (!isCop && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) {
    throw new Error('Ingresa una tasa de cambio válida mayor a cero.');
  }
}

function toRow(input: IncomeInput) {
  const isCop = input.currency.trim().toUpperCase() === 'COP';
  return {
    currency: input.currency.trim().toUpperCase(),
    original_amount: input.originalAmount,
    exchange_rate: isCop ? 1 : input.exchangeRate,
    income_date: input.date,
    description: input.description?.trim() || null,
  };
}

export async function getIncome(id: string): Promise<Income> {
  const { data, error } = await supabase.from('income').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listIncome(): Promise<Income[]> {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .order('income_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createIncome(input: IncomeInput): Promise<Income> {
  validateIncomeInput(input);
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income')
    .insert({ user_id: userId, ...toRow(input) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncome(id: string, input: IncomeInput): Promise<Income> {
  validateIncomeInput(input);

  const { data, error } = await supabase
    .from('income')
    .update(toRow(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw error;
}

export async function getMonthlyIncomeTotal(): Promise<number> {
  const { start, end } = currentMonthRange();
  const { data, error } = await supabase
    .from('income')
    .select('amount_cop')
    .gte('income_date', start)
    .lte('income_date', end);
  if (error) throw error;
  return data.reduce((sum, row) => sum + row.amount_cop, 0);
}
