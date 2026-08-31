import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function RecentlyViewedScreen({ navigation }) {
  const { theme } = useTheme();
  const { recentlyViewed } = useRecentlyViewed();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={`Recently Viewed (${recentlyViewed.length}/20)`} showBack navigation={navigation} />

      {recentlyViewed.length === 0 ? (
        <EmptyState
          icon="👀"
          title="No recently viewed products"
          description="Browse our catalog to view items and track your recently viewed history."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={recentlyViewed}
          keyExtractor={(item) => item._id || item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 8 },
});
