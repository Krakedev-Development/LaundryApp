import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimelineEvent } from '../types';
import { Colors } from '../theme/colors';

interface OrderTimelineProps {
  timeline: TimelineEvent[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline }) => {
  return (
    <View style={styles.container}>
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        return (
          <View key={index} style={styles.itemRow}>
            {/* Dot & line */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.dot,
                  event.completed ? styles.dotCompleted : styles.dotPending,
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    event.completed ? styles.lineCompleted : styles.linePending,
                  ]}
                />
              )}
            </View>

            {/* Content */}
            <View style={styles.contentCol}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    event.completed && styles.titleCompleted,
                  ]}
                >
                  {event.title}
                </Text>
                <Text style={styles.timestamp}>{event.timestamp}</Text>
              </View>
              <Text style={styles.desc}>{event.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
  },
  dotPending: {
    backgroundColor: Colors.borderDark,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  lineCompleted: {
    backgroundColor: Colors.primary,
  },
  linePending: {
    backgroundColor: Colors.border,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  titleCompleted: {
    color: Colors.text,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  desc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
