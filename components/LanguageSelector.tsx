import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@descalate_language';

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'es', name: 'Espanol', flag: 'ES' },
  { code: 'en', name: 'English', flag: 'EN' },
];

type LanguageSelectorProps = {
  style?: object;
};

export default function LanguageSelector({ style }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      setModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        <Text style={styles.languageName}>{currentLanguage.name}</Text>
        <Ionicons name="chevron-down" size={16} color="#566573" />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {i18n.language === 'es' ? 'Seleccionar idioma' : 'Select language'}
            </Text>
            {languages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageOption,
                  language.code === i18n.language && styles.languageOptionActive,
                ]}
                onPress={() => changeLanguage(language.code)}
              >
                <Text style={styles.optionFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.optionName,
                    language.code === i18n.language && styles.optionNameActive,
                  ]}
                >
                  {language.name}
                </Text>
                {language.code === i18n.language && (
                  <Ionicons name="checkmark" size={20} color="#5a8c6a" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  flag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5a8c6a',
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#5a8c6a',
  },
  optionFlag: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5a8c6a',
  },
  optionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  optionNameActive: {
    fontWeight: '700',
    color: '#5a8c6a',
  },
});
