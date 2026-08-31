import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();

  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const statuses = ['All', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const statusParam = selectedStatus !== 'All' ? `&status=${selectedStatus}` : '';
      const res = await api.get(`/orders?page=${page}&limit=10${statusParam}`);

      if (res.data && res.data.orders) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pages || 1);
      }
    } catch (e) {
      console.error('[Orders] Error fetching orders', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return theme.colors.success;
      case 'shipped': return theme.colors.secondary;
      case 'cancelled': return theme.colors.danger;
      default: return theme.colors.warning;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="My Orders" navigation={navigation} />

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statuses.map((st) => {
            const isSelected = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFF' : theme.colors.text },
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders found"
          description="Your previous orders and transaction history will appear right here."
          actionLabel="Shop Catalog"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id || item.orderId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.orderCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderId, { color: theme.colors.text }]}>#{item.orderId}</Text>
                  <Text style={[styles.date, { color: theme.colors.subtext }]}>
                    Placed on {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '22' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                    {item.orderStatus.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.orderSummary}>
                <Text style={{ color: theme.colors.subtext, fontSize: 13 }}>
                  {item.items.length} item(s) • Payment: {item.paymentMethod.toUpperCase()} ({item.paymentStatus})
                </Text>
                <Text style={[styles.grandTotal, { color: theme.colors.text }]}>₹{item.grandTotal}</Text>
              </View>

              <View style={styles.arrowRow}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>
                  View Order Details & Invoice →
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={() =>
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={page <= 1}
                  style={[styles.pageBtn, { borderColor: theme.colors.border }]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={{ color: theme.colors.text }}>Prev</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.colors.text, marginHorizontal: 12 }}>
                  Page {page} of {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  style={[styles.pageBtn, { borderColor: theme.colors.border }]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Text style={{ color: theme.colors.text }}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: { paddingHorizontal: 16, marginVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '700' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  orderCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  orderSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotal: { fontSize: 16, fontWeight: '800' },
  arrowRow: { marginTop: 10, alignItems: 'flex-end' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
});
