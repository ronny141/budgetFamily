import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getErrorMessage } from '@/lib/errors';
import { getMyHousehold, getOrCreateHouseholdId, joinHousehold, type MyHousehold } from '@/lib/family';

export default function HouseholdScreen() {
  const [household, setHousehold] = useState<MyHousehold | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    getMyHousehold()
      .then((existing) => (existing ? existing : getOrCreateHouseholdId().then(getMyHousehold)))
      .then(setHousehold)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(load);

  async function handleJoin() {
    setError(null);
    setIsJoining(true);
    try {
      await joinHousehold(joinCode);
      setJoinCode('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsJoining(false);
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
      <Text style={styles.title}>Hogar</Text>

      <View style={styles.card} lightColor="#f5f5f5" darkColor="#1c1c1e">
        <Text style={styles.cardLabel}>Tu código de invitación</Text>
        <Text style={styles.code}>{household?.household.invite_code}</Text>
        <Text style={styles.memberCount}>
          {household?.memberCount === 2
            ? 'Hogar completo (2 de 2 miembros)'
            : `${household?.memberCount ?? 1} de 2 miembros`}
        </Text>
      </View>

      {household?.memberCount !== 2 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>¿Tienes un código de otra persona?</Text>
          <TextInput
            style={styles.input}
            placeholder="Código de invitación"
            autoCapitalize="characters"
            value={joinCode}
            onChangeText={setJoinCode}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.button, isJoining && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={isJoining}>
            {isJoining ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unirme</Text>}
          </Pressable>
        </View>
      )}
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
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardLabel: {
    opacity: 0.7,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginVertical: 8,
  },
  memberCount: {
    opacity: 0.7,
  },
  form: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#d33',
  },
});
