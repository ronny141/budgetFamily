import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getErrorMessage } from '@/lib/errors';
import {
  createExpense,
  getExpense,
  listCategories,
  updateExpense,
  type Category,
} from '@/lib/expenses';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseFormModal() {
  const { expenseId } = useLocalSearchParams<{ expenseId?: string }>();
  const isEditing = Boolean(expenseId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!expenseId) return;
    getExpense(expenseId)
      .then((expense) => {
        setCategoryId(expense.category_id);
        setAmount(String(expense.amount));
        setDate(expense.expense_date);
        setDescription(expense.description ?? '');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [expenseId]);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        amount: Number(amount),
        categoryId,
        date,
        description,
      };
      if (isEditing && expenseId) {
        await updateExpense(expenseId, input);
      } else {
        await createExpense(input);
      }
      router.back();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.chipRow}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[styles.chip, categoryId === category.id && styles.chipSelected]}
            onPress={() => setCategoryId(category.id)}>
            <Text style={categoryId === category.id ? styles.chipTextSelected : undefined}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
      <TextInput
        style={styles.input}
        placeholder="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  chipTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    color: '#d33',
  },
});
