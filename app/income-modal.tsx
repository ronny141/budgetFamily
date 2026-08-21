import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getErrorMessage } from '@/lib/errors';
import { createIncome, getIncome, updateIncome } from '@/lib/income';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function IncomeFormModal() {
  const { incomeId } = useLocalSearchParams<{ incomeId?: string }>();
  const isEditing = Boolean(incomeId);

  const [currency, setCurrency] = useState('COP');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const isCop = currency.trim().toUpperCase() === 'COP';

  useEffect(() => {
    if (!incomeId) return;
    getIncome(incomeId)
      .then((income) => {
        setCurrency(income.currency);
        setAmount(String(income.original_amount));
        setExchangeRate(String(income.exchange_rate));
        setDate(income.income_date);
        setDescription(income.description ?? '');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [incomeId]);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        currency,
        originalAmount: Number(amount),
        exchangeRate: isCop ? 1 : Number(exchangeRate),
        date,
        description,
      };
      if (isEditing && incomeId) {
        await updateIncome(incomeId, input);
      } else {
        await createIncome(input);
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
      <Text style={styles.title}>{isEditing ? 'Editar ingreso' : 'Nuevo ingreso'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Monto"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Moneda (ej. COP, USD)"
        autoCapitalize="characters"
        value={currency}
        onChangeText={setCurrency}
      />
      {!isCop && (
        <TextInput
          style={styles.input}
          placeholder={`Tasa de cambio (1 ${currency.trim().toUpperCase() || '???'} = ? COP)`}
          keyboardType="decimal-pad"
          value={exchangeRate}
          onChangeText={setExchangeRate}
        />
      )}

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
