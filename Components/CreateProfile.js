// Components/CreateProfile.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* Chicken/Gold palette (как на изображении с цыплёнком) */
const THEME = {
  gold:    '#FFC83D',                 // тёплый золотой контур/акцент
  gold2:   '#FFE08A',                 // светлый золотой для заголовков/активных точек
  outline: '#D7A02E',                 // золотисто-янтарная обводка
  text:    '#FFFFFF',
  card:    'rgba(24,14,0,0.92)',      // тёмно-коричневый контейнер
  glow:    '#FF8A00',                 // мягкое янтарное свечение
};

const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

export default function CreateProfile({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [step, setStep] = useState(0); // 0 name, 1 gender, 2 pet
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [pet, setPet] = useState(route?.params?.preselectedPet ?? null);

  const canNext =
    (step === 0 && name.trim().length >= 2) ||
    (step === 1 && !!gender) ||
    (step === 2 && !!pet);

  const next = async () => {
    if (!canNext) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    try {
      const profile = { name: name.trim(), gender, pet };
      await AsyncStorage.setItem('@bsp_profile', JSON.stringify(profile));
    } catch (e) {
      Alert.alert('Note', 'Could not save profile locally.');
    }
    navigation.replace('Main');
  };

  const buttonLabel = step === 0 ? 'NEXT' : step === 1 ? 'CONTINUE' : 'FINAL';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <ImageBackground source={require('../assets/bg.webp')} style={styles.bg} resizeMode="cover">
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* header */}
              <View style={styles.header}>
                <Image source={require('../assets/Logo.webp')} style={styles.headerLogo} resizeMode="contain" />
                <Text style={styles.headerTitle}>REGISTRY</Text>
              </View>

              {/* STEP 0 — NAME */}
              {step === 0 && (
                <View style={styles.content}>
                  <Text style={styles.label}>YOUR NAME:</Text>
                  <View style={[styles.inputWrap, styles.shadowSoft]}>
                    <TextInput
                      placeholder="Enter name"
                      placeholderTextColor="rgba(255,235,180,0.6)"
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={next}
                    />
                  </View>
                  <PrimaryButton label={buttonLabel} disabled={!canNext} onPress={next} />
                </View>
              )}

              {/* STEP 1 — GENDER */}
              {step === 1 && (
                <View style={styles.content}>
                  <Text style={styles.label}>Choose gender:</Text>
                  <View style={styles.row}>
                    <SelectCard
                      title="Woman"
                      active={gender === 'woman'}
                      onPress={() => setGender('woman')}
                      img={require('../assets/woman.webp')}
                      extraStyle={[styles.cardW, styles.cardH]}
                    />
                    <SelectCard
                      title="Man"
                      active={gender === 'man'}
                      onPress={() => setGender('man')}
                      img={require('../assets/man.webp')}
                      extraStyle={[styles.cardW, styles.cardH]}
                    />
                  </View>
                  <PrimaryButton label={buttonLabel} disabled={!canNext} onPress={next} />
                </View>
              )}

              {/* STEP 2 — PET */}
              {step === 2 && (
                <View style={styles.content}>
                  <Text style={styles.label}>choose your own pet:</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.petsScroll}
                    contentContainerStyle={styles.hRow}
                    keyboardShouldPersistTaps="handled"
                    decelerationRate="fast"
                  >
                    <PetCard
                      title="CHARLES"
                      active={pet === 'charles'}
                      onPress={() => setPet('charles')}
                      img={require('../assets/charles.webp')}
                      extraStyle={[styles.petCardW, styles.petH]}
                    />
                    <PetCard
                      title="KENNY"
                      active={pet === 'kenny'}
                      onPress={() => setPet('kenny')}
                      img={require('../assets/kenny.webp')}
                      extraStyle={[styles.petCardW, styles.petH]}
                    />
                    <PetCard
                      title="WONDER"
                      active={pet === 'wonder'}
                      onPress={() => setPet('wonder')}
                      img={require('../assets/wonder.webp')}
                      extraStyle={[styles.petCardW, styles.petH]}
                    />
                  </ScrollView>

                  <PrimaryButton label={buttonLabel} disabled={!canNext} onPress={next} />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

/* ───────── helpers ───────── */

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] }]}
    >
      <ImageBackground
        source={require('../assets/btn_big.webp')}
        resizeMode="stretch"
        capInsets={{ top: 24, left: 24, bottom: 24, right: 24 }}
        style={imgBtn.bg}
        imageStyle={imgBtn.image}
      >
        <Text style={imgBtn.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

function SelectCard({ title, img, active, onPress, extraStyle }) {
  return (
    <Pressable onPress={onPress} style={[cards.card, extraStyle, active && cards.active]}>
      <Text style={cards.cardTitle}>{title}</Text>
      <Image source={img} style={cards.cardImage} resizeMode="cover" />
    </Pressable>
  );
}

function PetCard({ title, img, active, onPress, extraStyle }) {
  return (
    <Pressable onPress={onPress} style={[cards.pet, extraStyle, active && cards.active]}>
      <Text style={cards.petTitle}>{title}</Text>
      <Image source={img} style={cards.petImage} resizeMode="cover" />
    </Pressable>
  );
}

/* ───────── styles ───────── */

function makeStyles(w, h) {
  const PAD = Math.min(24, Math.round(w * 0.06));
  const GAP = 12;
  const logoSize = 202;

  const colW = Math.round((w - PAD * 2 - GAP) / 2);

  const genderCardH = Math.max(320, Math.min(460, Math.round(h * 0.48)));
  const petCardH    = Math.max(240, Math.min(360, Math.round(h * 0.36)));

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg: { flex: 1 },

    scrollContainer: {
      minHeight: h,
      paddingBottom: 32,
    },

    header: { alignItems: 'center', paddingTop: 48, marginBottom: 12 },
    headerLogo: { width: logoSize, height: logoSize, marginBottom: 8 },
    headerTitle: {
      color: THEME.gold2,
      fontSize: 36,
      letterSpacing: 1,
      fontFamily: TITAN,
      textShadowColor: THEME.glow,
      textShadowRadius: 8,
    },

    content: { paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 12 },

    label: { color: THEME.text, fontSize: 20, marginBottom: 12, textTransform: 'uppercase', fontFamily: TITAN },

    inputWrap: {
      backgroundColor: THEME.card,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 22,
      borderWidth: 2,
      borderColor: THEME.outline,
    },
    input: { color: THEME.text, fontSize: 18, fontFamily: TITAN },

    row: { flexDirection: 'row', justifyContent: 'space-between', gap: GAP, marginBottom: 22 },

    petsScroll: { marginHorizontal: -PAD, marginBottom: 14 },
    hRow: { paddingHorizontal: PAD, flexDirection: 'row', alignItems: 'flex-start', gap: GAP },

    cardW: { width: colW },
    cardH: { height: genderCardH },

    petCardW: { width: colW },
    petH: { height: petCardH },

    /* тени */
    shadowSoft: {
      shadowColor: THEME.glow,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  });
}

