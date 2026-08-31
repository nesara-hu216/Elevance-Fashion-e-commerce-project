import React, { useState } from 'react';
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
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { cart, loading, updateQuantity, removeFromCart, saveForLater, moveToCart, validateCartBeforeCheckout, refreshCart } = useCart();

  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'saved'
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const cartItems = cart?.items || [];
  const savedItems = cart?.savedItems || [];

  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.product ? (i.product.discountPrice || i.product.price) : 0;
    return sum + price * i.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + tax + shipping;

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const validation = await validateCartBeforeCheckout();

      if (!validation.success && validation.hasIssues) {
        let msg = '';
        if (validation.unavailableItems?.length > 0) {
          msg += 'Unavailable Items:\n' + validation.unavailableItems.map((u) => `• ${u.name || u.reason}`).join('\n');
        }
        if (validation.warnings?.length > 0) {
          msg += '\n\nPrice Changes:\n' + validation.warnings.map((w) => `• ${w.message}`).join('\n');
        }
        Alert.alert('Cart Consistency Check', msg || 'Please resolve cart issues before proceeding.');
        return;
      }

      navigation.navigate('Checkout');
    } catch (e) {
      Alert.alert('Checkout Error', e.response?.data?.message || 'Failed to complete order checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Shopping Cart" navigation={navigation} />

      {/* Tabs Bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'cart' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'cart' ? theme.colors.primary : theme.colors.subtext }]}>
            Cart Items ({cartItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'saved' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'saved' ? theme.colors.primary : theme.colors.subtext }]}>
            Save for Later ({savedItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'cart' ? (
            cartItems.length === 0 ? (
              <EmptyState
                icon="🛒"
                title="Your cart is empty"
                description="Explore our wide range of products and discover great deals!"
                actionLabel="Start Shopping"
                onAction={() => navigation.navigate('Home')}
              />
            ) : (
              <>
                {/* Cart Items List */}
                {cartItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  const itemPrice = product.discountPrice || product.price || 999;
                  const isOutOfStock = product.stock <= 0;
                  const hasPriceShift = item.priceAtAddition && item.priceAtAddition !== itemPrice;

                  const imgUrl = (Array.isArray(product.images) && product.images[0]) ||
                    product.image ||
                    (typeof product.images === 'string' && product.images) ||
                    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600';

                  return (
                    <View
                      key={item.itemKey}
                      style={[
                        styles.itemCard,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      ]}
                    >
                      <Image
                        source={{ uri: imgUrl }}
                        style={styles.itemImg}
                        resizeMode="cover"
                      />
                      <View style={styles.itemInfo}>
                        <Text numberOfLines={2} style={[styles.itemName, { color: theme.colors.text }]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.itemVariant, { color: theme.colors.subtext }]}>
                          Option: {item.size} / {item.color}
                        </Text>

                        {/* Price Shift Warning Banner */}
                        {hasPriceShift && (
                          <View style={[styles.warningBanner, { backgroundColor: theme.colors.warningLight }]}>
                            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                              ⚠️ Price updated from ₹{item.priceAtAddition} to ₹{itemPrice}
                            </Text>
                          </View>
                        )}

                        {/* Stock Alert */}
                        {isOutOfStock && (
                          <Text style={[styles.outOfStockAlert, { color: theme.colors.danger }]}>
                            Sorry, this product is currently unavailable.
                          </Text>
                        )}

                        <View style={styles.itemBottom}>
                          <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                            ₹{itemPrice * item.quantity}
                          </Text>

                          {/* Quantity Counter */}
                          <View style={[styles.qtyRow, { borderColor: theme.colors.border }]}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateQuantity(item.itemKey, item.quantity - 1)}
                            >
                              <Text style={[styles.qtyText, { color: theme.colors.text }]}>-</Text>
                            </TouchableOpacity>
                            <Text style={[styles.qtyVal, { color: theme.colors.text }]}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateQuantity(item.itemKey, item.quantity + 1)}
                            >
                              <Text style={[styles.qtyText, { color: theme.colors.text }]}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionRow}>
                          <TouchableOpacity onPress={() => saveForLater(item.itemKey)}>
                            <Text style={[styles.actionText, { color: theme.colors.primary }]}>💾 Save for Later</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeFromCart(item.itemKey)}>
                            <Text style={[styles.actionText, { color: theme.colors.danger }]}>🗑️ Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Order Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Order Breakdown</Text>
                  <View style={styles.summaryLine}>
                    <Text style={{ color: theme.colors.subtext }}>Subtotal</Text>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{subtotal}</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={{ color: theme.colors.subtext }}>GST (18%)</Text>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{tax}</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={{ color: theme.colors.subtext }}>Shipping Fee</Text>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </Text>
                  </View>
                  <View style={[styles.summaryLine, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 }]}>
                    <Text style={[styles.grandTitle, { color: theme.colors.text }]}>Grand Total</Text>
                    <Text style={[styles.grandVal, { color: theme.colors.primary }]}>₹{grandTotal}</Text>
                  </View>
                </View>
              </>
            )
          ) : (
            /* Saved for Later List */
            savedItems.length === 0 ? (
              <EmptyState
                icon="💾"
                title="No saved items"
                description="Items saved for later will appear here so you can easily move them back to your cart anytime."
              />
            ) : (
              savedItems.map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <View
                    key={item.itemKey}
                    style={[
                      styles.itemCard,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    ]}
                  >
                    <Image source={{ uri: product.images?.[0] }} style={styles.itemImg} />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]}>{product.name}</Text>
                      <Text style={[styles.itemVariant, { color: theme.colors.subtext }]}>
                        Option: {item.size} / {item.color}
                      </Text>
                      <Text style={[styles.itemPrice, { color: theme.colors.text, marginTop: 4 }]}>
                        ₹{product.discountPrice || product.price}
                      </Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.moveBtn, { backgroundColor: theme.colors.primary }]}
                          onPress={async () => {
                            const res = await moveToCart(item.itemKey);
                            if (!res.success) Alert.alert('Stock Alert', res.message);
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Move to Cart</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      )}

      {/* Sticky Bottom Checkout Footer */}
      {activeTab === 'cart' && cartItems.length > 0 && (
        <View style={[styles.checkoutFooter, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <View>
            <Text style={{ fontSize: 12, color: theme.colors.subtext }}>Total Payable</Text>
            <Text style={[styles.footerTotal, { color: theme.colors.text }]}>₹{grandTotal}</Text>
          </View>
          <TouchableOpacity
            disabled={checkoutLoading}
            style={[styles.checkoutBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleCheckout}
          >
            {checkoutLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.checkoutBtnText}>Checkout Order →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', height: 44, borderBottomWidth: 1 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  itemCard: { flexDirection: 'row', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  itemImg: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  itemVariant: { fontSize: 12, marginTop: 2 },
  warningBanner: { padding: 6, borderRadius: 6, marginVertical: 4 },
  warningText: { fontSize: 11, fontWeight: '700' },
  outOfStockAlert: { fontSize: 11, fontWeight: '700', marginVertical: 4 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 15, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, height: 32 },
  qtyBtn: { width: 30, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 16, fontWeight: '700' },
  qtyVal: { paddingHorizontal: 8, fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  actionText: { fontSize: 12, fontWeight: '700' },
  moveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  summaryCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  grandTitle: { fontSize: 16, fontWeight: '800' },
  grandVal: { fontSize: 18, fontWeight: '800' },
  checkoutFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: 1 },
  footerTotal: { fontSize: 20, fontWeight: '800' },
  checkoutBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  checkoutBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
