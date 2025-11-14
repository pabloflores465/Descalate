# Welcome to Descalate App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## ⚠️ Important: Google OAuth Requires Development Build

**Google authentication DOES NOT work with Expo Go** due to custom URI scheme limitations. You must use a Development Build instead.

### Why Development Build is Required

Expo Go cannot handle custom URI schemes (like `descalate://`) which are required for OAuth redirects. When you try to use Google Sign-In in Expo Go, you'll get redirect URI errors because it tries to use local IP addresses (`exp://192.168.x.x:8081`) instead of the proper OAuth redirect URI.

### Running with Development Build

**Option 1: Local Development Build (Recommended)**

```bash
# For iOS (requires macOS with Xcode)
npx expo run:ios

# For Android (requires Android Studio)
npx expo run:android
```

This will:

- Build a native development version of your app
- Install it on your simulator/emulator or physical device
- Start the Metro bundler
- Enable Google OAuth with the proper `descalate://` URI scheme

**Option 2: EAS Build (Cloud Build)**

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Create a development build for iOS
eas build --profile development --platform ios

# Or for Android
eas build --profile development --platform android
```

After the build completes, download and install it on your device, then:

```bash
# Start the development server
npx expo start --dev-client
```

### Development vs Expo Go Comparison

| Feature            | Expo Go                | Development Build         |
| ------------------ | ---------------------- | ------------------------- |
| Google OAuth       | ❌ No                  | ✅ Yes                    |
| Custom URI Schemes | ❌ Limited             | ✅ Full Support           |
| Native Modules     | ❌ Pre-configured only | ✅ Any module             |
| Build Time         | ⚡ Instant             | 🐌 5-20 minutes           |
| Best For           | Quick prototyping      | Production-ready features |

### Troubleshooting OAuth Issues

If you see errors like:

- `Error 400: invalid_request`
- `redirect_uri=exp://192.168.x.x:8081`
- `redirect_uri=exp://wlbzvrg-pablo_flores_465-8081.exp.direct`

**Solution:** You're using Expo Go. Switch to a Development Build as described above.

### Correct Redirect URIs for Google Console

When using Development Builds, ensure these redirect URIs are configured in Google Cloud Console:

**Web Client ID:**

```
https://auth.expo.io/@pablo_flores_465/descalate
```

**iOS Client ID:**

- No redirect URI needed (handled by native app)

**Android Client ID:**

- No redirect URI needed (handled by native app)

## Project Configuration

### Package Identifiers

**Android:**

```
Package Name: com.pablo.descalate
```

**iOS:**

```
Bundle Identifier: com.pablo.descalate
```

Package Name: com.anonymous.descalate

```

**iOS:**

```

Bundle Identifier: com.anonymous.descalate

````

### Google OAuth Setup

This app uses Google Sign-In for authentication. Here's how to verify and configure it:

#### 1. Verify Package Name/Bundle ID

**Check Android package name:**

```bash
npx expo config --type public | grep package
````

**Check iOS bundle identifier:**

```bash
npx expo config --type public | grep bundleIdentifier
```

Or manually check in `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.pablo.descalate"
    },
    "ios": {
      "bundleIdentifier": "com.pablo.descalate"
    }
  }
}
```

#### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Create OAuth 2.0 Client IDs for each platform:

**How to get required values:**

| Field                    | Where to find it                                                  | Example                 |
| ------------------------ | ----------------------------------------------------------------- | ----------------------- |
| **Android Package Name** | `app.json` → `android.package`                                    | `com.pablo.descalate`   |
| **iOS Bundle ID**        | `app.json` → `ios.bundleIdentifier`                               | `com.pablo.descalate`   |
| **iOS Team ID**          | [Apple Developer Membership](https://developer.apple.com/account) | `AB12CD34EF` (optional) |
| **iOS App Store ID**     | App Store Connect (after publishing)                              | Leave empty for now     |
| **SHA-1 Fingerprint**    | See section below                                                 | `9C:D8:C6:4F:...`       |

**Android Client:**

- Application type: `Android`
- Package name: `com.pablo.descalate`
- SHA-1 certificate fingerprint: See below

**iOS Client:**

- Application type: `iOS`
- Bundle ID: `com.pablo.descalate`
- App Store ID: _Leave empty_ (only needed after publishing)
- Team ID: _Optional_ (only if you have Apple Developer account)

**Web Client (for Expo Go):**

- Application type: `Web application`
- Authorized JavaScript origins: _Leave empty_
- Authorized redirect URIs (add these 3):
  ```
  https://auth.expo.io/@pablo_flores_465/descalate
  http://localhost:19006
  https://localhost
  ```

**Your Expo username:** `pablo_flores_465`

To verify or check in the future:

```bash
npx expo whoami
```

**Important:**

- Web Clients ONLY accept `http://` and `https://` URIs
- Custom schemes like `descalate://` are NOT valid for Web Clients
- They are only valid for Android/iOS clients in production builds
  https://auth.expo.io/@pablo_flores_465/descalate
  http://localhost:19006
  https://localhost

