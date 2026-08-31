import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import Header from '../components/Header';

export default function NotificationSettingsScreen({ navigation }) {
  const { theme } = useTheme();
  const { preferences, logs, updatePreferences } = useNotification();

  const toggleSwitch = (key, value) => {
    const updated = { ...preferences, [key]: value };
    updatePreferences(updated);
  };

  const notificationCategories = [
    { key: 'orderUpdates', label: 'Order Updates', desc: 'Confirmations, shipping updates, and delivery alerts.' },
    { key: 'paymentUpdates', label: 'Payment Updates', desc: 'Payment receipt and transaction status alerts.' },
    { key: 'wishlistAlerts', label: 'Wishlist Alerts', desc: 'Instant notifications when saved items drop in price.' },
    { key: 'backInStock', label: 'Back-in-Stock Alerts', desc: 'Notifications when out-of-stock wishlist items return.' },
    { key: 'cartReminders', label: 'Cart Reminders', desc: 'Helpful reminders about items left in your cart.' },
    { key: 'promotions', label: 'Promotional Campaigns', desc: 'Exclusive deals, discounts, and flash sales.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Notification Settings" showBack navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Push Categories</Text>
        <Text style={[styles.subheading, { color: theme.colors.subtext }]}>
          Control which types of notifications you receive on your device.
        </Text>

        {/* Category Toggles */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {notificationCategories.map((cat, idx) => (
            <View
              key={cat.key}
              style={[
                styles.toggleRow,
                idx < notificationCategories.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{cat.label}</Text>
                <Text style={[styles.toggleDesc, { color: theme.colors.subtext }]}>{cat.desc}</Text>
              </View>
              <Switch
                value={!!preferences[cat.key]}
                onValueChange={(val) => toggleSwitch(cat.key, val)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>
          ))}
        </View>

        {/* Notification Logs Audit */}
        <Text style={[styles.heading, { color: theme.colors.text, marginTop: 16 }]}>Notification History Logs</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {logs.length === 0 ? (
            <Text style={{ color: theme.colors.subtext, fontSize: 13 }}>No push notifications logged yet.</Text>
          ) : (
            logs.map((log) => (
              <View key={log._id} style={[styles.logItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logTitle, { color: theme.colors.text }]}>{log.title}</Text>
                  <Text style={[styles.logStatus, { color: log.status === 'sent' || log.status === 'delivered' ? theme.colors.success : theme.colors.danger }]}>
                    {log.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.logBody, { color: theme.colors.subtext }]}>{log.message}</Text>
                <Text style={{ fontSize: 10, color: theme.colors.subtext, marginTop: 2 }}>
                  {new Date(log.sentAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 12, lineHeight: 16, marginBottom: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '700' },
  toggleDesc: { fontSize: 11, marginTop: 2 },
  logItem: { borderBottomWidth: 1, paddingVertical: 8 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTitle: { fontSize: 13, fontWeight: '700' },
  logStatus: { fontSize: 10, fontWeight: '800' },
  logBody: { fontSize: 12, marginTop: 2 },
});
