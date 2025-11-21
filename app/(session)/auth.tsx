import {
  View,
  Text,
  TextInput,
  Pressable,
  Dimensions,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useState, useEffect } from 'react';
import { db, expoDb } from '@/database/db';
import { users, registerUserSchema, loginUserSchema, googleUserSchema } from '@/database/schema';
import { runMigrations } from '@/database/migrations';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

bcrypt.setRandomFallback((len: number) => {
  const randomBytes = Crypto.getRandomBytes(len);
  return Array.from(randomBytes);
});

export default function AuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const { promptAsync, userInfo, request } = useGoogleAuth();

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
                'Usuario no encontrado',
                'No existe una cuenta con este correo. Por favor registrate primero.',
                [{ text: 'OK' }]
              );
              return;
            }

            console.log('Google user logged in successfully');
            router.push('/home');
          } else {
            const validationResult = googleUserSchema.safeParse({
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              google_id: userInfo.id,
            });

            if (!validationResult.success) {
              console.error('Validation error:', validationResult.error);
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
            router.push('/home');
          }
        } catch (error) {
          console.error('Error handling Google user:', error);
          Alert.alert('Error', 'Fallo al autenticar con Google');
        } finally {
          setIsGoogleLoading(false);
        }
      };
      handleGoogleUser();
    }
  }, [userInfo, router, activeTab]);

  const { width, height } = Dimensions.get('screen');

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
        Alert.alert('Error de validacion', Object.values(errorMessages).join('\n'));
        setIsLoading(false);
        return;
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validationResult.data.email))
        .limit(1);

      if (existingUser.length === 0) {
        Alert.alert('Error', 'Correo o contraseña invalidos');
        setIsLoading(false);
        return;
      }

      const user = existingUser[0];

      if (!user.password) {
        Alert.alert(
          'Error',
          'Esta cuenta fue creada con Google. Por favor inicia sesion con Google.'
        );
        setIsLoading(false);
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        Alert.alert('Error', 'Correo o contraseña invalidos');
        setIsLoading(false);
        return;
      }

      console.log('User logged in successfully');
      Alert.alert('Exito', 'Sesion iniciada exitosamente');
      router.push('/home');
    } catch (error: any) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Fallo al iniciar sesion');
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
        Alert.alert('Error de validacion', Object.values(errorMessages).join('\n'));
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
      Alert.alert('Exito', 'Cuenta creada exitosamente');
      router.push('/home');
    } catch (error: any) {
      console.error('Error registering user:', error);

      if (error.message?.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'Este correo ya esta registrado');
      } else {
        Alert.alert('Error', 'Fallo al crear la cuenta');
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
    <ImageBackground
      source={require('../../assets/images/descalate3.jpeg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
        <Polygon points={`${width},${height / 2} 0,${height / 2} ${width},0`} fill={Colors.surfaceElevated} />
        <Polygon points={`0,${height} 0,${height / 2} ${width},${height / 2}`} fill={Colors.surfaceElevated} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: [{ translateY: -200 }],
          height: 450,
          backgroundColor: Colors.surfaceElevated,
          padding: 30,
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            marginBottom: Spacing.xl,
            borderRadius: BorderRadius.round,
            backgroundColor: Colors.input.background,
            padding: 4,
          }}
        >
          <Pressable
            onPress={() => {
              setActiveTab('login');
              setEmail('');
              setPassword('');
              setErrors({});
            }}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.round,
              backgroundColor: activeTab === 'login' ? Colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: FontSize.md,
                fontWeight: 'bold',
                color: activeTab === 'login' ? Colors.white : Colors.text.secondary,
              }}
            >
              Iniciar sesion
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTab('register');
              setEmail('');
              setPassword('');
              setErrors({});
            }}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.round,
              backgroundColor: activeTab === 'register' ? Colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: FontSize.md,
                fontWeight: 'bold',
                color: activeTab === 'register' ? Colors.white : Colors.text.secondary,
              }}
            >
              Registrarse
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            marginTop: Spacing.sm,
            marginBottom: 5,
            marginHorizontal: Spacing.xl,
            fontSize: FontSize.md,
            color: Colors.text.secondary,
          }}
        >
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="ejemplo@gmail.com"
          placeholderTextColor={Colors.text.placeholder}
          autoCapitalize="none"
          style={{
            borderRadius: BorderRadius.round,
            paddingVertical: 15,
            paddingHorizontal: Spacing.xl,
            backgroundColor: Colors.input.background,
            fontSize: FontSize.md,
            borderWidth: 1,
            borderColor: errors.email ? Colors.input.borderError : Colors.input.border,
            color: Colors.text.primary,
          }}
        />
        {errors.email && (
          <Text style={{ color: Colors.status.error, marginTop: 5, marginHorizontal: Spacing.xl }}>{errors.email}</Text>
        )}

        <Text
          style={{
            marginTop: Spacing.sm,
            marginBottom: 5,
            marginHorizontal: Spacing.xl,
            fontSize: FontSize.md,
            color: Colors.text.secondary,
          }}
        >
          Contraseña
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={Colors.text.placeholder}
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          maxLength={50}
          onSubmitEditing={handleSubmit}
          style={{
            borderRadius: BorderRadius.round,
            paddingVertical: 15,
            paddingHorizontal: Spacing.xl,
            backgroundColor: Colors.input.background,
            fontSize: FontSize.md,
            borderWidth: 1,
            borderColor: errors.password ? Colors.input.borderError : Colors.input.border,
            color: Colors.text.primary,
          }}
        />
        {errors.password && (
          <Text style={{ color: Colors.status.error, marginTop: 5, marginHorizontal: Spacing.xl }}>
            {errors.password}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading || isGoogleLoading}
          style={({ pressed }) => ({
            backgroundColor:
              isLoading || isGoogleLoading ? Colors.text.disabled : pressed ? Colors.primaryDark : Colors.primary,
            borderRadius: BorderRadius.round,
            paddingVertical: Spacing.lg,
            paddingHorizontal: Spacing.massive,
            marginTop: Spacing.xl,
            marginBottom: Spacing.xl,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading || isGoogleLoading ? 0.6 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: Spacing.sm }} />
          ) : (
            <AntDesign
              name="login"
              size={20}
              color={Colors.white}
              style={{ marginRight: Spacing.sm, fontWeight: 'bold' }}
            />
          )}
          <Text
            style={{
              color: Colors.white,
              fontSize: FontSize.lg,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {isLoading
              ? activeTab === 'login'
                ? 'Iniciando sesion...'
                : 'Registrando...'
              : activeTab === 'login'
              ? 'Iniciar sesion'
              : 'Registrarse'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoogleAuth}
          disabled={!request || isLoading || isGoogleLoading}
          style={{
            backgroundColor: !request || isLoading || isGoogleLoading ? Colors.text.disabled : Colors.google,
            borderRadius: BorderRadius.round,
            padding: 15,
            marginTop: Spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !request || isLoading || isGoogleLoading ? 0.6 : 1,
          }}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: Spacing.sm }} />
          ) : (
            <AntDesign name="google" size={20} color={Colors.white} style={{ marginRight: Spacing.sm }} />
          )}
          <Text style={{ color: Colors.white, textAlign: 'center', fontSize: FontSize.md, fontWeight: 'bold' }}>
            {isGoogleLoading ? 'Cargando...' : 'Continuar con Google'}
          </Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
