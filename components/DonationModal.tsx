import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  DONATION_PRODUCT_IDS,
  purchaseDonation,
  connectToStore,
  disconnectFromStore,
  isIapAvailable,
} from '@/services/donations';

interface DonationModalProps {
  visible: boolean;
  onClose: () => void;
  onDonationComplete?: () => void;
}

type DonationOption = {
  id: string;
  amount: number;
  productId: string;
};

const DONATION_OPTIONS: DonationOption[] = [
  { id: '1', amount: 1, productId: DONATION_PRODUCT_IDS.DONATE_1 },
  { id: '5', amount: 5, productId: DONATION_PRODUCT_IDS.DONATE_5 },
  { id: '10', amount: 10, productId: DONATION_PRODUCT_IDS.DONATE_10 },
];

export default function DonationModal({
  visible,
  onClose,
  onDonationComplete,
}: DonationModalProps) {
  const { t } = useTranslation();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const iapAvailable = isIapAvailable();

  useEffect(() => {
    if (visible) {
      if (iapAvailable) {
        connectToStore();
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (!visible && iapAvailable) {
        disconnectFromStore();
      }
    };
  }, [visible, iapAvailable]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomSelect = () => {
    setSelectedAmount(null);
    setIsCustom(true);
  };

  const handleDonate = async () => {
    // Check if IAP is available
    if (!iapAvailable) {
      Alert.alert(
        t('donation.errors.title'),
        t('donation.errors.notAvailable'),
        [{ text: 'OK', onPress: handleClose }]
      );
      return;
    }

    const amount = isCustom ? parseFloat(customAmount) : selectedAmount;

    if (!amount || amount <= 0) {
      Alert.alert(t('donation.errors.title'), t('donation.errors.invalidAmount'));
      return;
    }

    // Find the matching product ID
    let productId: string;
    if (isCustom) {
      // For custom amounts, round to nearest available tier
      if (amount <= 2) {
        productId = DONATION_PRODUCT_IDS.DONATE_1;
      } else if (amount <= 7) {
        productId = DONATION_PRODUCT_IDS.DONATE_5;
      } else {
        productId = DONATION_PRODUCT_IDS.DONATE_10;
      }
    } else {
      const option = DONATION_OPTIONS.find((opt) => opt.amount === amount);
      if (!option) {
        Alert.alert(t('donation.errors.title'), t('donation.errors.productNotFound'));
        return;
      }
      productId = option.productId;
    }

    setIsProcessing(true);

    try {
      const success = await purchaseDonation(
        productId,
        () => {
          // onSuccess callback
          setIsProcessing(false);
          Alert.alert(t('donation.success.title'), t('donation.success.message'), [
            {
              text: t('common.continue'),
              onPress: () => {
                onDonationComplete?.();
                handleClose();
              },
            },
          ]);
        },
        (error: unknown) => {
          // onError callback
          setIsProcessing(false);
          const message = error instanceof Error ? error.message : 'Unknown error';
          Alert.alert(t('donation.errors.title'), t('donation.errors.purchaseFailed', { error: message }));
        }
      );

      if (!success) {
        // User cancelled
        setIsProcessing(false);
      }
    } catch (error: unknown) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(t('donation.errors.title'), t('donation.errors.purchaseFailed', { error: message }));
    }
  };

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setIsCustom(false);
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  const canDonate = (selectedAmount !== null && selectedAmount > 0) || (isCustom && parseFloat(customAmount) > 0);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPressable} onPress={handleSkip} />
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="heart" size={40} color="#fff" />
                </View>
                <Text style={styles.title}>{t('donation.title')}</Text>
                <Text style={styles.subtitle}>{t('donation.subtitle')}</Text>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={styles.sectionTitle}>{t('donation.selectAmount')}</Text>

              <View style={styles.amountGrid}>
                {DONATION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.amountButton,
                      selectedAmount === option.amount && styles.amountButtonSelected,
                    ]}
                    onPress={() => handleAmountSelect(option.amount)}
                  >
                    <Text
                      style={[
                        styles.amountText,
                        selectedAmount === option.amount && styles.amountTextSelected,
                      ]}
                    >
                      ${option.amount}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.amountButton, isCustom && styles.amountButtonSelected]}
                  onPress={handleCustomSelect}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={isCustom ? '#fff' : '#667eea'}
                  />
                  <Text style={[styles.amountText, isCustom && styles.amountTextSelected]}>
                    {t('donation.custom')}
                  </Text>
                </Pressable>
              </View>

              {isCustom && (
                <View style={styles.customInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                    autoFocus
                  />
                  <Text style={styles.currencyLabel}>USD</Text>
                </View>
              )}

              <Text style={styles.thankYouText}>{t('donation.thankYouMessage')}</Text>

              <Pressable
                style={[styles.donateButton, !canDonate && styles.donateButtonDisabled]}
                onPress={handleDonate}
                disabled={!canDonate || isProcessing}
              >
                <LinearGradient
                  colors={canDonate ? ['#667eea', '#764ba2'] : ['#ccc', '#aaa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.donateButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={20} color="#fff" />
                      <Text style={styles.donateButtonText}>{t('donation.donateButton')}</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>{t('donation.maybeLater')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  amountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#fff',
    minWidth: 80,
    gap: 6,
  },
  amountButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  amountTextSelected: {
    color: '#fff',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  customInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  thankYouText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  donateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
  },
});
