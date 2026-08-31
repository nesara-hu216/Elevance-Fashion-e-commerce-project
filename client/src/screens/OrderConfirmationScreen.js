import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

export default function OrderConfirmationScreen({ route, navigation }) {
  const { theme } = useTheme();
  const order = route.params?.order || {};

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Order Confirmed" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>Thank You For Your Order!</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
          Your order has been placed and is currently being processed by our warehouse.
        </Text>

        <View style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardHeader, { color: theme.colors.text }]}>Order Details</Text>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.subtext }}>Order Number</Text>
            <Text style={[styles.val, { color: theme.colors.text }]}>{order.orderId || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.subtext }}>Invoice Ref</Text>
            <Text style={[styles.val, { color: theme.colors.text }]}>{order.invoiceNumber || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.subtext }}>Total Amount</Text>
            <Text style={[styles.val, { color: theme.colors.primary, fontWeight: '800' }]}>₹{order.grandTotal || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.subtext }}>Payment Method</Text>
            <Text style={[styles.val, { color: theme.colors.text }]}>{(order.paymentMethod || 'card').toUpperCase()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('OrderDetail', { orderId: order.orderId })}
        >
          <Text style={styles.primaryBtnText}>Track Order Timeline →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  iconContainer: { marginVertical: 16 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  orderCard: { width: '100%', padding: 18, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  cardHeader: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  val: { fontWeight: '600', fontSize: 14 },
  primaryBtn: { width: '100%', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { width: '100%', height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
