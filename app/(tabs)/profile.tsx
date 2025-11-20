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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { db } from '@/database/db';
import { users, type User } from '@/database/schema';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { eq } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const allUsers = await db.select().from(users).limit(1);

      if (allUsers.length > 0) {
        const userData = allUsers[0];
        setUser(userData);
        setName(userData.name || '');
        setAge(userData.age?.toString() || '');
        setGender(userData.gender || '');

        if (!hasNewImage) {
          if (userData.profile_image) {
            const base64Image = `data:image/jpeg;base64,${userData.profile_image.toString('base64')}`;
            setProfileImageUri(base64Image);
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
      loadUserData();
    }, [])
  );

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to change your profile picture');
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      setIsSaving(true);

      if (!name.trim()) {
        Alert.alert('Error', 'Name is required');
        setIsSaving(false);
        return;
      }

      const ageNumber = age ? parseInt(age) : null;
      if (age && (isNaN(ageNumber!) || ageNumber! < 1 || ageNumber! > 150)) {
        Alert.alert('Error', 'Please enter a valid age');
        setIsSaving(false);
        return;
      }

      let imageBuffer: Buffer | null = null;

      if (profileImageUri && !profileImageUri.startsWith('data:image')) {
        const base64 = await FileSystem.readAsStringAsync(profileImageUri, {
          encoding: 'base64',
        });
        imageBuffer = Buffer.from(base64, 'base64');
      } else if (profileImageUri && profileImageUri.startsWith('data:image')) {
        const base64Data = profileImageUri.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      }

      const updateData: any = {
        name: name.trim(),
        age: ageNumber,
        gender: gender.trim() || null,
      };

      if (imageBuffer) {
        updateData.profile_image = imageBuffer;
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.email, user.email));

      setHasNewImage(false);
      Alert.alert('Success', 'Profile updated successfully');
      loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      '¿Estas seguro que quieres cerrar sesion?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: () => {
            router.replace('/(session)/auth');
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5a8c6a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
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
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <Pressable
                style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
                onPress={() => setGender('Male')}
              >
                <Ionicons name="male" size={20} color={gender === 'Male' ? 'white' : '#5a8c6a'} />
                <Text style={[styles.genderButtonText, gender === 'Male' && styles.genderButtonTextActive]}>
                  Male
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
                onPress={() => setGender('Female')}
              >
                <Ionicons name="female" size={20} color={gender === 'Female' ? 'white' : '#5a8c6a'} />
                <Text style={[styles.genderButtonText, gender === 'Female' && styles.genderButtonTextActive]}>
                  Female
                </Text>
              </Pressable>

              <Pressable
                style={[styles.genderButton, gender === 'Other' && styles.genderButtonActive]}
                onPress={() => setGender('Other')}
              >
                <Ionicons name="transgender" size={20} color={gender === 'Other' ? 'white' : '#5a8c6a'} />
                <Text style={[styles.genderButtonText, gender === 'Other' && styles.genderButtonTextActive]}>
                  Other
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
              <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: pressed ? '#d63031' : '#e74c3c' },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Log Out</Text>
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
  email: {
    fontSize: 15,
    color: '#7F8C8D',
    fontWeight: '500',
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
    fontSize: 16,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 50,
    paddingVertical: 15,
    marginTop: 20,
    gap: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
