import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OrderTimeline({ status }) {
  const { theme } = useTheme();

  const stages = [
    { key: 'Processing', label: 'Order Confirmed' },
    { key: 'Packed', label: 'Packed' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Out for Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' },
  ];

  const getActiveIndex = () => {
    switch (status) {
      case 'Processing':
      case 'Confirmed':
        return 0;
      case 'Packed':
        return 1;
      case 'Shipped':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveIndex();
  const isCancelled = status === 'Cancelled';
  const isReturned = status === 'Returned';

  if (isCancelled || isReturned) {
    return (
      <View style={[styles.cancelledBox, { backgroundColor: theme.colors.dangerLight }]}>
        <Text style={[styles.cancelledText, { color: theme.colors.danger }]}>
          Order Status: {status.toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>Tracking Timeline</Text>

      <View style={styles.timelineRow}>
        {stages.map((stage, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isDone ? theme.colors.success : theme.colors.border,
                      borderColor: isCurrent ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.circleCheck}>{isDone ? '✓' : ''}</Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.stepLabel,
                    {
                      color: isDone ? theme.colors.text : theme.colors.subtext,
                      fontWeight: isCurrent ? '700' : '400',
                    },
                  ]}
                >
                  {stage.label}
                </Text>
              </View>

              {idx < stages.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: idx < activeIndex ? theme.colors.success : theme.colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    width: 54,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  circleCheck: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  line: {
    flex: 1,
    height: 3,
    marginTop: 10,
  },
  cancelledBox: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  cancelledText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
