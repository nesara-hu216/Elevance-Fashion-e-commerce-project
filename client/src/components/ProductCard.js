import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600';

export default function ProductCard({ product, onPress }) {
  const { theme } = useTheme();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const initialUri =
    product && product.images && product.images[0] ? product.images[0] : FALLBACK_IMAGE;
  const [imgUri, setImgUri] = useState(initialUri);

  useEffect(() => {
    if (product && product.images && product.images[0]) {
      setImgUri(product.images[0]);
    }
  }, [product]);

  if (!product) return null;

  const isLiked = isInWishlist(product._id || product.id);
  const isOutOfStock = product.stock <= 0;
  const price = product.discountPrice || product.price;
  const originalPrice = product.originalPrice || (product.discountPrice ? product.price : null);
  const discountPercent = product.discountPercentage || (originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  const toggleWishlist = async (e) => {
    e?.stopPropagation && e.stopPropagation();
    const pId = product._id || product.id;
    if (isLiked) {
      await removeFromWishlist(pId);
    } else {
      await addToWishlist(pId);
    }
  };

  const handleQuickAdd = (e) => {
    e?.stopPropagation && e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product._id || product.id);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          ...theme.shadows.small,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imgUri }}
          onError={() => setImgUri(FALLBACK_IMAGE)}
          style={styles.image}
          resizeMode="cover"
        />

        {discountPercent > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.wishlistBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
          onPress={toggleWishlist}
        >
          <Text style={{ fontSize: 14 }}>{isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        {product.brand ? (
          <Text numberOfLines={1} style={[styles.brand, { color: theme.colors.subtext }]}>
            {product.brand}
          </Text>
        ) : null}

        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.colors.text }]}>₹{price}</Text>
          {originalPrice && originalPrice > price ? (
            <Text style={[styles.oldPrice, { color: theme.colors.subtext }]}>₹{originalPrice}</Text>
          ) : null}
          {discountPercent > 0 && (
            <Text style={[styles.offText, { color: theme.colors.success }]}>{discountPercent}% OFF</Text>
          )}
        </View>

        {/* Delivery & Rating Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.freeDeliveryPill, { backgroundColor: theme.colors.successLight }]}>
            <Text style={[styles.freeDeliveryText, { color: theme.colors.success }]}>🚚 Free Delivery</Text>
          </View>

          <View style={[styles.ratingPill, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.ratingText}>{product.rating || 4.5} ★</Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={isOutOfStock}
          style={[
            styles.addBtn,
            {
              backgroundColor: isOutOfStock ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handleQuickAdd}
        >
          <Text style={styles.addBtnText}>{isOutOfStock ? 'Out of Stock' : '+ Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F7F7F7',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    padding: 10,
  },
  brand: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  offText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeDeliveryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freeDeliveryText: {
    fontSize: 9,
    fontWeight: '700',
  },
  ratingPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
