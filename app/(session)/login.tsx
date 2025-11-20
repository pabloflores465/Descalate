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
        <Polygon points={`${width},${height / 2} 0,${height / 2} ${width},0`} fill="white" />
        <Polygon points={`0,${height} 0,${height / 2} ${width},${height / 2}`} fill="white" />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: [{ translateY: -150 }],
          height: 350,
          backgroundColor: 'white',
          padding: 30,
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <Text
          style={{
            marginTop: 10,
            marginBottom: 5,
            marginHorizontal: 20,
            fontSize: 16,
            color: 'gray',
          }}
        >
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="ejemplo@gmail.com"
          placeholderTextColor="#999"
          autoCapitalize="none"
          style={{
            borderRadius: 9999,
            paddingVertical: 15,
            paddingHorizontal: 20,
            backgroundColor: '#f5f5f5',
            fontSize: 16,
            borderWidth: 1,
            borderColor: errors.email ? 'red' : '#e0e0e0',
          }}
        />
        {errors.email && (
          <Text style={{ color: 'red', marginTop: 5, marginHorizontal: 20 }}>{errors.email}</Text>
        )}

        <Text
          style={{
            marginTop: 10,
            marginBottom: 5,
            marginHorizontal: 20,
            fontSize: 16,
            color: 'gray',
          }}
        >
          Contraseña
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#999"
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          maxLength={50}
          onSubmitEditing={() => handleLogin(email, password)}
          style={{
            borderRadius: 9999,
            paddingVertical: 15,
            paddingHorizontal: 20,
            backgroundColor: '#f5f5f5',
            fontSize: 16,
            borderWidth: 1,
            borderColor: errors.password ? 'red' : '#e0e0e0',
          }}
        />
        {errors.password && (
          <Text style={{ color: 'red', marginTop: 5, marginHorizontal: 20 }}>
            {errors.password}
          </Text>
        )}

        <Pressable
          onPress={() => handleLogin(email, password)}
          disabled={isLoading || isGoogleLoading}
          style={({ pressed }) => ({
            backgroundColor:
              isLoading || isGoogleLoading ? '#999' : pressed ? '#4a7c59' : '#5a8c6a',
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 60,
            marginTop: 20,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading || isGoogleLoading ? 0.6 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
          ) : (
            <AntDesign
              name="login"
              size={20}
              color="white"
              style={{ marginRight: 10, fontWeight: 'bold' }}
            />
          )}
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoogleLogin}
          disabled={!request || isLoading || isGoogleLoading}
          style={{
            backgroundColor: !request || isLoading || isGoogleLoading ? '#999' : '#4285F4',
            borderRadius: 50,
            padding: 15,
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !request || isLoading || isGoogleLoading ? 0.6 : 1,
          }}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
          ) : (
            <AntDesign name="google" size={20} color="white" style={{ marginRight: 10 }} />
          )}
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
            {isGoogleLoading ? 'Cargando...' : 'Continuar con Google'}
          </Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
