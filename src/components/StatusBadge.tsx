import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus, ORDER_STATUS_LABELS } from '../types';
import { Colors } from '../theme/colors';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = Colors.primaryLight;
  let textColor = Colors.primaryDark;

  if (['DELIVERED', 'CLOSED'].includes(status)) {
    bgColor = Colors.successLight;
    textColor = Colors.success;
  } else if (['HEADING_TO_PICKUP', 'OUT_FOR_DELIVERY'].includes(status)) {
    bgColor = '#FEF3C7';
    textColor = '#B45309';
  } else if (['CANCELLED', 'INCIDENT'].includes(status)) {
    bgColor = Colors.errorLight;
    textColor = Colors.error;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {ORDER_STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
