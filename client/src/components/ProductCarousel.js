import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ProductCard from './ProductCard';

export default function ProductCarousel({ title, subtitle, products, onSelectProduct, onViewAll }) {
  const { theme } = useTheme();

  if (!products || products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>{subtitle}</Text>}
        </View>
        {onViewAll && (
          <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={onViewAll}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>VIEW ALL →</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={products.slice(0, 12)}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => onSelectProduct(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  viewAllBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    paddingLeft: 16,
  },
});
