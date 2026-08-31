import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children, user }) => {
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    paymentUpdates: true,
    shippingUpdates: true,
    wishlistAlerts: true,
    backInStock: true,
    promotions: false,
    cartReminders: true,
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      registerPushToken();
      fetchPreferences();
      fetchLogs();
    }
  }, [user]);

  const registerPushToken = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notification] Permission denied by user');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      if (tokenData && tokenData.data) {
        await api.post('/notifications/register-device', {
          expoPushToken: tokenData.data,
          platform: 'mobile',
        });
      }
    } catch (e) {
      console.warn('[Notification] Failed to register push token', e.message);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.data && res.data.preferences) {
        setPreferences(res.data.preferences);
      }
    } catch (e) {
      console.error('[Notification] Error fetching preferences', e);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      setPreferences(newPrefs);
      const res = await api.patch('/notifications/preferences', newPrefs);
      if (res.data && res.data.preferences) {
        setPreferences(res.data.preferences);
      }
    } catch (e) {
      console.error('[Notification] Error updating preferences', e);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/logs');
      if (res.data && res.data.logs) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.error('[Notification] Error fetching logs', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        logs,
        loading,
        updatePreferences,
        refreshLogs: fetchLogs,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
