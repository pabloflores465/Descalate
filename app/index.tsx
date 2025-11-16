import { View, Text, TextInput, Pressable, Dimensions, ImageBackground, Alert } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useState, useEffect } from 'react';
import { openDatabaseSync } from 'expo-sqlite';
import { db } from '@/database/db';
import { users, registerUserSchema, googleUserSchema } from '@/database/schema';
import { runMigrations } from '@/database/migrations';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import bcrypt from 'bcryptjs';

export default function HomeScreen() {
  const router = useRouter();

  const goHome = () => {
    router.push('/home');
  };

  const { promptAsync, userInfo, request } = useGoogleAuth();

  useEffect(() => {
    async function setUpDatabase() {
      try {
        console.log('starting database connection ...');
        const expoDb = openDatabaseSync('descalate.db');
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

  const handleGoogleRegister = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  useEffect(() => {
    if (userInfo && db) {
      const saveGoogleUser = async () => {
        try {
          const validationResult = googleUserSchema.safeParse({
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            google_id: userInfo.id,
          });

          if (!validationResult.success) {
            console.error('Validation error:', validationResult.error.format());
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
          goHome();
        } catch (error) {
          console.error('Error saving Google user:', error);
        }
      };
      saveGoogleUser();
    }
  }, [userInfo]);

  const { width, height } = Dimensions.get('screen');

  const handleRegister = async (email: string, password: string) => {
    const hashPassword = async (password: string): Promise<string> => {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
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
        Alert.alert('Validation Error', Object.values(errorMessages).join('\n'));
        return;
      }

      const passwordHash = await hashPassword(password);
      console.info('password hashed successfully');

      await db.insert(users).values({
        email: validationResult.data.email,
        password: passwordHash,
        name: validationResult.data.name,
      });

      console.log('User registered successfully');
      Alert.alert('Success', 'Account created successfully');
      goHome();
    } catch (error: any) {
      console.error('Error registering user:', error);

      if (error.message?.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'This email is already registered');
      } else {
        Alert.alert('Error', 'Failed to create account');
      }
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/Descalate.jpeg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
        {/* Right Superior Triangle */}
        <Polygon points={`${width},${height / 2} 0,${height / 2} ${width},0`} fill="white" />
        {/* Left Inferior Triangle */}
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
          onSubmitEditing={() => handleRegister(email, password)}
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
          onPress={() => handleRegister(email, password)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#4a7c59' : '#5a8c6a',
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 60,
            marginTop: 20,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          })}
        >
          <AntDesign
            name="login"
            size={20}
            color="white"
            style={{ marginRight: 10, fontWeight: 'bold' }}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Registrarse
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoogleRegister}
          disabled={!request}
          style={{
            backgroundColor: '#4285F4',
            borderRadius: 50,
            padding: 15,
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AntDesign name="google" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
            Continuar con Google
          </Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
