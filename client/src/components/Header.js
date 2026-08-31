import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

export default function Header({ title, showBack = true, onBack, navigation }) {
  const { theme } = useTheme();
  const { cart } = useCart();

  const totalCartItems = cart?.totalItems || 0;

  const handleBackPress = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation) {
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={handleBackPress}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightGroup}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconContainer}
          onPress={() => navigation && navigation.navigate('NotificationSettings')}
        >
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cartIconContainer}
          onPress={() => navigation && navigation.navigate('Cart')}
        >
          <Text style={{ fontSize: 18 }}>🛒</Text>
          {totalCartItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 6,
    marginRight: 8,
  },
  cartIconContainer: {
    position: 'relative',
    padding: 6,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
