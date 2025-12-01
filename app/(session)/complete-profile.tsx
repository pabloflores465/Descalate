import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { db } from '@/database/db';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { File } from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

const AUTH_STORAGE_KEY = '@descalate_current_user_email';
const PROFILE_COMPLETE_KEY = '@descalate_profile_complete';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadEmail();
  }, []);

  const loadEmail = async () => {
    const email = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    setCurrentEmail(email);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('completeProfile.alerts.permissionRequired'),
          t('completeProfile.errors.photoPermissionRequired')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('completeProfile.errors.nameRequired'));
      return;
    }

    if (!currentEmail) {
      Alert.alert(t('common.error'), t('completeProfile.errors.sessionNotFound'));
      return;
    }

    setIsLoading(true);

    try {
      const ageNumber = age ? parseInt(age) : null;
      if (age && (isNaN(ageNumber!) || ageNumber! < 1 || ageNumber! > 150)) {
        Alert.alert(t('common.error'), t('completeProfile.errors.invalidAge'));
        setIsLoading(false);
        return;
      }

      const updateData: Record<string, unknown> = {
        name: name.trim(),
        age: ageNumber,
        gender: gender || null,
      };

      if (profileImageUri) {
        const file = new File(profileImageUri);
        const base64 = await file.base64();
        updateData.profile_image = `data:image/jpeg;base64,${base64}`;
      }

      await db.update(users).set(updateData).where(eq(users.email, currentEmail));

      await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert(t('common.error'), t('completeProfile.errors.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <LanguageSelector style={styles.languageSelector} />
          <Pressable style={styles.avatarContainer} onPress={pickImage}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.title}>{t('completeProfile.title')}</Text>
          <Text style={styles.subtitle}>{t('completeProfile.subtitle')}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('completeProfile.sections.personalInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('completeProfile.fields.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('completeProfile.fields.namePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('completeProfile.fields.age')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder={t('completeProfile.fields.agePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('completeProfile.fields.gender')}</Text>
            <View style={styles.genderContainer}>
              <Pressable
                style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
                onPress={() => setGender('Male')}
              >
                <Ionicons name="male" size={20} color={gender === 'Male' ? 'white' : '#5a8c6a'} />
                <Text
                  style={[styles.genderButtonText, gender === 'Male' && styles.genderButtonTextActive]}
                >
                  {t('completeProfile.genderOptions.male')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
                onPress={() => setGender('Female')}
              >
                <Ionicons name="female" size={20} color={gender === 'Female' ? 'white' : '#5a8c6a'} />
                <Text
                  style={[styles.genderButtonText, gender === 'Female' && styles.genderButtonTextActive]}
                >
                  {t('completeProfile.genderOptions.female')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Other' && styles.genderButtonActive]}
                onPress={() => setGender('Other')}
              >
                <Ionicons name="transgender" size={20} color={gender === 'Other' ? 'white' : '#5a8c6a'} />
                <Text
                  style={[styles.genderButtonText, gender === 'Other' && styles.genderButtonTextActive]}
                >
                  {t('completeProfile.genderOptions.other')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.saveButtonText}>
              {isLoading ? t('completeProfile.buttons.saving') : t('completeProfile.buttons.continue')}
            </Text>
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('completeProfile.buttons.completeLater')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8f3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerSection: {
    backgroundColor: '#F5F3ED',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  languageSelector: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#5a8c6a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F0EDE5',
    shadowColor: '#5a8c6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#F0EDE5',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5a8c6a',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F0EDE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    fontWeight: '500',
    marginTop: 4,
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 20,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 5,
    marginHorizontal: 20,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 9999,
    paddingVertical: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderButtonActive: {
    backgroundColor: '#5a8c6a',
    borderColor: '#5a8c6a',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#5a8c6a',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  skipText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '500',
  },
});
