import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

export default function ProductDetailScreen({ route, navigation }) {
  const productId = route?.params?.productId;
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { trackProductView } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    if (!productId || productId === 'undefined') {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);

      const prodRes = await api.get(`/products/${productId}`);
      if (prodRes.data && prodRes.data.product) {
        const p = prodRes.data.product;
        setProduct(p);
        trackProductView(p);

        if (p.variants && p.variants.length > 0) {
          setSelectedVariant(p.variants[0]);
        }

        try {
          const recRes = await api.get(`/recommendations?currentProductId=${p._id || p.id || productId}`);
          if (recRes.data && recRes.data.recommendations) {
            setRecommendations(recRes.data.recommendations);
          }
        } catch (rErr) {
          // Recommendations optional
        }
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error('[ProductDetail] Error fetching product details', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Product Details" showBack navigation={navigation} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (notFound || !product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Product Details" showBack navigation={navigation} />
        <EmptyState
          icon="🔍"
          title="Product Not Found"
          description="The requested fashion item could not be found or is no longer available in the catalog."
          actionLabel="Explore Catalog"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const isLiked = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const price = selectedVariant ? selectedVariant.price : (product.discountPrice || product.price);

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      Alert.alert('Out of Stock', 'Sorry, this product is currently unavailable.');
      return;
    }

    const variantData = selectedVariant
      ? { variantId: selectedVariant.variantId, size: selectedVariant.size, color: selectedVariant.color }
      : { variantId: 'default', size: 'Standard', color: 'Standard' };

    const result = await addToCart(product, variantData, quantity);
    if (result.success) {
      Alert.alert('Added to Cart', `"${product.name}" added to your cart.`);
    } else {
      Alert.alert('Stock Alert', result.message);
    }
  };

  const toggleWishlist = async () => {
    if (isLiked) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={product.name} showBack navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full View Product Hero Image Container */}
        <View style={styles.imageWrapContainer}>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
            {product.discountPercentage ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.badgeText}>{product.discountPercentage}% OFF</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          {product.brand ? (
            <Text style={[styles.brand, { color: theme.colors.subtext }]}>{product.brand}</Text>
          ) : null}
          <Text style={[styles.category, { color: theme.colors.primary }]}>{product.category}</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <View style={[styles.ratingPill, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.ratingText}>⭐ {product.rating || 4.5}</Text>
            </View>
            <Text style={[styles.reviewText, { color: theme.colors.subtext }]}>
              ({product.numReviews} customer reviews) • {product.salesCount} sold
            </Text>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.text }]}>₹{price}</Text>
            {product.originalPrice && product.originalPrice > price ? (
              <Text style={[styles.oldPrice, { color: theme.colors.subtext }]}>₹{product.originalPrice}</Text>
            ) : null}
            <View
              style={[
                styles.stockStatus,
                { backgroundColor: isOutOfStock ? theme.colors.dangerLight : theme.colors.successLight },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isOutOfStock ? theme.colors.danger : theme.colors.success,
                }}
              >
                {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock})`}
              </Text>
            </View>
          </View>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Select Variant / Option:</Text>
              <View style={styles.variantList}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.variantId === v.variantId;
                  return (
                    <TouchableOpacity
                      key={v.variantId}
                      style={[
                        styles.variantChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedVariant(v)}
                    >
                      <Text style={{ color: isSelected ? '#FFF' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                        {v.size} / {v.color}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Description</Text>
            <Text style={[styles.descText, { color: theme.colors.subtext }]}>{product.description}</Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.qtySection}>
            <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Quantity:</Text>
            <View style={[styles.qtyRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyVal, { color: theme.colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
              >
                <Text style={[styles.qtyBtnText, { color: theme.colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* You May Also Like Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendSection}>
            <Text style={[styles.recommendTitle, { color: theme.colors.text }]}>✨ You May Also Like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.map((rec) => (
                <ProductCard
                  key={rec._id || rec.id}
                  product={rec}
                  onPress={() => navigation.push('ProductDetail', { productId: rec._id || rec.id })}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.wishlistCircle, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          onPress={toggleWishlist}
        >
          <Text style={{ fontSize: 20 }}>{isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isOutOfStock}
          style={[
            styles.addCartBtn,
            { backgroundColor: isOutOfStock ? theme.colors.border : theme.colors.primary },
          ]}
          onPress={handleAddToCart}
        >
          <Text style={styles.addCartBtnText}>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  imageWrapContainer: {
    width: '100%',
    backgroundColor: '#FAF7F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  imageWrap: {
    height: 420,
    width: '100%',
    maxWidth: 550,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  content: { padding: 16, maxWidth: 800, alignSelf: 'center', width: '100%' },
  brand: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  category: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  ratingText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  reviewText: { fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  price: { fontSize: 24, fontWeight: '800', marginRight: 10 },
  oldPrice: { fontSize: 16, textDecorationLine: 'line-through', marginRight: 12 },
  stockStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  variantSection: { marginBottom: 16 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  variantList: { flexDirection: 'row', flexWrap: 'wrap' },
  variantChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  descSection: { marginBottom: 16 },
  descText: { fontSize: 14, lineHeight: 22 },
  qtySection: { marginBottom: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, width: 120, height: 40 },
  qtyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyVal: { fontSize: 15, fontWeight: '700' },
  recommendSection: { paddingHorizontal: 16, marginTop: 12, maxWidth: 900, alignSelf: 'center', width: '100%' },
  recommendTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: 1 },
  wishlistCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addCartBtn: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  addCartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
