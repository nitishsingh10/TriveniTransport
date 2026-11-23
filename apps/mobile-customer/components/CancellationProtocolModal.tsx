import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  PhoneCall,
  Info,
} from 'lucide-react-native';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { bookingApi } from '@/lib/api';
import type { BookingStatus } from '@triveni/shared-types';

interface CancellationProtocolModalProps {
  visible: boolean;
  bookingId: string;
  bookingStatus: BookingStatus;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  'Change of moving plans / postponed',
  'Found alternative transport arrangement',
  'Booked with incorrect address or slot',
  'Personal or family emergency',
  'Price / quote adjustment needed',
  'Other reason',
];

export function CancellationProtocolModal({
  visible,
  bookingId,
  bookingStatus,
  onClose,
  onSuccess,
}: CancellationProtocolModalProps) {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isAssigned = bookingStatus === 'ASSIGNED';
  const isInTransit = ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(bookingStatus);

  const handleConfirmCancel = async () => {
    if (isAssigned && !selectedReason) {
      Alert.alert(
        'Reason Required',
        'Please select a cancellation reason as per the Triveni driver-partner protocol.'
      );
      return;
    }

    setLoading(true);
    try {
      await bookingApi.cancel(bookingId, selectedReason || 'Cancelled by customer');
      Alert.alert(
        'Booking Cancelled',
        'Your booking has been cancelled in accordance with our cancellation protocol.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Cancellation Error',
        err.message || 'Unable to cancel this booking. Please contact customer support.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.warningIconBox}>
                <AlertTriangle size={20} color={Colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Order Cancellation</Text>
                <Text style={styles.headerSubtitle}>
                  Order #{bookingId.slice(-6).toUpperCase()} · Protocol Check
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                disabled={loading}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Protocol Notice Card */}
            {isInTransit ? (
              <View style={[styles.protocolCard, { borderColor: Colors.error }]}>
                <ShieldAlert size={20} color={Colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.protocolTitle, { color: Colors.error }]}>
                    In-Transit Lock Protocol
                  </Text>
                  <Text style={styles.protocolText}>
                    This vehicle or moving crew is already en-route or on-site.
                    In-transit moves cannot be self-cancelled in the app.
                  </Text>
                </View>
              </View>
            ) : isAssigned ? (
              <View style={[styles.protocolCard, { borderColor: Colors.warning }]}>
                <Clock size={20} color={Colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.protocolTitle, { color: Colors.warning }]}>
                    Driver Assigned Protocol
                  </Text>
                  <Text style={styles.protocolText}>
                    A verified driver partner & vehicle have been reserved for this slot.
                    Cancelling will release the driver. Please state your reason below.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.protocolCard, { borderColor: Colors.success }]}>
                <CheckCircle2 size={20} color={Colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.protocolTitle, { color: Colors.success }]}>
                    Free Cancellation Window
                  </Text>
                  <Text style={styles.protocolText}>
                    No driver is dispatched yet. Free cancellation applies and your slot
                    will be released immediately with 100% refund.
                  </Text>
                </View>
              </View>
            )}

            {/* Terms List */}
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Triveni Cancellation Terms:</Text>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  Free cancellation before driver assignment.
                </Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  Once assigned, cancellations notify the captain immediately.
                </Text>
              </View>
              <View style={styles.termRow}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  Non-cancellable once the vehicle is en-route or inspection has begun.
                </Text>
              </View>
            </View>

            {/* Reason Selector */}
            {!isInTransit && (
              <View style={styles.reasonSection}>
                <Text style={styles.reasonSectionTitle}>
                  Select Cancellation Reason {isAssigned ? '(Required)' : '(Optional)'}:
                </Text>
                {CANCELLATION_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonChip,
                        isSelected && styles.reasonChipSelected,
                      ]}
                      onPress={() => setSelectedReason(reason)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.reasonText,
                          isSelected && styles.reasonTextSelected,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {isInTransit ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.supportBtn]}
                onPress={onClose}
              >
                <PhoneCall size={16} color={Colors.white} />
                <Text style={styles.supportBtnText}>Contact 24x7 Support</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Keep Move</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.confirmCancelBtn,
                    isAssigned && !selectedReason && styles.btnDisabled,
                  ]}
                  onPress={handleConfirmCancel}
                  disabled={loading || (isAssigned && !selectedReason)}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.confirmCancelBtnText}>Cancel Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 440,
      maxHeight: '85%',
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      overflow: 'hidden',
      ...Shadow.lg,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.cardBorder,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    warningIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.errorLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    headerSubtitle: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: Spacing.xs,
    },
    scrollBody: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    protocolCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      backgroundColor: Colors.surfaceSubtle,
      marginBottom: Spacing.md,
    },
    protocolTitle: {
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
      marginBottom: 3,
    },
    protocolText: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      lineHeight: 18,
    },
    termsBox: {
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm + 4,
      marginBottom: Spacing.md,
    },
    termsTitle: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      marginBottom: 6,
    },
    termRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginBottom: 3,
    },
    termBullet: {
      fontSize: FontSize.xs,
      color: Colors.textMuted,
      lineHeight: 16,
    },
    termText: {
      fontSize: FontSize.xxs + 1,
      color: Colors.textSecondary,
      lineHeight: 16,
      flex: 1,
    },
    reasonSection: {
      marginBottom: Spacing.md,
    },
    reasonSectionTitle: {
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      marginBottom: Spacing.sm,
    },
    reasonChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      backgroundColor: Colors.surface,
      marginBottom: Spacing.xs + 2,
    },
    reasonChipSelected: {
      borderColor: Colors.marigold,
      backgroundColor: Colors.marigoldSubtle,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: Colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: Colors.marigold,
    },
    radioInner: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: Colors.marigold,
    },
    reasonText: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      flex: 1,
    },
    reasonTextSelected: {
      color: Colors.text,
      fontWeight: FontWeight.semibold,
    },
    footer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
      backgroundColor: Colors.surface,
    },
    footerBtnRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionBtn: {
      flex: 1,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    cancelBtn: {
      backgroundColor: Colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    cancelBtnText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: Colors.text,
    },
    confirmCancelBtn: {
      backgroundColor: Colors.error,
    },
    confirmCancelBtnText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.white,
    },
    supportBtn: {
      backgroundColor: Colors.brandSurface,
    },
    supportBtnText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.white,
    },
    btnDisabled: {
      opacity: 0.5,
    },
  });
