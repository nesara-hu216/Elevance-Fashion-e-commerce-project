import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function CategoryTabs({ categories, selectedCategory, onSelectCategory }) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.8}
            style={[
              styles.tab,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => onSelectCategory(cat)}
          >
            <Text
              style={[
                styles.tabText,
                { color: isSelected ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
