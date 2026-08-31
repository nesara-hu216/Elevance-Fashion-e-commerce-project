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
import Header from '../components/Header';
import api from '../services/api';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { theme } = useTheme();

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
      const res = await api.get(`/orders/${orderId}`);
      if (res.data && res.data.order) {
        setOrder(res.data.order);
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
      
      // Printable HTML fallback for web and mobile
      const htmlContent = `
        <html>
          <body style="font-family: Helvetica, Arial, sans-serif; padding: 30px;">
            <h1 style="color: #4F46E5;">ELEVANCE FASHION TAX INVOICE</h1>
            <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <hr />
            <h3>Customer Delivery Info</h3>
            <p>${order.deliveryAddress?.fullName || 'Customer'}<br/>${order.deliveryAddress?.addressLine1 || ''}, ${order.deliveryAddress?.city || ''}<br/>Phone: ${order.deliveryAddress?.phone || ''}</p>
            <hr />
            <h3>Items</h3>
            <table width="100%" border="1" cellspacing="0" cellpadding="8">
              <tr style="background: #F1F5F9;">
                <th>Item</th><th>Variant</th><th>Qty</th><th>Price</th>
              </tr>
              ${order.items
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
          window.alert('Please allow popups to download/print your invoice.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Failed to generate PDF invoice.');
      } else {
        Alert.alert('Invoice Error', 'Failed to generate PDF invoice.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${order.orderId}/reorder`);
      if (res.data && res.data.success) {
        const count = res.data.addedItems ? res.data.addedItems.length : 1;
        const msg = `Reorder successful! Added ${count} item(s) to your cart.`;

        if (Platform.OS === 'web') {
          window.alert(msg);
          navigation.navigate('Cart');
        } else {
          Alert.alert('Reorder Status', msg, [
            { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
          ]);
        }
      }
    } catch (e) {
      const err = e.response?.data?.message || 'Failed to reorder items.';
      if (Platform.OS === 'web') {
        window.alert(err);
      } else {
        Alert.alert('Reorder Error', err);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const executeCancel = async () => {
      try {
        setActionLoading(true);
        const res = await api.post(`/orders/${order.orderId}/cancel`);
        if (res.data && res.data.order) {
          setOrder(res.data.order);
          if (Platform.OS === 'web') {
            window.alert('Your order has been cancelled successfully.');
          } else {
            Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
          }
        }
      } catch (e) {
        const msg = e.response?.data?.message || 'Cannot cancel order.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Cancellation Error', msg);
        }
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this order?')) {
        await executeCancel();
      }
    } else {
      Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: executeCancel,
        },
      ]);
    }
  };

  const handleReturnRequest = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${order.orderId}/return`, {
        reason: 'Item fit issues or change of mind',
      });
      if (res.data && res.data.success) {
        if (Platform.OS === 'web') {
          window.alert('Your return request has been recorded successfully.');
        } else {
          Alert.alert('Return Requested', 'Your return request has been recorded successfully.');
        }
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Cannot place return request.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Return Request Error', msg);
      }
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
            Payment Method: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
          </Text>
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Items ({order.items.length})</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: item.image || 'https://via.placeholder.com/100' }} style={styles.itemImg} />
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

          {order.orderStatus === 'delivered' && (
            <TouchableOpacity
              disabled={actionLoading}
              style={[styles.actionBtn, { backgroundColor: theme.colors.warning }]}
              onPress={handleReturnRequest}
            >
              <Text style={styles.btnText}>↩️ Request Return</Text>
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
});
