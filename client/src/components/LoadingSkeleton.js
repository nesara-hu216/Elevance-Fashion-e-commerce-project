import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoadingSkeleton({ type = 'card', count = 2 }) {
  const { theme } = useTheme();

  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <View style={styles.grid}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[
              styles.cardSkeleton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={[styles.imageSkeleton, { backgroundColor: theme.colors.border }]} />
            <View style={styles.contentSkeleton}>
              <View style={[styles.line, { width: '80%', backgroundColor: theme.colors.border }]} />
              <View style={[styles.line, { width: '50%', backgroundColor: theme.colors.border }]} />
              <View style={[styles.line, { width: '40%', backgroundColor: theme.colors.border }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((_, i) => (
        <View
          key={i}
          style={[
            styles.rowSkeleton,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.thumbSkeleton, { backgroundColor: theme.colors.border }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.line, { width: '70%', backgroundColor: theme.colors.border }]} />
            <View style={[styles.line, { width: '40%', backgroundColor: theme.colors.border, marginTop: 8 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  cardSkeleton: {
    width: '48%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageSkeleton: {
    height: 130,
    width: '100%',
  },
  contentSkeleton: {
    padding: 10,
  },
  line: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  list: {
    paddingHorizontal: 16,
  },
  rowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  thumbSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
});
