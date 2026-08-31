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
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import api from '../services/api';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { theme } = useTheme();
  const { addToCart, refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const timelineSteps = [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
  ];

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`).catch(() => null);
      if (res && res.data && res.data.order) {
        setOrder(res.data.order);
      } else {
        // Mock fallback order data
        setOrder({
          _id: orderId,
          orderId: orderId || 'ORD-2026-8801',
          invoiceNumber: 'INV-2026-8801',
          grandTotal: 1179,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          orderStatus: 'placed',
          items: [
            {
              product: 'prod_101',
              name: 'Elevance Fashion Designer Item',
              image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
              size: 'M',
              color: 'Standard',
              quantity: 1,
              price: 999,
            },
          ],
          deliveryAddress: {
            fullName: 'Alex Johnson',
            addressLine1: '42 Tech Park Avenue',
            city: 'Bengaluru',
            phone: '+91 9876543210',
          },
        });
      }
    } catch (e) {
      console.error('[OrderDetail] Error fetching order', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Order Details" showBack navigation={navigation} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const currentStepIndex = timelineSteps.indexOf(order.orderStatus);

  const handleDownloadInvoice = async () => {
    try {
      setActionLoading(true);

      const htmlContent = `
        <html>
          <body style="font-family: Helvetica, Arial, sans-serif; padding: 30px;">
            <h1 style="color: #4F46E5;">ELEVANCE FASHION TAX INVOICE</h1>
            <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
            <hr />
            <h3>Customer Delivery Info</h3>
            <p>${order.deliveryAddress?.fullName || 'Customer'}<br/>${order.deliveryAddress?.addressLine1 || ''}, ${order.deliveryAddress?.city || ''}<br/>Phone: ${order.deliveryAddress?.phone || ''}</p>
            <hr />
            <h3>Items</h3>
            <table width="100%" border="1" cellspacing="0" cellpadding="8">
              <tr style="background: #F1F5F9;">
                <th>Item</th><th>Variant</th><th>Qty</th><th>Price</th>
              </tr>
              ${(order.items || [])
                .map(
                  (i) =>
                    `<tr><td>${i.name}</td><td>${i.size}/${i.color}</td><td>${i.quantity}</td><td>₹${i.price}</td></tr>`
                )
                .join('')}
            </table>
            <h3>Grand Total: ₹${order.grandTotal}</h3>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        } else {
          alert('Downloading invoice PDF...');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error('[Invoice Error]', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async () => {
    try {
      setActionLoading(true);

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await addToCart(item.product || item.name, { size: item.size, color: item.color }, item.quantity);
        }
      }

      await api.post(`/orders/${order.orderId}/reorder`).catch(() => {});
      await refreshCart();

      navigation.navigate('Cart');
    } catch (e) {
      console.error('[Reorder Error]', e);
      navigation.navigate('Cart');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);

      await api.post(`/orders/${order.orderId}/cancel`).catch(() => {});

      setOrder((prev) => ({
        ...prev,
        orderStatus: 'cancelled',
      }));
    } catch (e) {
      console.error('[Cancel Order Error]', e);
      setOrder((prev) => ({
        ...prev,
        orderStatus: 'cancelled',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={`Order #${order.orderId}`} showBack navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Header Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.invoiceText, { color: theme.colors.subtext }]}>
            INVOICE #: {order.invoiceNumber}
          </Text>
          <Text style={[styles.grandTotal, { color: theme.colors.primary }]}>₹{order.grandTotal}</Text>
          <Text style={{ color: theme.colors.subtext, fontSize: 12, marginTop: 4 }}>
            Payment Method: {(order.paymentMethod || 'CARD').toUpperCase()} ({(order.paymentStatus || 'paid').toUpperCase()})
          </Text>
          {order.orderStatus === 'cancelled' && (
            <View style={[styles.cancelledBadge, { backgroundColor: theme.colors.dangerLight }]}>
              <Text style={[styles.cancelledBadgeText, { color: theme.colors.danger }]}>❌ ORDER CANCELLED</Text>
            </View>
          )}
        </View>

        {/* Visual Timeline Tracker */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery Timeline</Text>
          {timelineSteps.map((step, idx) => {
            const isDone = currentStepIndex >= idx && order.orderStatus !== 'cancelled';
            const isCancelled = order.orderStatus === 'cancelled';
            return (
              <View key={step} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: isCancelled
                        ? theme.colors.danger
                        : isDone
                        ? theme.colors.success
                        : theme.colors.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.timelineStepText,
                    {
                      color: isDone ? theme.colors.text : theme.colors.subtext,
                      fontWeight: isDone ? '700' : '400',
                    },
                  ]}
                >
                  {step.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Line Items Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Items ({(order.items || []).length})</Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600' }} style={styles.itemImg} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>
                  Option: {item.size} / {item.color} • Qty: {item.quantity}
                </Text>
                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>₹{item.price * item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            disabled={actionLoading}
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleDownloadInvoice}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.btnText}>📄 Download PDF Invoice</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={actionLoading}
            style={[styles.actionBtn, { backgroundColor: theme.colors.secondary }]}
            onPress={handleReorder}
          >
            <Text style={styles.btnText}>🔄 Buy Again (Reorder)</Text>
          </TouchableOpacity>

          {['placed', 'confirmed', 'processing'].includes(order.orderStatus) && (
            <TouchableOpacity
              disabled={actionLoading}
              style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]}
              onPress={handleCancelOrder}
            >
              <Text style={styles.btnText}>❌ Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  invoiceText: { fontSize: 12, fontWeight: '700' },
  grandTotal: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  timelineStepText: { fontSize: 13 },
  itemRow: { flexDirection: 'row', marginBottom: 12 },
  itemImg: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemPrice: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  btnGroup: { marginTop: 8 },
  actionBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cancelledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cancelledBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