/* кнопка: высота минимум 120 (128) */
const imgBtn = StyleSheet.create({
  bg: {
    height: 128,
    minWidth: 240,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
    marginTop: 8,
    borderRadius: 26,
  },
  image: { borderRadius: 26 },
  label: { color: '#1a1000', fontSize: 26, fontFamily: TITAN, letterSpacing: 0.5 }, // тёмный текст на золотой кнопке
});

/* карточки — тёплый тёмный фон + золотая обводка, актив — янтарное свечение */
const cards = StyleSheet.create({
  card: {
    backgroundColor: THEME.card,
    borderRadius: 22,
    padding: 12,
    borderWidth: 2,
    borderColor: THEME.outline,
    alignItems: 'center',
  },
  active: {
    borderColor: THEME.gold,
    shadowColor: THEME.glow,
    shadowOpacity: 0.65,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  cardTitle: { color: THEME.text, marginBottom: 8, fontSize: 16, fontFamily: TITAN },
  cardImage: { width: '100%', height: '92%', borderRadius: 16 },

  pet: {
    backgroundColor: THEME.card,
    borderRadius: 22,
    padding: 12,
    borderWidth: 2,
    borderColor: THEME.outline,
    alignItems: 'center',
  },
  petTitle: { color: THEME.text, marginBottom: 12, fontSize: 14, fontFamily: TITAN },
  petImage: { width: '100%', height: '82%', borderRadius: 16 },
});
