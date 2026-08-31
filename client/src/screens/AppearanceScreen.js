import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function AppearanceScreen({ navigation }) {
  const { theme, themePreference, setThemePreference } = useTheme();
  const { user } = useAuth();

  const options = [
    { label: 'System Default', value: 'system', desc: 'Automatically match device dark / light mode settings.' },
    { label: 'Light Mode', value: 'light', desc: 'Clean, bright light theme palette.' },
    { label: 'Dark Mode', value: 'dark', desc: 'Sleek, high-contrast dark theme palette.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Appearance & Theme" showBack navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Choose Application Theme</Text>
        <Text style={[styles.subheading, { color: theme.colors.subtext }]}>
          Selected theme will persist locally and synchronize across your devices when logged in.
        </Text>

        <View style={styles.optionList}>
          {options.map((opt) => {
            const isSelected = themePreference === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setThemePreference(opt.value, !!user)}
              >
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{opt.label}</Text>
                  {isSelected && <Text style={{ color: theme.colors.primary, fontSize: 18 }}>✓</Text>}
                </View>
                <Text style={[styles.optionDesc, { color: theme.colors.subtext }]}>{opt.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live Theme Tokens Preview Box */}
        <View style={[styles.previewBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.previewTitle, { color: theme.colors.text }]}>🎨 Active Palette Preview</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorChip, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.colorChip, { backgroundColor: theme.colors.secondary }]} />
            <View style={[styles.colorChip, { backgroundColor: theme.colors.success }]} />
            <View style={[styles.colorChip, { backgroundColor: theme.colors.warning }]} />
            <View style={[styles.colorChip, { backgroundColor: theme.colors.danger }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  optionList: { marginBottom: 20 },
  optionCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  previewBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  previewTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorChip: { width: 44, height: 44, borderRadius: 8 },
});