````

**Your Expo username:** `pablo_flores_465`

To verify or check in the future:

```bash
npx expo whoami
````

#### 3. Get SHA-1 Certificate Fingerprint

**For Development (Expo Go):**

```
SHA-1: 9C:D8:C6:4F:75:98:97:75:CE:2E:9B:D0:F7:23:1F:70:7C:3A:7E:8D
```

This is Expo's debug keystore SHA-1 - use it for initial testing.

**For Production (EAS Build):**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# View credentials
eas credentials
```

**Alternative - Using keytool:**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### 5. How to Get iOS Team ID

**If you DON'T have an Apple Developer account:**

- Leave the Team ID field **empty** - it's optional for development
- Google OAuth will still work for testing with Expo Go

**If you HAVE an Apple Developer account:**

**Method 1 - Apple Developer Portal:**

1. Go to [https://developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Click on **Membership** in the sidebar
4. Your **Team ID** will be displayed (10 alphanumeric characters)
   - Example: `AB12CD34EF`

**Method 2 - Using Xcode (macOS only):**

1. Open Xcode
2. Go to **Xcode** → **Preferences** → **Accounts**
3. Select your Apple ID
4. Click on your team name
5. The Team ID appears next to the team name

**Method 3 - Using EAS CLI:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login and view credentials
eas credentials

# Your Team ID will be shown in the iOS credentials
```

**Note:** The Team ID is only required if you plan to:

- Build standalone iOS apps
- Publish to App Store
- Use Apple Developer features

For development with Expo Go, you can skip this field.

#### 4. Login to Expo (Required)

Before configuring the Web Client, you need to know your Expo username:

```bash
# Login to Expo
npx expo login

# Verify your username
npx expo whoami
```

Your Expo username will be used in the Web Client redirect URI:

```
https://auth.expo.io/@YOUR-USERNAME/descalate
```

#### 5. Configuration Files

**Already configured!** The following files have been created:

**`constants/google-config.ts`** - OAuth Client IDs

```typescript
export const GOOGLE_CONFIG = {
  webClientId: '435201606498-qu4j1lm3oarqrtf6gq1hal3j305s9i2q.apps.googleusercontent.com',
  iosClientId: '435201606498-7fkuennuhmg3am4h51jc711l06ijiq91.apps.googleusercontent.com',
  androidClientId: '435201606498-q0594tfv24pqluq9o90a1q956e6r8p8q.apps.googleusercontent.com',
};
```

**`hooks/useGoogleAuth.ts`** - Custom hook for Google authentication

- Handles OAuth flow
- Fetches user information
- Manages authentication state

### How to Verify Configuration

**Check all config values at once:**

```bash
npx expo config --type public
```

**View specific sections:**

```bash
# Android config
npx expo config --type public | grep -A 10 "android"

# iOS config
npx expo config --type public | grep -A 10 "ios"
```

## Google Sign-In Usage

### Basic Implementation

```typescript
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function LoginScreen() {
  const { promptAsync, userInfo, loading, request } = useGoogleAuth();

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <View>
      <Pressable
        onPress={handleGoogleLogin}
        disabled={!request || loading}
      >
        <Text>Sign in with Google</Text>
      </Pressable>

      {userInfo && (
        <View>
          <Text>Welcome {userInfo.name}</Text>
          <Image source={{ uri: userInfo.picture }} />
        </View>
      )}
    </View>
  );
}
```

### User Info Response

After successful login, `userInfo` contains:

```typescript
{
  id: string; // Google user ID
  email: string; // User's email
  verified_email: boolean; // Email verification status
  name: string; // Full name
  given_name: string; // First name
  family_name: string; // Last name
  picture: string; // Profile picture URL
  locale: string; // User's locale (e.g., "es")
}
```

### Integration with SQLite

To save Google users to your database:

```typescript
useEffect(() => {
  if (userInfo && db) {
    const { email, name, picture, id } = userInfo;
    db.runAsync(
      'INSERT OR REPLACE INTO users (email, name, picture, google_id) VALUES (?, ?, ?, ?)',
      [email, name, picture, id]
    ).then(() => {
      console.log('✅ User saved to database');
    });
  }
}, [userInfo, db]);
```

**Update your users table schema:**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  picture TEXT,
  google_id TEXT UNIQUE
);
```

