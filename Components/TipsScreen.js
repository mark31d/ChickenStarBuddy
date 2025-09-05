// Components/TipsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ─── безопасный импорт notifee ─── */
let notifee = {
  requestPermission: async () => ({ authorizationStatus: 0 }),
  getNotificationSettings: async () => ({ authorizationStatus: 0 }),
  openNotificationSettings: async () => {},
  cancelAllNotifications: async () => {},
};
let AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: -1 };
try {
  const nf = require('@notifee/react-native');
  notifee = nf.default || nf;
  AuthorizationStatus = nf.AuthorizationStatus || AuthorizationStatus;
} catch (_) {}

/* ─── palette (как в других файлах) ─── */
const COLORS = {
  gold:     '#F3C21C',
  gold2:    '#F6CC51',
  magenta:  '#B50052',
  text:     '#FFFFFF',
  card:     'rgba(12,0,6,0.92)',
};

const BG        = require('../assets/bg1.webp');
const BTN_GOLD  = require('../assets/btn_big.webp');
const BTN_RED   = require('../assets/btn_red.webp');
const ICON_BACK = require('../assets/icon_back.webp');

const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

const STORAGE_KEYS = {
  notifEnabled: 'BSP_NOTIF_ENABLED',
  stars: 'BSP_STARS',
  pet: 'BSP_PET',
  quests: 'BSP_QUESTS',
  lastFed: 'BSP_LAST_FED_AT',
  onboarding: 'BSP_ONBOARDING_COMPLETE',
};
const RATING_KEY = 'BSP_RATING';

export default function TipsScreen({ navigation }) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // рейтинг
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.notifEnabled);
      setNotifEnabled(saved === '1');

      try {
        const settings = await notifee.getNotificationSettings();
        if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
          setNotifEnabled(false);
          await AsyncStorage.setItem(STORAGE_KEYS.notifEnabled, '0');
        }
      } catch {}
    })();
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const settings = await notifee.requestPermission();
      return (
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      );
    } catch {
      return false;
    }
  }, []);

  const onEnableNotif = useCallback(async () => {
    if (notifEnabled) return;
    const ok = await requestPermission();
    if (!ok && Platform.OS === 'ios') {
      try { await notifee.openNotificationSettings(); } catch {}
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.notifEnabled, '1');
    setNotifEnabled(true);
  }, [notifEnabled, requestPermission]);

  const onDisableNotif = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.notifEnabled, '0');
    setNotifEnabled(false);
    try { await notifee.cancelAllNotifications(); } catch {}
  }, []);

  const onDeleteProgress = useCallback(async () => {
    setShowConfirm(false);
    try { await notifee.cancelAllNotifications(); } catch {}
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }, [navigation]);

  /* ─── Рейтинг: открыть, выбрать и сохранить ─── */
  const openRating = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(RATING_KEY);
      setRating(Number(saved || 0));
    } catch {
      setRating(0);
    }
    setRatingOpen(true);
  }, []);

  const saveRating = useCallback(async () => {
    try {
      await AsyncStorage.setItem(RATING_KEY, String(rating || 0));
      setRatingOpen(false);
      Alert.alert('Thank you!', `Your rating: ${rating || 0}/5`);
    } catch {
      Alert.alert('Oops', 'Could not save rating right now.');
    }
  }, [rating]);

  return (
    <View style={s.root}>
      <ImageBackground source={BG} style={s.bg} resizeMode="cover">
        {/* header */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.back}>
            <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
          </Pressable>
          <Text style={[s.title, s.titleGlow]}>Settings</Text>
          <View style={s.back} />
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Notifications */}
          <Text style={s.sectionTitle}>Notification:</Text>
          <View style={[s.card, s.neonSoft]}>
            <View style={{ gap: 16 }}>
              <ImgButton
                label="YES"
                source={BTN_GOLD}
                dimmed={!notifEnabled}
                onPress={onEnableNotif}
                tall
              />
              <ImgButton
                label="NO"
                source={BTN_GOLD}
                dimmed={notifEnabled}
                onPress={onDisableNotif}
                tall
              />
            </View>
          </View>

          {/* Rate app */}
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>Rate app:</Text>
          <View style={[s.card, s.neonSoft]}>
            <ImgButton
              label="RATE APP"
              source={BTN_GOLD}
              onPress={openRating}
              tall   // ≥120
            />
          </View>

          {/* Delete */}
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>Delete progress:</Text>
          <View style={[s.card, s.neonSoft, s.cardDanger]}>
            <ImgButton label="DELETE" source={BTN_RED} onPress={() => setShowConfirm(true)} />
          </View>
        </ScrollView>

        {/* Confirm modal */}
        <Modal
          visible={showConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirm(false)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, s.neonSoft]}>
              <Text style={s.modalTitle}>Delete progress?</Text>
              <Text style={s.modalDesc}>The action cannot be undone!</Text>

              <ImgButton label="DELETE" source={BTN_RED} onPress={onDeleteProgress} />
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={{ marginTop: 14 }}>
                <Text style={s.exitText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Rating modal */}
        <Modal
          visible={ratingOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRatingOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, s.neonSoft]}>
              <Text style={s.modalTitle}>Rate Star PlayJO Buddy</Text>

              <View style={s.starsRow}>
                {[1,2,3,4,5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)} style={s.starWrap}>
                    <Text style={[s.star, n <= rating ? s.starActive : null]}>
                      {n <= rating ? '★' : '☆'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.ratingHint}>{rating ? `${rating}/5` : 'Tap a star'}</Text>

              <ImgButton
                label="SAVE RATING"
                source={BTN_GOLD}
                onPress={saveRating}
                tall   // ≥120
              />
              <TouchableOpacity onPress={() => setRatingOpen(false)} style={{ marginTop: 14 }}>
                <Text style={s.exitText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

/* ───────── Image button ───────── */
function ImgButton({ label, source, onPress, dimmed = false, tall = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[s.btnWrap, dimmed && s.btnDimmed]}
    >
      <ImageBackground
        source={source}
        resizeMode="stretch"
        capInsets={{ top: 22, left: 22, bottom: 22, right: 22 }}
        style={[s.btnBg, tall && s.btnBgTall]}
        imageStyle={[s.btnImage, tall && s.btnImageTall]}
      >
        <Text style={[s.btnText, tall && s.btnTextTall]}>{label}</Text>
      </ImageBackground>
      <View style={[s.btnShadow, tall && s.btnShadowTall]} />
    </TouchableOpacity>
  );
}

