import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const RecentlyViewedContext = createContext();

export const RecentlyViewedProvider = ({ children, user }) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      syncAndLoadServerHistory();
    } else {
      loadLocalHistory();
    }
  }, [user]);

  const loadLocalHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('@recently_viewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      } else {
        setRecentlyViewed([]);
      }
    } catch (e) {
      console.error('[RecentlyViewed] Error loading local history', e);
    }
  };

  const syncAndLoadServerHistory = async () => {
    try {
      setLoading(true);
      const storedLocal = await AsyncStorage.getItem('@recently_viewed');
      const localItems = storedLocal ? JSON.parse(storedLocal) : [];

      // Perform login merge API call
      const res = await api.post('/users/me/recently-viewed/sync', { localItems });
      if (res.data && res.data.recentlyViewed) {
        setRecentlyViewed(res.data.recentlyViewed);
        await AsyncStorage.setItem('@recently_viewed', JSON.stringify(res.data.recentlyViewed));
      }
    } catch (e) {
      console.error('[RecentlyViewed] Error syncing server history', e);
      // Fallback to fetch server directly
      try {
        const res = await api.get('/users/me/recently-viewed');
        if (res.data && res.data.recentlyViewed) {
          setRecentlyViewed(res.data.recentlyViewed);
        }
      } catch (err) {}
    } finally {
      setLoading(false);
    }
  };

  const trackProductView = async (product) => {
    if (!product || (!product._id && !product.id)) return;
    const pId = product._id || product.id;

    // 1. Immediate UI update for Guest or Auth
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => (p._id || p.id) !== pId);
      const newItem = { ...product, viewedAt: new Date().toISOString() };
      const updated = [newItem, ...filtered].slice(0, 20); // Cap at 20 unique
      AsyncStorage.setItem('@recently_viewed', JSON.stringify(updated));
      return updated;
    });

    // 2. Track activity on backend
    try {
      await api.post(`/products/${pId}/view`, { deviceId: 'mobile_app' });
    } catch (e) {
      console.error('[RecentlyViewed] Track view API failed', e);
    }
  };

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewed,
        loading,
        trackProductView,
        refreshRecentlyViewed: user ? syncAndLoadServerHistory : loadLocalHistory,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
