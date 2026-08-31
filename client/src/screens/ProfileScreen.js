import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Header from '../components/Header';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, logout, login } = useAuth();
  const { wishlist } = useWishlist();

  const handleDemoLogin = async () => {
    const res = await login('alex@example.com', 'password123');
    if (res.success) {
      Alert.alert('Logged In', 'Welcome back Alex Johnson!');
    } else {
      Alert.alert('Login Alert', res.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="My Account" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{user ? user.name.charAt(0).toUpperCase() : 'G'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user ? user.name : 'Guest User'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.subtext }]}>
              {user ? user.email : 'Log in to sync cart, wishlist & recommendations across devices.'}
            </Text>
          </View>
        </View>

        {!user && (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: theme.colors.primary, marginBottom: 8 }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginBtnText}>🔑 Sign In to Your Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, borderWidth: 1, marginBottom: 8 }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.loginBtnText, { color: theme.colors.primary }]}>📝 Create New Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: theme.colors.border }]}
              onPress={handleDemoLogin}
            >
              <Text style={[styles.loginBtnText, { color: theme.colors.text }]}>⚡ Quick Demo Login (Alex Johnson)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Links */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={[styles.menuText, { color: theme.colors.text }]}>📦 Order History & Invoices</Text>
            <Text style={{ color: theme.colors.subtext }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              ❤️ My Wishlist ({wishlist.length})
            </Text>
            <Text style={{ color: theme.colors.subtext }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('RecentlyViewed')}
          >
            <Text style={[styles.menuText, { color: theme.colors.text }]}>👀 Recently Viewed Products</Text>
            <Text style={{ color: theme.colors.subtext }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Appearance')}
          >
            <Text style={[styles.menuText, { color: theme.colors.text }]}>🎨 Appearance & Theme (Dark/Light)</Text>
            <Text style={{ color: theme.colors.subtext }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <Text style={[styles.menuText, { color: theme.colors.text }]}>🔔 Push Notification Settings</Text>
            <Text style={{ color: theme.colors.subtext }}>→</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: theme.colors.danger }]}
            onPress={logout}
          >
            <Text style={[styles.logoutText, { color: theme.colors.danger }]}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 18, fontWeight: '800' },
  userEmail: { fontSize: 12, marginTop: 2 },
  loginBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  loginBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  sectionCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuText: { fontSize: 15, fontWeight: '600' },
  logoutBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