/* ───────── styles ───────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  back: { width: 48, height: 48 },
  title: { fontSize: 34, color: 'white', fontFamily: TITAN, textAlign: 'center' },
  titleGlow: {
    textShadowColor: COLORS.magenta,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 20,
    color: COLORS.text,
    fontFamily: TITAN,
  },

  /* карточка секции */
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardDanger: {
    borderColor: '#E23131',
  },

  // image button
  btnWrap: { position: 'relative' },
  btnBg: {
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  // высокий вариант (≥120)
  btnBgTall: {
    height: 136,
    borderRadius: 26,
    paddingHorizontal: 34,
  },
  btnImage: { borderRadius: 20 },
  btnImageTall: { borderRadius: 26 },
  btnText: { fontSize: 20, color: '#0D0805', fontFamily: TITAN, letterSpacing: 0.4 },
  btnTextTall: { fontSize: 28, letterSpacing: 0.6 },

  btnShadow: {
    position: 'absolute',
    bottom: -6,
    left: 12,
    right: 12,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  btnShadowTall: {
    bottom: -8,
    left: 10,
    right: 10,
    height: 12,
    borderRadius: 12,
  },
  btnDimmed: { opacity: 0.38 },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 22, color: COLORS.text, fontFamily: TITAN, marginBottom: 6 },
  modalDesc: { fontSize: 16, color: '#E7E2DD', opacity: 0.9, marginBottom: 12, fontFamily: TITAN },
  exitText: { fontSize: 18, color: COLORS.text, fontFamily: TITAN },

  /* рейтинг */
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  starWrap: { padding: 6 },
  star: { fontSize: 40, color: 'rgba(255,255,255,0.35)' },
  starActive: { color: COLORS.gold2 },
});
