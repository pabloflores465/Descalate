import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { db, resetDatabase } from '@/database/db';
import { users, type User } from '@/database/schema';
import { seedHistoricalSessions, clearSessions } from '@/database/seed';
import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTutorial } from '@/context/TutorialContext';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

export default function ProfileScreen() {
  const router = useRouter();
  const { resetTutorial } = useTutorial();
  const { currentUserEmail, setCurrentUserEmail } = useAuth();
  const { clearSession } = useSession();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadUserData = async (email: string | null) => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (userResult.length > 0) {
        const userData = userResult[0];
        setUser(userData);
        setName(userData.name || '');
        setAge(userData.age?.toString() || '');
        setGender(userData.gender || '');

        if (!hasNewImage) {
          if (userData.profile_image) {
            setProfileImageUri(userData.profile_image);
          } else {
            setProfileImageUri(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setHasNewImage(false);
      if (currentUserEmail) {
        loadUserData(currentUserEmail);
      } else {
        setIsLoading(false);
      }
    }, [currentUserEmail])
  );

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('completeProfile.alerts.permissionRequired'),
          t('profile.alerts.errors.photoPermission')
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
        const selectedUri = result.assets[0].uri;
        setProfileImageUri(selectedUri);
        setHasNewImage(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('profile.alerts.errors.imagePick'));
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      setIsSaving(true);

      if (!name.trim()) {
        Alert.alert(t('common.error'), t('completeProfile.errors.nameRequired'));
        setIsSaving(false);
        return;
      }

      const ageNumber = age ? parseInt(age) : null;
      if (age && (isNaN(ageNumber!) || ageNumber! < 1 || ageNumber! > 150)) {
        Alert.alert(t('common.error'), t('completeProfile.errors.invalidAge'));
        setIsSaving(false);
        return;
      }

      const updateData: any = {
        name: name.trim(),
        age: ageNumber,
        gender: gender.trim() || null,
      };

      if (hasNewImage && profileImageUri) {
        if (!profileImageUri.startsWith('data:image')) {
          const file = new File(profileImageUri);
          const base64 = await file.base64();
          updateData.profile_image = `data:image/jpeg;base64,${base64}`;
        } else {
          updateData.profile_image = profileImageUri;
        }
      }

      await db.update(users).set(updateData).where(eq(users.email, user.email));

      setHasNewImage(false);
      Alert.alert(t('common.success'), t('profile.alerts.success.profileUpdated'));
      loadUserData(currentUserEmail);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), t('profile.alerts.errors.profileUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.alerts.logOut.title'),
      t('profile.alerts.logOut.message'),
      [
        {
          text: t('profile.alerts.logOut.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.alerts.logOut.confirm'),
          style: 'destructive',
          onPress: async () => {
            // Clear session data first
            clearSession();
            // Clear auth context (this also clears AsyncStorage)
            await setCurrentUserEmail(null);
            // Clear user-specific flags
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.TUTORIAL_COMPLETE,
              STORAGE_KEYS.ONBOARDING_COMPLETE,
              STORAGE_KEYS.PROFILE_COMPLETE,
            ]);
            router.replace('/(session)/auth');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleResetDatabase = () => {
    Alert.alert(
      t('profile.alerts.resetDatabase.title'),
      t('profile.alerts.resetDatabase.message'),
      [
        {
          text: t('profile.alerts.resetDatabase.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.alerts.resetDatabase.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear session data first
              clearSession();
              await resetDatabase();
              // Clear auth context (this also clears AsyncStorage)
              await setCurrentUserEmail(null);
              // Clear all session flags
              await AsyncStorage.multiRemove([
                STORAGE_KEYS.TUTORIAL_COMPLETE,
                STORAGE_KEYS.ONBOARDING_COMPLETE,
                STORAGE_KEYS.PROFILE_COMPLETE,
              ]);
              router.replace('/(session)/auth');
              Alert.alert(t('common.success'), t('profile.alerts.success.databaseReset'));
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert(t('common.error'), t('profile.alerts.errors.databaseResetFailed'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSeedData = () => {
    Alert.alert(
      t('profile.alerts.generateTestData.title'),
      t('profile.alerts.generateTestData.message'),
      [
        {
          text: t('profile.alerts.generateTestData.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.alerts.generateTestData.confirm'),
          onPress: async () => {
            if (!user?.id) {
              Alert.alert(t('common.error'), t('profile.alerts.errors.userNotFound'));
              return;
            }
            try {
              setIsSeeding(true);
              await clearSessions(user.id);
              await seedHistoricalSessions(user.id);
              Alert.alert(
                t('common.success'),
                t('profile.alerts.success.testDataGenerated')
              );
            } catch (error) {
              console.error('Error seeding data:', error);
              Alert.alert(t('common.error'), t('profile.alerts.errors.testDataFailed'));
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleResetTutorial = () => {
    Alert.alert(
      t('profile.alerts.resetTutorial.title'),
      t('profile.alerts.resetTutorial.message'),
      [
        {
          text: t('profile.alerts.resetTutorial.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.alerts.resetTutorial.confirm'),
          onPress: async () => {
            await resetTutorial();
            router.push('/(tabs)/home');
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2d9a6e" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/wall3.jpg')}
      style={styles.bgContainer}
      imageStyle={styles.bgImage}
    >
    <BlurView intensity={50} tint="dark" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <LanguageSelector style={styles.languageSelector} />
          <Pressable style={styles.avatarContainer} onPress={pickImage}>
            {profileImageUri || user?.picture ? (
              <Image
                key={profileImageUri || user?.picture}
                source={{ uri: profileImageUri || user?.picture || undefined }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('profile.sections.profileInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.fields.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.fields.namePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.fields.age')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder={t('profile.fields.agePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.fields.gender')}</Text>
            <View style={styles.genderContainer}>
              <Pressable
                style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
                onPress={() => setGender('Male')}
              >
                <Ionicons name="male" size={20} color={gender === 'Male' ? 'white' : '#2d9a6e'} />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'Male' && styles.genderButtonTextActive,
                  ]}
                >
                  {t('profile.genderOptions.male')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
                onPress={() => setGender('Female')}
              >
                <Ionicons
                  name="female"
                  size={20}
                  color={gender === 'Female' ? 'white' : '#2d9a6e'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'Female' && styles.genderButtonTextActive,
                  ]}
                >
                  {t('profile.genderOptions.female')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Other' && styles.genderButtonActive]}
                onPress={() => setGender('Other')}
              >
                <Ionicons
                  name="transgender"
                  size={20}
                  color={gender === 'Other' ? 'white' : '#2d9a6e'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'Other' && styles.genderButtonTextActive,
                  ]}
                >
                  {t('profile.genderOptions.other')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              isSaving && styles.saveButtonDisabled,
              !isSaving && pressed && { backgroundColor: '#4a7c59' },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="white"
                style={{ marginRight: 10 }}
              />
            )}
            <Text style={styles.saveButtonText}>{isSaving ? t('profile.buttons.saving') : t('profile.buttons.saveChanges')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: pressed ? '#d63031' : '#e74c3c' },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>{t('profile.buttons.logOut')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tutorialButton,
              { backgroundColor: pressed ? '#2563eb' : '#3b82f6' },
            ]}
            onPress={handleResetTutorial}
          >
            <Ionicons name="school" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.tutorialText}>{t('profile.buttons.resetTutorial')}</Text>
          </Pressable>

          {__DEV__ && (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.resetButton,
                  { backgroundColor: pressed ? '#c0392b' : '#e67e22' },
                ]}
                onPress={handleResetDatabase}
              >
                <Ionicons name="warning" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.resetText}>{t('profile.devButtons.resetDatabase')}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.seedButton,
                  isSeeding && styles.seedButtonDisabled,
                  { backgroundColor: pressed && !isSeeding ? '#6366f1' : '#818cf8' },
                ]}
                onPress={handleSeedData}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
                ) : (
                  <Ionicons name="flask" size={20} color="white" style={{ marginRight: 10 }} />
                )}
                <Text style={styles.seedText}>
                  {isSeeding ? t('profile.devButtons.generating') : t('profile.devButtons.generateTestData')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerSection: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    backgroundColor: '#2d9a6e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#2d9a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2d9a6e',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 5,
    marginHorizontal: 20,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 9999,
    paddingVertical: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genderButtonActive: {
    backgroundColor: '#2d9a6e',
    borderColor: '#2d9a6e',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#2d9a6e',
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
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#818cf8',
    borderRadius: 50,
    paddingVertical: 15,
    marginTop: 12,
    gap: 10,
  },
  tutorialText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 50,
    paddingVertical: 15,
    marginTop: 12,
    gap: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e67e22',
    borderRadius: 50,
    paddingVertical: 15,
    marginTop: 12,
    gap: 10,
  },
  resetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 50,
    paddingVertical: 15,
    marginTop: 12,
    gap: 10,
  },
  seedButtonDisabled: {
    opacity: 0.6,
  },
  seedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
