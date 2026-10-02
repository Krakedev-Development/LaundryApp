import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { OrderItem, OrderExtra, OrderPricing } from '../../types';

export const NewOrderWizardScreen = ({ navigation }: any) => {
  const {
    customer,
    catalogGarments,
    catalogServices,
    catalogExtras,
    availablePromos,
    createOrder,
  } = useLaundry();

  const [step, setStep] = useState<number>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'g-1': 3,
    'g-2': 2,
  });
  const [selectedService, setSelectedService] = useState<string>('s-3'); // Lavado + Planchado
  const [selectedExtras, setSelectedExtras] = useState<string[]>(['ext-2']);
  const [pickupDate, setPickupDate] = useState('Hoy, 16:00 - 18:00');
  const [deliveryDate, setDeliveryDate] = useState('Vie 02 Oct, 16:00 - 18:00');
  const [promoInput, setPromoInput] = useState('FRESH10');
  const [appliedPromo, setAppliedPromo] = useState<string | null>('FRESH10');
  const [paymentMethod, setPaymentMethod] = useState<'Billetera' | 'Tarjeta'>('Billetera');

  const updateQuantity = (id: string, delta: number) => {
    const cur = quantities[id] || 0;
    const next = Math.max(0, cur + delta);
    setQuantities({ ...quantities, [id]: next });
  };

  // Calculations
  const activeService = catalogServices.find((s) => s.id === selectedService) || catalogServices[0];
  const itemsSubtotal = catalogGarments.reduce((sum, g) => {
    const qty = quantities[g.id] || 0;
    return sum + qty * (g.basePrice + activeService.extraPrice);
  }, 0);

  const extrasTotal = catalogExtras
    .filter((e) => selectedExtras.includes(e.id))
    .reduce((sum, e) => sum + e.price, 0);

  const promoDiscount = appliedPromo === 'FRESH10' ? (itemsSubtotal + extrasTotal) * 0.1 : 0;
  const membershipDiscount = (itemsSubtotal + extrasTotal) * 0.12; // 12% estándar
  const finalTotal = Math.max(0, itemsSubtotal + extrasTotal - promoDiscount - membershipDiscount);

  const handleCreate = () => {
    if (itemsSubtotal === 0) {
      Alert.alert('Atención', 'Por favor selecciona al menos una prenda.');
      return;
    }

    const items: OrderItem[] = catalogGarments
      .filter((g) => (quantities[g.id] || 0) > 0)
      .map((g) => ({
        id: `it-${g.id}`,
        garmentType: g.name,
        quantity: quantities[g.id],
        serviceType: activeService.name,
        unitPrice: g.basePrice + activeService.extraPrice,
      }));

    const extras: OrderExtra[] = catalogExtras.filter((e) => selectedExtras.includes(e.id));

    const pricing: OrderPricing = {
      itemsSubtotal,
      extrasTotal,
      discount: promoDiscount,
      membershipBenefitDiscount: membershipDiscount,
      deliveryFee: 0,
      total: finalTotal,
    };

    const primaryAddress = customer.addresses[0];

    const newOrder = createOrder(
      items,
      extras,
      {
        addressId: primaryAddress.id,
        addressTitle: primaryAddress.title,
        addressFull: primaryAddress.fullAddress,
        date: pickupDate,
        timeSlot: '16:00 - 18:00',
        notes: 'Cuidado con prendas de seda',
      },
      {
        addressId: primaryAddress.id,
        addressTitle: primaryAddress.title,
        addressFull: primaryAddress.fullAddress,
        date: deliveryDate,
        timeSlot: '16:00 - 18:00',
      },
      pricing,
      appliedPromo,
      paymentMethod === 'Billetera' ? 'Billetera Laundry' : 'Tarjeta Visa •••• 4242'
    );

    Alert.alert(
      '¡Solicitud Creada!',
      `Tu pedido ${newOrder.id} ha sido programado con éxito.`,
      [{ text: 'Ver Seguimiento', onPress: () => navigation.navigate('Tracking', { orderId: newOrder.id }) }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[styles.stepItem, step >= s ? styles.stepItemActive : styles.stepItemInactive]}
          >
            <Text style={[styles.stepText, step >= s ? styles.stepTextActive : styles.stepTextInactive]}>
              Paso {s}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* STEP 1: Garments & Service */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>1. Selecciona Servicio y Prendas</Text>

            <Text style={styles.subTitle}>Tipo de Cuidado</Text>
            <View style={styles.serviceChips}>
              {catalogServices.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[
                    styles.chip,
                    selectedService === svc.id ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setSelectedService(svc.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedService === svc.id ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {svc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subTitle}>Prendas para Lavar</Text>
            {catalogGarments.map((g) => {
              const qty = quantities[g.id] || 0;
              const unitP = g.basePrice + activeService.extraPrice;
              return (
                <View key={g.id} style={styles.garmentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.garmentName}>{g.name}</Text>
                    <Text style={styles.garmentPrice}>${unitP.toFixed(2)} / prenda</Text>
                  </View>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantity(g.id, -1)}
                    >
                      <Ionicons name="remove" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantity(g.id, 1)}
                    >
                      <Ionicons name="add" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* STEP 2: Extras */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>2. Extras y Tratamientos</Text>
            {catalogExtras.map((extra) => {
              const isSelected = selectedExtras.includes(extra.id);
              return (
                <TouchableOpacity
                  key={extra.id}
                  style={[styles.extraCard, isSelected && styles.extraCardSelected]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedExtras(selectedExtras.filter((id) => id !== extra.id));
                    } else {
                      setSelectedExtras([...selectedExtras, extra.id]);
                    }
                  }}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={Colors.primary}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    <Text style={styles.extraDesc}>{extra.description}</Text>
                  </View>
                  <Text style={styles.extraPrice}>+${extra.price.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 3: Dates and Address */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>3. Dirección y Horarios</Text>
            <View style={styles.addressBox}>
              <Ionicons name="location-outline" size={24} color={Colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.addrTitle}>{customer.addresses[0].title}</Text>
                <Text style={styles.addrDesc}>{customer.addresses[0].fullAddress}</Text>
              </View>
            </View>

            <Text style={styles.subTitle}>Recogida</Text>
            <View style={styles.timeSlotBox}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.timeSlotText}>Hoy • Franja 16:00 - 18:00</Text>
            </View>

            <Text style={styles.subTitle}>Entrega Estimada</Text>
            <View style={styles.timeSlotBox}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.timeSlotText}>Vie 02 Oct • Franja 16:00 - 18:00</Text>
            </View>
          </View>
        )}

        {/* STEP 4: Review and Payment */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>4. Resumen y Confirmación</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryLine}>
                <Text style={styles.sumLabel}>Subtotal Prendas</Text>
                <Text style={styles.sumVal}>${itemsSubtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.sumLabel}>Extras seleccionados</Text>
                <Text style={styles.sumVal}>+${extrasTotal.toFixed(2)}</Text>
              </View>
              {promoDiscount > 0 && (
                <View style={styles.summaryLine}>
                  <Text style={styles.discountLabel}>Cupón FRESH10 (10%)</Text>
                  <Text style={styles.discountVal}>-${promoDiscount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.summaryLine}>
                <Text style={styles.discountLabel}>Membresía Estándar (12%)</Text>
                <Text style={styles.discountVal}>-${membershipDiscount.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryLine}>
                <Text style={styles.totalLabel}>Total a Pagar</Text>
                <Text style={styles.totalVal}>${finalTotal.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={styles.subTitle}>Método de Pago</Text>
            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'Billetera' && styles.payOptionActive]}
              onPress={() => setPaymentMethod('Billetera')}
            >
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.payName}>Billetera Laundry</Text>
                <Text style={styles.paySub}>Saldo disponible: ${customer.walletBalance.toFixed(2)}</Text>
              </View>
              {paymentMethod === 'Billetera' && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'Tarjeta' && styles.payOptionActive]}
              onPress={() => setPaymentMethod('Tarjeta')}
            >
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.payName}>Tarjeta Visa •••• 4242</Text>
                <Text style={styles.paySub}>Pago seguro en línea</Text>
              </View>
              {paymentMethod === 'Tarjeta' && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation between steps */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 1 && { flex: 1 }]}
          onPress={() => {
            if (step < 4) {
              setStep(step + 1);
            } else {
              handleCreate();
            }
          }}
        >
          <Text style={styles.nextBtnText}>
            {step === 4 ? `Confirmar ($${finalTotal.toFixed(2)})` : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stepBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  stepItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  stepItemActive: { backgroundColor: Colors.primaryLight },
  stepItemInactive: { backgroundColor: Colors.background },
  stepText: { fontSize: 12, fontWeight: '700' },
  stepTextActive: { color: Colors.primaryDark },
  stepTextInactive: { color: Colors.textMuted },
  content: { padding: 16, paddingBottom: 30 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  subTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginTop: 12, marginBottom: 8 },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipInactive: { backgroundColor: Colors.surface, borderColor: Colors.border },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  chipTextInactive: { color: Colors.text },
  garmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  garmentName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  garmentPrice: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  extraCardSelected: { borderColor: Colors.primary, backgroundColor: '#F0F9FF' },
  extraName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  extraDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  extraPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addrTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  addrDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  timeSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: Colors.text, marginLeft: 10 },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLabel: { fontSize: 13, color: Colors.textMuted },
  sumVal: { fontSize: 13, fontWeight: '600', color: Colors.text },
  discountLabel: { fontSize: 13, color: Colors.success },
  discountVal: { fontSize: 13, fontWeight: '700', color: Colors.success },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
  totalVal: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  payOptionActive: { borderColor: Colors.primary, backgroundColor: '#F0F9FF' },
  payName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  paySub: { fontSize: 11, color: Colors.textMuted },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  backBtnText: { color: Colors.text, fontWeight: '700' },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
