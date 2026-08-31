import React from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

// Global crypto polyfill for web environment compatibility
if (typeof window !== 'undefined' && (typeof window.crypto === 'undefined' || typeof window.crypto.randomUUID === 'undefined')) {
  window.crypto = window.crypto || {};
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
  }
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = () =>
      '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (c ^ ((Math.random() * 16) >> (c / 4))).toString(16)
      );
  }
}

// Web CSS root height fix
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    html, body, #root, #root > div {
      height: 100% !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  document.head.appendChild(styleEl);
}

function AppContent() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <RecentlyViewedProvider user={user}>
      <CartProvider user={user}>
        <WishlistProvider user={user}>
          <NotificationProvider user={user}>
            <SafeAreaProvider style={{ flex: 1 }}>
              <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
              <AppNavigator />
            </SafeAreaProvider>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </RecentlyViewedProvider>
  );
}

export default function App() {
  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}

registerRootComponent(App);
