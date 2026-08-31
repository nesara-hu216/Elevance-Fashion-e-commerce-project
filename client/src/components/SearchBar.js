import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SearchBar({ value, onChangeText, onSubmit, placeholder = 'Search 2,400+ products, brands, dresses, shoes...' }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.inputBg,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.7} style={styles.searchIconBtn} onPress={onSubmit}>
        <Text style={styles.searchIcon}>🔍</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtext}
        returnKeyType="search"
      />

      {value ? (
        <TouchableOpacity activeOpacity={0.7} style={styles.clearBtn} onPress={() => { onChangeText(''); onSubmit && onSubmit(); }}>
          <Text style={{ fontSize: 14, color: theme.colors.subtext }}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchIconBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
  },
});
