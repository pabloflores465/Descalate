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
import { users, loginUserSchema } from '@/database/schema';
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

export default function LoginScreen() {
  const router = useRouter();

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

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo && db) {
      const loginWithGoogle = async () => {
        setIsGoogleLoading(true);
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, userInfo.email))
            .limit(1);

          if (existingUser.length === 0) {
            Alert.alert(
              'User not found',
              'No account exists with this email. Please register first.',
              [{ text: 'OK' }]
            );
            return;
          }

          console.log('Google user logged in successfully');
          router.push('/home');
        } catch (error) {
          console.error('Error logging in with Google:', error);
          Alert.alert('Error', 'Failed to login with Google');
        } finally {
          setIsGoogleLoading(false);
        }
      };
      loginWithGoogle();
    }
  }, [userInfo, router]);

  const { width, height } = Dimensions.get('screen');

  console.log('Render - isLoading:', isLoading, 'isGoogleLoading:', isGoogleLoading);

  const handleLogin = async (email: string, password: string) => {
    console.log('Setting loading to true');
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
        Alert.alert('Validation Error', Object.values(errorMessages).join('\n'));
        setIsLoading(false);
        return;
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validationResult.data.email))
        .limit(1);

      if (existingUser.length === 0) {
        Alert.alert('Error', 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      const user = existingUser[0];

      if (!user.password) {
        Alert.alert('Error', 'This account was created with Google. Please login with Google.');
        setIsLoading(false);
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        Alert.alert('Error', 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      console.log('User logged in successfully');
      Alert.alert('Success', 'Logged in successfully');
      router.push('/home');
    } catch (error: any) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Failed to login');
    } finally {
      setIsLoading(false);
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
          transform: [{ translateY: -150 }],
          height: 350,
          backgroundColor: Colors.surfaceElevated,
          padding: 30,
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
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
          onSubmitEditing={() => handleLogin(email, password)}
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
          onPress={() => handleLogin(email, password)}
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
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoogleLogin}
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
