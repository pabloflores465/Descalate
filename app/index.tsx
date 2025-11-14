import { View, Text, TextInput, Pressable, Dimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SQLite from 'expo-sqlite';

export default function HomeScreen() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function setUpDatabase() {
      try {
        console.log('starting database connection ...');
        const database = await SQLite.openDatabaseAsync('descalate.db');
        console.info('connection successfully established');

        await database.execAsync(
          'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, password TEXT)'
        );
        console.info('table created or verified successfully');

        database.getAllAsync('SELECT * FROM users').then((result) => {
          console.info(result);
        });

        setDb(database);
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    }
    setUpDatabase();
  }, []);

  const { width, height } = Dimensions.get('screen');

  const handleRegister = async (email: string, password: string) => {
    try {
      await db?.runAsync('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
      console.log('User registered successfully');
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9f5' }}>
      <StatusBar style="dark" hidden={false} translucent={true} />
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
          elevation: 10,
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10,
            color: '#333',
          }}
        >
          Bienvenido !!!
        </Text>
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
            borderColor: '#e0e0e0',
          }}
        />
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
          onSubmitEditing={() => console.log('Login')}
          style={{
            borderRadius: 9999,
            paddingVertical: 15,
            paddingHorizontal: 20,
            backgroundColor: '#f5f5f5',
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}
        />
        <Pressable
          onPress={() => handleRegister(email, password)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#4a7c59' : '#5a8c6a',
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 60,
            marginTop: 20,
            alignSelf: 'center',
            elevation: 3,
          })}
        >
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
      </View>
    </View>
  );
}
