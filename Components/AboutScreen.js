// Components/AboutScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  Share,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* палитра под скрин (тёплый gold/amber на тёмном коричневом) */
const CHK = {
  panel:    '#1E1306',
  panelAlt: '#26180A',
  outline:  '#5A3B12',
  title:    '#FFE39A',
  text:     '#FFF2C9',
  subtext:  'rgba(255, 236, 200, 0.9)',
  gold:     '#FFC94A',
  amber:    '#FF9E2A',
  glow:     '#FFB000',
};

/* assets */
const BG        = require('../assets/bg1.webp');    // ФОН НЕ ПЕРЕКРЫВАЕМ
const ICON_BACK = require('../assets/icon_back.webp');
const LOGO      = require('../assets/Logo.webp');

const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });
const BODY  = Platform.select({ ios: undefined, android: 'sans-serif' });

/* ключи хранилища */
const STARS_KEY   = 'bsp:stars';
const QUESTS_KEY  = 'bsp:quests';
const PROFILE_KEY = '@bsp_profile';
const PET_LEVEL   = '@pet:level';

export default function AboutScreen({ navigation }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [appInfo, setAppInfo]   = useState(null);

  const onShare = useCallback(async () => {
    try {
      await Share.share({
        message: 'Chicken Star Buddy — turn tiny steps into shiny wins! 🐥⭐️',
        title: 'Chicken Star Buddy',
      });
    } catch {}
  }, []);

  // сводка из AsyncStorage
  const openInfo = useCallback(async () => {
    try {
      const [s, q, prof, lvl] = await Promise.all([
        AsyncStorage.getItem(STARS_KEY),
        AsyncStorage.getItem(QUESTS_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(PET_LEVEL),
      ]);

      let pet = '—';
      try {
        const p = prof ? JSON.parse(prof) : null;
        pet = p?.pet ? String(p.pet).charAt(0).toUpperCase() + String(p.pet).slice(1) : '—';
      } catch {}

      const quests = q ? JSON.parse(q) : [];
      setAppInfo({
        stars: Number(s || 0),
        questsCount: Array.isArray(quests) ? quests.length : 0,
        pet,
        level: Number(lvl || 1),
      });
    } catch {
      setAppInfo({ stars: 0, questsCount: 0, pet: '—', level: 1 });
    }
    setInfoOpen(true);
  }, []);

  const gradGold  = useMemo(() => [CHK.gold, CHK.amber], []);
  const gradAmber = useMemo(() => [CHK.amber, CHK.gold], []);

  return (
    <View style={s.root}>
      <ImageBackground source={BG} style={s.bg} resizeMode="cover">
        {/* тёплая вуаль поверх фоновой картинки */}
        <View style={s.tint} />

        {/* Header */}
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={s.back}>
            <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
          </Pressable>
          <Text style={[s.headerTitle, s.titleGlow]}>About</Text>
          <View style={s.back} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Лого */}
          <View style={[s.card, s.neon]}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
            <Text style={s.brandTitle}>CHICKEN STAR BUDDY</Text>
          </View>

          {/* Текст */}
          <View style={[s.card, s.neonSoft]}>
            <Text style={s.paragraph}>
              <Text style={s.b}>Chicken Star Buddy</Text> turns tiny daily steps into shiny rewards.
              Complete mini-quests, collect stars and keep your cheerful buddy happy!
            </Text>

            <Text style={s.subhead}>What it does</Text>
            <Text style={s.paragraph}>
              • Daily quests — add your own and get 3★ for each completion.{'\n'}
              • Buddy growth — level up your star pet as you progress.{'\n'}
              • Gentle reminders — keep the streak fun, not stressful.
            </Text>

            <Text style={s.subhead}>Why it works</Text>
            <Text style={s.paragraph}>
              Tiny actions → visible progress → real habit.{'\n'}
              <Text style={s.b}>Chicken Star Buddy</Text> keeps it playful.
            </Text>

            <GlowButton label="Share with friends" onPress={onShare} colors={gradGold} />
            <View style={{ height: 14 }} />
            <GlowButton label="App info" onPress={openInfo} colors={gradAmber} />
          </View>
        </ScrollView>

        {/* Info Modal */}
        <Modal visible={infoOpen} transparent animationType="fade" onRequestClose={() => setInfoOpen(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, s.neonSoft]}>
              <Text style={s.modalTitle}>App info</Text>

              <InfoRow k="Stars" v={appInfo?.stars ?? '—'} />
              <InfoRow k="Quests saved" v={appInfo?.questsCount ?? '—'} />
              <InfoRow k="Pet" v={appInfo?.pet ?? '—'} />
              <InfoRow k="Level" v={appInfo?.level ?? '—'} />

              <Pressable onPress={() => setInfoOpen(false)} style={{ marginTop: 14 }}>
                <Text style={s.exitText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

/* компактная строка инфо */
function InfoRow({ k, v }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoKey}>{k}</Text>
      <Text style={s.infoVal}>{String(v)}</Text>
    </View>
  );
}

/* кнопка с теплыми градиентами */
function GlowButton({ label, onPress, colors }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ translateY: pressed ? 1 : 0 }] }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={btn.bg}>
        <Text style={btn.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling>
          {label}
        </Text>
      </LinearGradient>
      <View style={btn.shadow} />
    </Pressable>
  );
}

/* styles */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,10,2,0.55)', // тёплая тёмная вуаль
  },

  /* header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  back: { width: 48, height: 48 },
  headerTitle: { fontSize: 34, color: CHK.title, fontFamily: TITAN },
  titleGlow: {
    textShadowColor: CHK.glow,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },

  /* карточки */
  card: {
    backgroundColor: CHK.panel,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: CHK.outline,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  logo: { width: 240, height: 240, marginBottom: 6, borderRadius: 18, alignSelf: 'center' },
  brandTitle: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 32,
    color: CHK.title,
    fontFamily: TITAN,
    textShadowColor: '#9A5A00',
    textShadowRadius: 6,
  },

  /* текст */
  paragraph: {
    color: CHK.subtext,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: BODY,
  },
  b: { fontFamily: TITAN, color: CHK.title },
  subhead: {
    color: CHK.title,
    fontSize: 18,
    marginTop: 2,
    marginBottom: 6,
    fontFamily: TITAN,
  },

  /* info modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,8,4,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: CHK.panelAlt,
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: CHK.outline,
  },
  modalTitle: { fontSize: 22, color: CHK.title, fontFamily: TITAN, marginBottom: 10, textAlign: 'center' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,220,150,0.25)',
  },
  infoKey: { color: CHK.subtext, fontSize: 15 },
  infoVal: { color: CHK.title, fontSize: 18, fontFamily: TITAN },
  exitText: { fontSize: 18, color: CHK.text, fontFamily: TITAN, textAlign: 'center' },

  /* тёплая «своя» неоновая тень */
  neon: {
    shadowColor: CHK.glow,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  neonSoft: {
    shadowColor: CHK.glow,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});

const btn = StyleSheet.create({
  bg: {
    alignSelf: 'stretch',
    minHeight: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  label: {
    fontSize: 20,
    color: '#2A1904', // тёмно-коричневый текст на золотом
    fontFamily: TITAN,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    left:-20,
  },
  shadow: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: -5,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
});