**View specific sections:**

```bash
# Android config
npx expo config --type public | grep -A 10 "android"

# iOS config
npx expo config --type public | grep -A 10 "ios"
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

# 🍎 Integración de Apple Login

## Paso a Paso para Implementar Sign In with Apple

### 📋 Prerequisitos

- **Cuenta de Apple Developer** ($99/año)
- **macOS** (requerido para configuración completa)
- **Xcode** instalado
- **Expo SDK 50+**

---

### 1️⃣ Configuración en Apple Developer

#### 1.1 Crear un App ID

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Ve a **Certificates, Identifiers & Profiles**
3. Selecciona **Identifiers** → Click en **+** (crear nuevo)
4. Selecciona **App IDs** → Click **Continue**
5. Selecciona **App** → Click **Continue**
6. Configura:
   - **Description:** `Descalate App`
   - **Bundle ID:** Explicit → `com.pablo.descalate` (debe coincidir con tu `app.json`)
   - **Capabilities:** Marca ✅ **Sign In with Apple**
7. Click **Continue** → **Register**

#### 1.2 Crear un Service ID (para Web)

1. En **Identifiers** → Click **+** (crear nuevo)
2. Selecciona **Services IDs** → Click **Continue**
3. Configura:
   - **Description:** `Descalate Web Service`
   - **Identifier:** `com.pablo.descalate.service` (debe ser único)
4. Click **Continue** → **Register**
5. Click en el Service ID recién creado
6. Marca ✅ **Sign In with Apple**
7. Click **Configure** junto a "Sign In with Apple"
8. Configura:
   - **Primary App ID:** Selecciona `com.pablo.descalate`
   - **Website URLs:**
     - **Domains:** `auth.expo.io`
     - **Return URLs:** `https://auth.expo.io/@pablo_flores_465/descalate`
9. Click **Save** → **Continue** → **Save**

#### 1.3 Crear una Key para Sign In with Apple

1. Ve a **Keys** → Click **+** (crear nueva)
2. Configura:
   - **Key Name:** `Descalate Apple Sign In Key`
   - Marca ✅ **Sign In with Apple**
   - Click **Configure** → Selecciona tu App ID principal
3. Click **Continue** → **Register**
4. **⚠️ IMPORTANTE:** Descarga el archivo `.p8` - **solo podrás descargarlo una vez**
5. Anota:
   - **Key ID:** (10 caracteres, ej: `AB12CD34EF`)
   - **Team ID:** (visible en la esquina superior derecha)

---

### 2️⃣ Configuración en tu Proyecto Expo

#### 2.1 Instalar Dependencias

```bash
npx expo install expo-apple-authentication
```

#### 2.2 Actualizar `app.json`

Agrega la configuración de Apple en tu `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.pablo.descalate",
      "usesAppleSignIn": true,
      "entitlements": {
        "com.apple.developer.applesignin": ["Default"]
      }
    },
    "plugins": [["expo-apple-authentication"]]
  }
}
```

#### 2.3 Crear Hook Personalizado

Crea el archivo `hooks/useAppleAuth.ts`:

