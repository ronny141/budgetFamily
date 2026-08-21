import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Alert, FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { deleteExpense, listCategories, listExpenses, type Category, type Expense } from '@/lib/expenses';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([listExpenses(), listCategories()])
      .then(([expenseRows, categoryRows]: [Expense[], Category[]]) => {
        setExpenses(expenseRows);
        setCategoryNames(Object.fromEntries(categoryRows.map((c) => [c.id, c.name])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useFocusEffect(load);

  function handleDelete(id: string) {
    const runDelete = () => {
      deleteExpense(id)
        .then(load)
        .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    };

    // Alert.alert has no effect on react-native-web (it silently no-ops),
    // so web needs its own confirmation path.
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que quieres eliminar este gasto?')) runDelete();
      return;
    }

    Alert.alert('Eliminar gasto', '¿Seguro que quieres eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: runDelete },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        style={styles.list}
        data={expenses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes gastos registrados.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row} lightColor="#f5f5f5" darkColor="#1c1c1e">
            <Link href={{ pathname: '/modal', params: { expenseId: item.id } }} asChild>
              <Pressable style={styles.rowMain}>
                <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.meta}>
                  {categoryNames[item.category_id] ?? '—'} · {item.expense_date}
                </Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              </Pressable>
            </Link>
            <Pressable onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowMain: {
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    opacity: 0.7,
    marginTop: 2,
  },
  description: {
    opacity: 0.6,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteText: {
    color: '#d33',
    fontWeight: '600',
  },
  empty: {
    opacity: 0.6,
    paddingVertical: 12,
  },
  error: {
    color: '#d33',
    marginBottom: 8,
  },
});
