import { supabase } from '@/lib/supabase';

export type Category = {
  id: string;
  owner_id: string | null;
  name: string;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  expense_date: string;
  description: string | null;
  created_at: string;
};

export type ExpenseInput = {
  amount: number;
  categoryId: string;
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

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Ingresa un nombre para la categoría.');

  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('categories')
    .insert({ owner_id: ownerId, name: trimmed })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getExpense(id: string): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return data;
}

function validateExpenseInput({ amount, categoryId }: ExpenseInput) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Ingresa un monto válido mayor a cero.');
  }
  if (!categoryId) {
    throw new Error('Elige una categoría.');
  }
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  validateExpenseInput(input);
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: input.categoryId,
      amount: input.amount,
      expense_date: input.date,
      description: input.description?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  validateExpenseInput(input);

  const { data, error } = await supabase
    .from('expenses')
    .update({
      category_id: input.categoryId,
      amount: input.amount,
      expense_date: input.date,
      description: input.description?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
