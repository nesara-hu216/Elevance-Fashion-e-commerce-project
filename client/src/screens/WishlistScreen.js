import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function WishlistScreen({ navigation }) {
  const { theme } = useTheme();
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="My Wishlist" navigation={navigation} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const validWishlistItems = wishlist
    .map((item) => {
      if (!item) return null;
      if (item.product && typeof item.product === 'object' && (item.product.name || item.product._id)) {
        return item.product;
      }
      if (item.name || item.price || item._id || item.id) {
        return item;
      }
      return null;
    })
    .filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={`My Wishlist (${validWishlistItems.length})`} navigation={navigation} />

      {validWishlistItems.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Your wishlist is empty"
          description="Save items you love to your wishlist and get instant price drop & back-in-stock alerts!"
          actionLabel="Explore Items"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={validWishlistItems}
          keyExtractor={(item, idx) => item._id || item.id || `wish_${idx}`}
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
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 8 },
});
