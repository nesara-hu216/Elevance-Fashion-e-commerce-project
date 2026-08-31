import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import api from '../services/api';

export default function CheckoutScreen({ navigation }) {
  const { theme } = useTheme();
  const { cart, validateCartBeforeCheckout, refreshCart } = useCart();

  const [fullName, setFullName] = useState('Alex Johnson');
  const [phone, setPhone] = useState('+91 9876543210');
  const [addressLine1, setAddressLine1] = useState('42 Tech Park Avenue');
  const [addressLine2, setAddressLine2] = useState('Suite 400');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [zipCode, setZipCode] = useState('560001');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.product ? (i.product.discountPrice || i.product.price) : 0;
    return sum + price * i.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !addressLine1 || !city || !zipCode) {
      Alert.alert('Validation Error', 'Please complete all address fields.');
      return;
    }

    try {
      setLoading(true);
      const validation = await validateCartBeforeCheckout();

      if (!validation.success && validation.hasIssues) {
        let msg = '';
        if (validation.unavailableItems?.length > 0) {
          msg += 'Unavailable Items:\n' + validation.unavailableItems.map((u) => `• ${u.name || u.reason}`).join('\n');
        }
        if (validation.warnings?.length > 0) {
          msg += '\n\nPrice Changes:\n' + validation.warnings.map((w) => `• ${w.message}`).join('\n');
        }
        Alert.alert('Cart Verification Alert', msg || 'Please resolve cart conflicts before checkout.');
        return;
      }

      const orderPayload = {
        deliveryAddress: {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          zipCode,
          country: 'India',
        },
        paymentMethod,
        items: cartItems,
      };

      const res = await api.post('/orders', orderPayload);
      if (res.data && res.data.order) {
        await refreshCart();
        navigation.navigate('OrderConfirmation', { order: res.data.order });
      }
    } catch (e) {
      Alert.alert('Checkout Failed', e.response?.data?.message || 'Unable to complete checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Checkout" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📍 Delivery Shipping Address</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Address Line 1</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Address Line 2 (Optional)</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={addressLine2}
              onChangeText={setAddressLine2}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>City</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Pincode</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={zipCode}
                onChangeText={setZipCode}
              />
            </View>
          </View>
        </View>

        {/* Payment Options Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>💳 Payment Method</Text>

          {[
            { id: 'card', label: 'Credit / Debit Card (Demo Mock Payment)' },
            { id: 'upi', label: 'UPI / NetBanking Instant Pay' },
            { id: 'cod', label: 'Cash on Delivery (COD)' },
          ].map((option) => {
            const isSelected = paymentMethod === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSelected ? theme.colors.primaryLight || theme.colors.card : theme.colors.card,
                  },
                ]}
                onPress={() => setPaymentMethod(option.id)}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>{isSelected ? '🔘' : '⚪'}</Text>
                <Text style={[styles.paymentLabel, { color: theme.colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🧾 Order Pricing Breakdown</Text>
          <View style={styles.summaryLine}>
            <Text style={{ color: theme.colors.subtext }}>Cart Items ({cartItems.length})</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={{ color: theme.colors.subtext }}>GST Tax (18%)</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>₹{tax}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={{ color: theme.colors.subtext }}>Shipping Fee</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</Text>
          </View>
          <View style={[styles.summaryLine, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 4 }]}>
            <Text style={[styles.grandTitle, { color: theme.colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandVal, { color: theme.colors.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          disabled={loading}
          style={[styles.placeOrderBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handlePlaceOrder}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderText}>Confirm & Place Order (₹{grandTotal})</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  row: { flexDirection: 'row' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  grandTitle: { fontSize: 15, fontWeight: '800' },
  grandVal: { fontSize: 18, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  placeOrderBtn: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  placeOrderText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