```typescript
import { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

interface AppleUserInfo {
  user: string; // Unique Apple user ID
  email: string | null;
  fullName?: {
    givenName: string | null;
    familyName: string | null;
  };
  identityToken: string;
  authorizationCode: string;
}

export const useAppleAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [userInfo, setUserInfo] = useState<AppleUserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    if (Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAvailable(available);
    }
  };

  const signIn = async () => {
    if (!isAvailable) {
      console.warn('Apple Authentication is not available on this device');
      return null;
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const user: AppleUserInfo = {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken!,
        authorizationCode: credential.authorizationCode!,
      };

      setUserInfo(user);
      return user;
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Sign In error:', error);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUserInfo(null);
  };

  return {
    signIn,
    signOut,
    userInfo,
    loading,
    isAvailable,
  };
};
```

---

### 3️⃣ Implementación en tu UI

#### 3.1 Ejemplo Básico

```typescript
import { useAppleAuth } from '@/hooks/useAppleAuth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { View, Text, Alert } from 'react-native';

export default function LoginScreen() {
  const { signIn, userInfo, loading, isAvailable } = useAppleAuth();

  const handleAppleLogin = async () => {
    const user = await signIn();
    if (user) {
      Alert.alert('Success', `Welcome ${user.email || 'User'}!`);
      // Aquí puedes guardar en SQLite o hacer llamada a tu API
    }
  };

  if (!isAvailable) {
    return null; // No mostrar el botón si no está disponible
  }

  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 200, height: 44 }}
        onPress={handleAppleLogin}
      />

      {userInfo && (
        <View>
          <Text>User ID: {userInfo.user}</Text>
          <Text>Email: {userInfo.email || 'Not provided'}</Text>
          <Text>
            Name: {userInfo.fullName?.givenName} {userInfo.fullName?.familyName}
          </Text>
        </View>
      )}
    </View>
  );
}
```

---

### 4️⃣ Integración con SQLite

#### 4.1 Actualizar Schema de Base de Datos

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  picture TEXT,
  google_id TEXT UNIQUE,
  apple_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'email'
);
```

#### 4.2 Guardar Usuario de Apple

```typescript
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { useEffect } from 'react';

export default function LoginScreen() {
  const { signIn, userInfo } = useAppleAuth();
  const db = useSQLiteContext(); // Tu contexto de base de datos

  useEffect(() => {
    if (userInfo && db) {
      const fullName = userInfo.fullName
        ? `${userInfo.fullName.givenName || ''} ${userInfo.fullName.familyName || ''}`.trim()
        : null;

      db.runAsync(
        `INSERT OR REPLACE INTO users (email, name, apple_id, auth_provider) 
         VALUES (?, ?, ?, ?)`,
        [
          userInfo.email || `${userInfo.user}@privaterelay.appleid.com`,
          fullName || 'Apple User',
          userInfo.user,
          'apple',
        ]
      ).then(() => {
        console.log('✅ Apple user saved to database');
      });
    }
  }, [userInfo, db]);

  // ... resto del código
}
```

---

### 5️⃣ Construir y Probar

#### ⚠️ IMPORTANTE: NO funciona en Expo Go

Apple Sign In **requiere un Development Build**, similar a Google OAuth.

#### Opción 1: Build Local (Requiere macOS)

```bash
# Para iOS
npx expo run:ios
```

#### Opción 2: EAS Build (Cloud)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure

# Build de desarrollo para iOS
eas build --profile development --platform ios
```

Después de que el build termine:

```bash
# Descargar e instalar el .ipa en tu dispositivo iOS
# Luego iniciar el servidor de desarrollo
npx expo start --dev-client
```

---

### 6️⃣ Estilos de Botón Disponibles

Apple proporciona botones estandarizados que debes usar:

```typescript
// Tipos de Botón
AppleAuthenticationButtonType.SIGN_IN; // "Sign in with Apple"
AppleAuthenticationButtonType.SIGN_UP; // "Sign up with Apple"
AppleAuthenticationButtonType.CONTINUE; // "Continue with Apple"

// Estilos
AppleAuthenticationButtonStyle.BLACK; // Fondo negro, texto blanco
AppleAuthenticationButtonStyle.WHITE; // Fondo blanco, texto negro
AppleAuthenticationButtonStyle.WHITE_OUTLINE; // Borde blanco, fondo transparente
```

---

### 7️⃣ Manejo de Casos Especiales

