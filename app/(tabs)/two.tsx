import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { signOut } from '@/lib/auth';
import { createCategory, listCategories, type Category } from '@/lib/expenses';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useFocusEffect(load);

  async function handleCreate() {
    setError(null);
    setIsSubmitting(true);
    try {
      await createCategory(newName);
      setNewName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categorías</Text>

      <FlatList
        style={styles.list}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row} lightColor="#f5f5f5" darkColor="#1c1c1e">
            <Text>{item.name}</Text>
            {item.owner_id === null ? <Text style={styles.badge}>Predefinida</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Cargando categorías…</Text>}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nueva categoría"
          value={newName}
          onChangeText={setNewName}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isSubmitting}>
          <Text style={styles.buttonText}>Agregar categoría</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={() => signOut()}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
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
    flexGrow: 0,
    maxHeight: '50%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  badge: {
    fontSize: 12,
    opacity: 0.6,
  },
  empty: {
    opacity: 0.6,
    paddingVertical: 12,
  },
  form: {
    marginTop: 16,
    gap: 8,
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
  logoutButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#d33',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});
