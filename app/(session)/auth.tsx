import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { db, expoDb } from '@/database/db';
import { users, registerUserSchema, loginUserSchema, googleUserSchema } from '@/database/schema';
import { runMigrations } from '@/database/migrations';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTutorial } from '@/context/TutorialContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

bcrypt.setRandomFallback((len: number) => {
  const randomBytes = Crypto.getRandomBytes(len);
  return Array.from(randomBytes);
});

export default function AuthScreen() {
  const router = useRouter();
  const { setCurrentUserEmail } = useAuth();
  const { resetTutorial } = useTutorial();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const { promptAsync, userInfo, request, signOut } = useGoogleAuth();

  useEffect(() => {
    async function setUpDatabase() {
      try {
        console.log('starting database connection ...');
        await runMigrations(expoDb);
        console.info('database ready');
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    }
    setUpDatabase();
  }, []);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const handleGoogleAuth = async () => {
    try {
      setIsGoogleLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo && db) {
      const handleGoogleUser = async () => {
        setIsGoogleLoading(true);
        try {
          if (activeTab === 'login') {
            const existingUser = await db
              .select()
              .from(users)
              .where(eq(users.email, userInfo.email))
              .limit(1);

            if (existingUser.length === 0) {
              Alert.alert(
                t('auth.errors.userNotFound'),
                t('auth.errors.noAccountExists'),
                [{ text: 'OK' }]
              );
              // Clear Google userInfo so user can try again
              signOut();
              return;
            }

            console.log('Google user logged in successfully');
            await setCurrentUserEmail(userInfo.email);
            router.replace('/home');
          } else {
            const validationResult = googleUserSchema.safeParse({
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              google_id: userInfo.id,
            });

            if (!validationResult.success) {
              console.error('Validation error:', validationResult.error);
              signOut();
              return;
            }

            await db
              .insert(users)
              .values(validationResult.data)
              .onConflictDoUpdate({
                target: users.email,
                set: {
                  name: validationResult.data.name,
                  picture: validationResult.data.picture,
                  google_id: validationResult.data.google_id,
                },
              });

            console.log('Google user saved successfully');
            await setCurrentUserEmail(userInfo.email);
            router.replace('/home');
          }
        } catch (error) {
          console.error('Error handling Google user:', error);
          Alert.alert(t('common.error'), t('auth.errors.googleAuthFailed'));
          signOut();
        } finally {
          setIsGoogleLoading(false);
        }
      };
      handleGoogleUser();
    }
  }, [userInfo, router, activeTab, setCurrentUserEmail, signOut]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      setErrors({});

      const validationResult = loginUserSchema.safeParse({
        email: email.trim(),
        password,
      });

      if (!validationResult.success) {
        const fieldErrors = validationResult.error.format();
        const errorMessages: Record<string, string> = {};

        if (fieldErrors.email?._errors) {
          errorMessages.email = fieldErrors.email._errors[0];
        }
        if (fieldErrors.password?._errors) {
          errorMessages.password = fieldErrors.password._errors[0];
        }

        setErrors(errorMessages);
        Alert.alert(t('auth.errors.validationError'), Object.values(errorMessages).join('\n'));
        setIsLoading(false);
        return;
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validationResult.data.email))
        .limit(1);

      if (existingUser.length === 0) {
        Alert.alert(t('common.error'), t('auth.errors.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      const user = existingUser[0];

      if (!user.password) {
        Alert.alert(
          t('common.error'),
          t('auth.errors.googleAccountExists')
        );
        setIsLoading(false);
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        Alert.alert(t('common.error'), t('auth.errors.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      console.log('User logged in successfully');
      await setCurrentUserEmail(validationResult.data.email);
      console.log('Email saved:', validationResult.data.email);
      router.replace('/home');
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      Alert.alert(t('common.error'), t('auth.errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const hashPassword = (password: string): string => {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      return hashedPassword;
    };

    try {
      setErrors({});

      const validationResult = registerUserSchema.safeParse({
        email: email.trim(),
        password,
        name: null,
      });

      if (!validationResult.success) {
        const fieldErrors = validationResult.error.format();
        const errorMessages: Record<string, string> = {};

        if (fieldErrors.email?._errors) {
          errorMessages.email = fieldErrors.email._errors[0];
        }
        if (fieldErrors.password?._errors) {
          errorMessages.password = fieldErrors.password._errors[0];
        }

        setErrors(errorMessages);
        Alert.alert(t('auth.errors.validationError'), Object.values(errorMessages).join('\n'));
        setIsLoading(false);
        return;
      }

      const passwordHash = hashPassword(validationResult.data.password);
      console.info('password hashed successfully');

      await db.insert(users).values({
        email: validationResult.data.email,
        password: passwordHash,
        name: validationResult.data.name,
      });

      console.log('User registered successfully');
      await setCurrentUserEmail(validationResult.data.email);
      // Reset tutorial flag for new users so they see the tutorial
      await resetTutorial();
      router.replace('/(session)/onboarding');
    } catch (error: unknown) {
      console.error('Error registering user:', error);

      if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
        Alert.alert(t('common.error'), t('auth.errors.emailAlreadyRegistered'));
      } else {
        Alert.alert(t('common.error'), t('auth.errors.registrationFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'login') {
      handleLogin(email, password);
    } else {
      handleRegister(email, password);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
              <View style={styles.languageRow}>
                <LanguageSelector />
              </View>

              <Text style={styles.welcomeText}>{t('auth.welcome')}</Text>

              <View style={styles.tabContainer}>
              <Pressable
                onPress={() => {
                  setActiveTab('login');
                  setEmail('');
                  setPassword('');
                  setErrors({});
                }}
                style={[
                  styles.tab,
                  activeTab === 'login' && styles.tabActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'login' && styles.tabTextActive,
                  ]}
                >
                  {t('auth.tabs.login')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActiveTab('register');
                  setEmail('');
                  setPassword('');
                  setErrors({});
                }}
                style={[
                  styles.tab,
                  activeTab === 'register' && styles.tabActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'register' && styles.tabTextActive,
                  ]}
                >
                  {t('auth.tabs.register')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.fields.email')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder={t('auth.fields.emailPlaceholder')}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                style={[
                  styles.input,
                  errors.email && styles.inputError,
                ]}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.fields.password')}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={true}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                maxLength={50}
                onSubmitEditing={handleSubmit}
                style={[
                  styles.input,
                  errors.password && styles.inputError,
                ]}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || isGoogleLoading}
              style={({ pressed }) => [
                styles.submitButton,
                (isLoading || isGoogleLoading) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {activeTab === 'login'
                      ? t('auth.buttons.login')
                      : t('auth.buttons.register')}
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={handleGoogleAuth}
              disabled={!request || isLoading || isGoogleLoading}
              style={[
                styles.googleButton,
                (!request || isLoading || isGoogleLoading) && styles.buttonDisabled,
              ]}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <AntDesign name="google" size={20} color="#374151" />
                  <Text style={styles.googleButtonText}>
                    {t('auth.buttons.googleContinue')}
                  </Text>
                </>
              )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 48,
  },
  languageRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2d9a6e',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(45, 154, 110, 0.1)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2d9a6e',
    shadowColor: '#2d9a6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d9a6e',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8faf9',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 154, 110, 0.2)',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#2d9a6e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#2d9a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(45, 154, 110, 0.2)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 10,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
