import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Alert, FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { listBudgets, type Budget } from '@/lib/budgets';
import { getErrorMessage } from '@/lib/errors';
import { getMonthlySpendByCategory, listCategories, type Category } from '@/lib/expenses';
import { deleteIncome, getMonthlyIncomeTotal, listIncome, type Income } from '@/lib/income';

type CategoryRow = {
  category: Category;
  spent: number;
  limit: number | null;
};

export default function OverviewScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<Income[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      getMonthlyIncomeTotal(),
      listCategories(),
      getMonthlySpendByCategory(),
      listBudgets(),
      listIncome(),
    ])
      .then(([income, categories, spendByCategory, budgets, incomeList]: [
        number,
        Category[],
        Record<string, number>,
        Budget[],
        Income[],
      ]) => {
        setMonthlyIncome(income);
        const limitByCategory = Object.fromEntries(budgets.map((b) => [b.category_id, b.monthly_limit]));
        const rows = categories
          .map((category) => ({
            category,
            spent: spendByCategory[category.id] ?? 0,
            limit: limitByCategory[category.id] ?? null,
          }))
          .filter((row) => row.limit !== null || row.spent > 0);
        setCategoryRows(rows);
        setIncomeEntries(incomeList);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useFocusEffect(load);

  function handleDeleteIncome(id: string) {
    const runDelete = () => {
      deleteIncome(id)
        .then(load)
        .catch((err) => setError(getErrorMessage(err)));
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que quieres eliminar este ingreso?')) runDelete();
      return;
    }

    Alert.alert('Eliminar ingreso', '¿Seguro que quieres eliminar este ingreso?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: runDelete },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen del mes</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.incomeTotal} lightColor="#f5f5f5" darkColor="#1c1c1e">
        <Text style={styles.incomeTotalLabel}>Ingresos del mes</Text>
        <Text style={styles.incomeTotalValue}>${monthlyIncome.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Gasto vs. presupuesto</Text>
      <FlatList
        style={styles.categoryList}
        data={categoryRows}
        keyExtractor={(item) => item.category.id}
        ListEmptyComponent={<Text style={styles.empty}>Sin gastos ni presupuestos este mes.</Text>}
        renderItem={({ item }) => (
          <View style={styles.categoryRow} lightColor="#f5f5f5" darkColor="#1c1c1e">
            <Text>{item.category.name}</Text>
            <Text>
              ${item.spent.toFixed(2)}
              {item.limit !== null ? ` / $${item.limit.toFixed(2)}` : ''}
            </Text>
          </View>
        )}
      />

      <View style={styles.incomeHeader}>
        <Text style={styles.sectionTitle}>Ingresos</Text>
        <Link href="/income-modal" asChild>
          <Pressable>
            <Text style={styles.addLink}>+ Agregar</Text>
          </Pressable>
        </Link>
      </View>
      <FlatList
        style={styles.incomeList}
        data={incomeEntries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes ingresos registrados.</Text>}
        renderItem={({ item }) => (
          <View style={styles.incomeRow} lightColor="#f5f5f5" darkColor="#1c1c1e">
            <Link href={{ pathname: '/income-modal', params: { incomeId: item.id } }} asChild>
              <Pressable style={styles.incomeRowMain}>
                <Text style={styles.amount}>
                  ${item.amount_cop.toFixed(2)}
                  {item.currency !== 'COP' ? ` (${item.original_amount} ${item.currency})` : ''}
                </Text>
                <Text style={styles.meta}>{item.income_date}</Text>
              </Pressable>
            </Link>
            <Pressable onPress={() => handleDeleteIncome(item.id)}>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  incomeTotal: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  incomeTotalLabel: {
    opacity: 0.7,
  },
  incomeTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryList: {
    flexGrow: 0,
    maxHeight: 180,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addLink: {
    color: '#2f95dc',
    fontWeight: '600',
  },
  incomeList: {
    flex: 1,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  incomeRowMain: {
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
  deleteText: {
    color: '#d33',
    fontWeight: '600',
  },
  empty: {
    opacity: 0.6,
    paddingVertical: 8,
  },
  error: {
    color: '#d33',
    marginBottom: 8,
  },
});