#### 7.1 Email Privado (Hide My Email)

Apple permite a los usuarios ocultar su email real. Recibirás un email como:

```
abc123xyz@privaterelay.appleid.com
```

**⚠️ IMPORTANTE:**

- Este email es válido y funcional
- Los correos enviados a esta dirección se reenvían al usuario
- El usuario puede desactivar el reenvío en cualquier momento
- **Debes tratarlo como un email real** en tu sistema

#### 7.2 Información del Nombre

**⚠️ CRÍTICO:** Apple solo proporciona el nombre **la primera vez** que el usuario inicia sesión.

**Estrategia recomendada:**

```typescript
const handleAppleLogin = async () => {
  const user = await signIn();

  if (user) {
    // Verificar si ya existe en la base de datos
    const existingUser = await db.getFirstAsync('SELECT * FROM users WHERE apple_id = ?', [
      user.user,
    ]);

    if (!existingUser) {
      // Primera vez - guardar nombre
      const fullName = user.fullName
        ? `${user.fullName.givenName || ''} ${user.fullName.familyName || ''}`
        : null;

      // Guardar en base de datos
      await saveToDatabase(user.email, fullName, user.user);
    } else {
      // Usuario existente - usar datos guardados
      console.log('Welcome back!', existingUser.name);
    }
  }
};
```

#### 7.3 Verificación del Estado del Usuario

```typescript
const checkCredentialState = async (userID: string) => {
  try {
    const credentialState = await AppleAuthentication.getCredentialStateAsync(userID);

    switch (credentialState) {
      case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
        console.log('User is authorized');
        break;
      case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
        console.log('User revoked authorization');
        // Cerrar sesión del usuario
        break;
      case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
        console.log('Credential not found');
        break;
    }
  } catch (error) {
    console.error('Error checking credential state:', error);
  }
};
```

---

### 8️⃣ Troubleshooting

#### Problema: "Sign In with Apple is not available"

**Soluciones:**

1. Verifica que estás en un dispositivo iOS (no Android)
2. Verifica que el dispositivo tenga iOS 13+
3. Confirma que estás usando un Development Build (no Expo Go)
4. Verifica que `usesAppleSignIn: true` está en `app.json`

#### Problema: "Invalid client"

**Soluciones:**

1. Verifica que el Bundle ID coincide:
   - `app.json` → `ios.bundleIdentifier`
   - Apple Developer → App ID
2. Confirma que Sign In with Apple está habilitado en el App ID
3. Verifica que el Service ID está correctamente configurado

#### Problema: No recibo email o nombre

**Soluciones:**

1. **Email:** El usuario puede haber elegido "Hide My Email"
2. **Nombre:** Apple solo lo envía la primera vez
   - Elimina la app y vuelve a instalar para probarlo de nuevo
   - Ve a Ajustes → Apple ID → Contraseña y Seguridad → Apps usando Apple ID → Elimina tu app

---

### 9️⃣ Recursos Adicionales

- [Expo Apple Authentication Docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Apple Sign In Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Apple Developer Documentation](https://developer.apple.com/documentation/sign_in_with_apple)

---

### 🔒 Mejores Prácticas de Seguridad

1. **Valida el `identityToken` en tu backend** usando las claves públicas de Apple
2. **Guarda el `user` ID** (es permanente e inmutable para tu app)
3. **No dependas solo del email** - puede cambiar o ser revocado
4. **Implementa un mecanismo de actualización de email** en tu app
5. **Verifica periódicamente el estado de la credencial** para detectar revocaciones

---

### ✅ Checklist de Implementación

- [ ] Cuenta de Apple Developer activa
- [ ] App ID creado con Sign In with Apple habilitado
- [ ] Service ID creado y configurado
- [ ] Key descargada y guardada de forma segura
- [ ] `expo-apple-authentication` instalado
- [ ] `app.json` actualizado con configuración iOS
- [ ] Hook `useAppleAuth.ts` creado
- [ ] UI implementada con botones oficiales de Apple
- [ ] Schema de base de datos actualizado
- [ ] Development Build creado (no Expo Go)
- [ ] Manejo de "Hide My Email" implementado
- [ ] Guardado de nombre en primera autenticación
- [ ] Verificación de estado de credenciales implementada
