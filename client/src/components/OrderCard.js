import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OrderCard({ order, onPress }) {
  const { theme } = useTheme();

  if (!order) return null;

  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return theme.colors.success;
      case 'Processing':
      case 'Confirmed':
        return theme.colors.primary;
      case 'Shipped':
      case 'Out for Delivery':
        return theme.colors.warning;
      case 'Cancelled':
      case 'Returned':
        return theme.colors.danger;
      default:
        return theme.colors.subtext;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.orderId, { color: theme.colors.text }]}>Order #{order._id?.slice(-8).toUpperCase()}</Text>
          <Text style={[styles.orderDate, { color: theme.colors.subtext }]}>{dateStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
            {order.orderStatus || 'Processing'}
          </Text>
        </View>
      </View>

      <View style={styles.itemsPreview}>
        {order.items &&
          order.items.slice(0, 3).map((item, idx) => (
            <Image
              key={idx}
              source={{ uri: item.image || 'https://via.placeholder.com/60' }}
              style={styles.thumb}
            />
          ))}
        {order.items && order.items.length > 3 && (
          <View style={[styles.moreThumb, { backgroundColor: theme.colors.inputBg }]}>
            <Text style={[styles.moreText, { color: theme.colors.subtext }]}>+{order.items.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.itemCount, { color: theme.colors.subtext }]}>
          {order.items?.length || 0} Item{order.items?.length !== 1 ? 's' : ''}
        </Text>
        <Text style={[styles.totalAmount, { color: theme.colors.text }]}>₹{order.totalAmount || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F5F5F7',
  },
  moreThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    justify.content: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  itemCount: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});
