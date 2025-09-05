// Components/MyPetScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, ImageBackground, StyleSheet, Pressable, Share, Alert,
  Platform, useWindowDimensions, ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* --- безопасный notifee --- */
let notifee = null;
let TriggerType = { TIMESTAMP: 'timestamp' };
try {
  const nf = require('@notifee/react-native');
  notifee = nf.default || nf;
  TriggerType = nf.TriggerType || TriggerType;
} catch {}

/* ─── Chicken/Gold palette ─── */
const COLORS = {
  primary:   '#D7A02E',              // золотая обводка
  secondary: '#FFC83D',              // яркое золото
  accent:    '#FF8A00',              // янтарное свечение
  text:      '#FFFFFF',
  title:     '#FFE08A',              // заголовки
  card:      'rgba(24,14,0,0.92)',   // тёмно-коричневый
};

/* assets (НЕ добавляем новых файлов) */
const BG           = require('../assets/bg1.webp');
const BTN_GOLD     = require('../assets/btn_big.webp');      // 992×292 — используем как фон
const ICON_BACK    = require('../assets/icon_back.webp');
const ICON_STAR    = require('../assets/Logo.webp');         // лого вместо звезды
const ICON_APPLE   = require('../assets/apple.webp');
const PET_CHARLES  = require('../assets/charles.webp');
const PET_KENNY    = require('../assets/kenny.webp');
const PET_WONDER   = require('../assets/wonder.webp');

/* шрифт */
const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

/* capInsets под оригинал 992×292 */
const CAP_INSETS = { top: 60, bottom: 60, left: 160, right: 160 };

/* питомцы */
const PETS = {
  charles: { name: 'Charles', img: PET_CHARLES },
  kenny:   { name: 'Kenny',   img: PET_KENNY   },
  wonder:  { name: 'Wonder',  img: PET_WONDER  },
};

/* логика питомца */
const DECAY_HOURS   = 72;
const WARN_PERCENT  = 20;
const STAR_COST     = 3;
const FEED_DELTA    = 30;
const GAIN_PER_FEED = 10;
const MS_H          = 3600 * 1000;
const DECAY_PER_H   = 100 / DECAY_HOURS;
const MAX_LEVEL     = 100;

/* storage keys */
const STARS_KEY    = 'bsp:stars';
const KEY_LAST     = '@pet:lastFedAt';
const KEY_ADOPTED  = '@pet:adoptedAt';
const KEY_GONE     = '@pet:vanished';
const KEY_PLAN     = '@pet:scheduledIds';
const KEY_FEEDS    = '@pet:feedCount';
const KEY_LEVEL    = '@pet:level';
const KEY_POINTS   = '@pet:points';
const KEY_PROFILE  = '@bsp_profile';

/* helpers */
const hungerPercent = (lastFedAt, now = Date.now()) => {
  const hours = Math.max(0, (now - lastFedAt) / MS_H);
  return Math.max(0, Math.min(100, 100 - hours * DECAY_PER_H));
};
const whenReachPercent = (lastFedAt, target) =>
  new Date(lastFedAt + ((100 - target) / DECAY_PER_H) * MS_H);
const vanishAt = (lastFedAt) => new Date(lastFedAt + DECAY_HOURS * MS_H);

/* notifee helpers */
const CHANNEL_ID = 'pet-channel';
const ensureChannel = async () => {
  if (!notifee) return;
  if (Platform.OS === 'android') {
    try { await notifee.createChannel({ id: CHANNEL_ID, name: 'Buddy Star Pet', importance: 4 }); } catch {}
  }
};
const scheduleAt = async (date, { id, title, message }) => {
  if (!notifee) return;
  try {
    await ensureChannel();
    await notifee.createTriggerNotification(
      { id, title, body: message, android: { channelId: CHANNEL_ID } },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), alarmManager: { allowWhileIdle: true } },
    );
  } catch {}
};
const cancelById = async (id) => { if (notifee && id) { try { await notifee.cancelNotification(id); } catch {} } };
const cancelMany = async (ids = []) => { for (const id of ids) await cancelById(id); };

/* ─── кнопка: перекраска старой картинки неоновым золотым градиентом ─── */
function ImgButton({ onPress, style, imageStyle, disabled, children, label }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] },
        style,
      ]}
    >
      <ImageBackground
        source={BTN_GOLD}
        resizeMode="stretch"
        capInsets={CAP_INSETS}
        style={btn.bg}
        imageStyle={[btn.image, imageStyle]}
      >
        {/* золотая перекраска поверх исходной текстуры */}
        <LinearGradient
          colors={['#FFD45A', '#FF9F1C']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={btn.overlay}
        />
        {/* мягкое янтарное свечение */}
        <View style={btn.glow} />
        {/* блики */}
        <View style={btn.shineTL} />
        <View style={btn.shineTR} />

        {children ?? <Text style={btn.label}>{label}</Text>}
      </ImageBackground>
    </Pressable>
  );
}

export default function MyPetScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = Math.min(width, 430) / 390;

  const [stars, setStars]         = useState(142);
  const [lastFedAt, setLastFedAt] = useState(Date.now());
  const [adoptedAt, setAdoptedAt] = useState(Date.now());
  const [vanished, setVanished]   = useState(false);
  const [percent, setPercent]     = useState(100);
  const [feedCount, setFeedCount] = useState(0);
  const [level, setLevel]         = useState(1);
  const [points, setPoints]       = useState(0);
  const [petKey, setPetKey]       = useState('charles');
  const tickRef = useRef(null);

  const petMeta = PETS[petKey] ?? PETS.charles;

  useEffect(() => {
    (async () => {
      const [s, lf, ad, gone, fc, lvl, pts, profJson] = await Promise.all([
        AsyncStorage.getItem(STARS_KEY),
        AsyncStorage.getItem(KEY_LAST),
        AsyncStorage.getItem(KEY_ADOPTED),
        AsyncStorage.getItem(KEY_GONE),
        AsyncStorage.getItem(KEY_FEEDS),
        AsyncStorage.getItem(KEY_LEVEL),
        AsyncStorage.getItem(KEY_POINTS),
        AsyncStorage.getItem(KEY_PROFILE),
      ]);

      let prof = null;
      try { prof = profJson ? JSON.parse(profJson) : null; } catch {}
      const selectedPet = prof?.pet && PETS[prof.pet] ? prof.pet : 'charles';
      setPetKey(selectedPet);

      const now = Date.now();
      const _stars = s ? Number(s) : 142;
      const _lf    = lf ? Number(lf) : now;
      const _ad    = ad ? Number(ad) : now;
      const _gone  = gone === '1' || now >= vanishAt(_lf).getTime();

      const loadedLevel  = Math.min(MAX_LEVEL, lvl ? Number(lvl) : 1);
      let   loadedPoints = Math.min(100, pts ? Number(pts) : 0);
      if (loadedLevel >= MAX_LEVEL) loadedPoints = 100;

      setStars(_stars);
      setLastFedAt(_lf);
      setAdoptedAt(_ad);
      setVanished(_gone);
      setPercent(hungerPercent(_lf, now));
      setFeedCount(fc ? Number(fc) : 0);
      setLevel(loadedLevel);
      setPoints(loadedPoints);

      if (!_gone) rescheduleNotifications(_lf);
    })();
  }, []);

  useEffect(() => {
    if (vanished) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const p = hungerPercent(lastFedAt);
      setPercent(p);
      if (p <= 0) handleVanished();
    }, 60 * 1000);
    return () => tickRef.current && clearInterval(tickRef.current);
  }, [lastFedAt, vanished]);

  const rescheduleNotifications = async (lf) => {
    const saved = await AsyncStorage.getItem(KEY_PLAN).then((x) => (x ? JSON.parse(x) : null));
    if (saved) await cancelMany([saved.warnId, saved.vanishId]);

    const warnTime   = whenReachPercent(lf, WARN_PERCENT);
    const vanishTime = vanishAt(lf);
    const warnId     = 'warn-' + warnTime.getTime();
    const vanishId   = 'vanish-' + vanishTime.getTime();

    if (hungerPercent(lf) < WARN_PERCENT) {
      await scheduleAt(new Date(Date.now() + 1000), {
        id: warnId, title: 'Buddy Star Pet', message: 'Your buddy is hungry. Feed him or he will run away!',
      });
    } else {
      await scheduleAt(warnTime, {
        id: warnId, title: 'Buddy Star Pet', message: 'Your buddy is hungry. Feed him or he will run away!',
      });
    }
    await scheduleAt(vanishTime, {
      id: vanishId, title: 'Buddy Star Pet', message: 'Your buddy left due to inactivity.',
    });

    await AsyncStorage.setItem(KEY_PLAN, JSON.stringify({ warnId, vanishId }));
  };

  const handleVanished = async () => {
    setVanished(true);
    await AsyncStorage.setItem(KEY_GONE, '1');
  };

  const saveStars = async (value) => {
    setStars(value);
    await AsyncStorage.setItem(STARS_KEY, String(value));
  };

  const feed = async () => {
    if (vanished) return;
    if (stars < STAR_COST) {
      Alert.alert('Not enough stars', `Need ${STAR_COST}★`);
      return;
    }
    await saveStars(stars - STAR_COST);

    const now = Date.now();
    const current     = hungerPercent(lastFedAt, now);
    const nextPercent = Math.min(100, current + FEED_DELTA);

    const hoursBack  = (100 - nextPercent) / DECAY_PER_H;
    const newLastFed = now - hoursBack * MS_H;

    setLastFedAt(newLastFed);
    setPercent(nextPercent);
    setVanished(false);

    const nextFeeds = feedCount + 1;
    setFeedCount(nextFeeds);

    let newLevel  = level;
    let newPoints = points;

    if (newLevel < MAX_LEVEL) {
      newPoints += GAIN_PER_FEED;
      while (newPoints >= 100 && newLevel < MAX_LEVEL) {
        newPoints -= 100;
        newLevel  += 1;
      }
      if (newLevel >= MAX_LEVEL) {
        newLevel  = MAX_LEVEL;
        newPoints = 100;
      }
    }

    setPoints(newPoints);
    setLevel(newLevel);

    await AsyncStorage.multiSet([
      [KEY_LAST, String(newLastFed)],
      [KEY_GONE, '0'],
      [KEY_ADOPTED, String(adoptedAt)],
      [KEY_FEEDS, String(nextFeeds)],
      [KEY_LEVEL, String(newLevel)],
      [KEY_POINTS, String(newPoints)],
    ]);

    rescheduleNotifications(newLastFed);
  };

  const sharePet = async () => {
    try { await Share.share({ message: `My Buddy is already level ${level} in CrazyTimeBuddies!` }); } catch {}
  };

  const ok            = percent >= WARN_PERCENT;
  const barColors     = ok ? ['#38F06C', '#15C447'] : ['#FF5C5C', '#C63535'];
  const barBorder     = ok ? '#18CE4E' : '#E24646';
  const daysTogether  = Math.max(0, Math.floor((Date.now() - adoptedAt) / (24 * 3600 * 1000)));
  const levelProgress = level >= MAX_LEVEL ? 100 : Math.max(0, Math.min(100, points));

  /* vanished */
  if (vanished) {
    return (
      <ImageBackground source={BG} style={st.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
          <View style={st.headerRow}>
            <Pressable onPress={() => nav.goBack()} style={st.back}>
              <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
            </Pressable>
            <Text style={[st.title, st.titleGlow, { fontSize: 34 * scale }]}>My Pet</Text>
            <View style={st.back} />
          </View>

          <View style={[st.goneCard, st.neonSoft, { borderRadius: 28 * scale }]}>
            <Text style={[st.goneText, { fontSize: 24 * scale, marginVertical: 40 * scale }]}>
              {petMeta.name} left you due{'\n'}to inactivity
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={BG} style={st.bg} resizeMode="cover">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      >
        {/* Header */}
        <View style={st.headerRow}>
          <Pressable onPress={() => nav.goBack()} style={st.back}>
            <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
          </Pressable>
          <Text style={[st.title, st.titleGlow, { fontSize: 34 * scale }]}>My Pet</Text>
          <View style={st.back} />
        </View>

        {/* Stars pill */}
        <View style={[st.starsPill, st.neonSoft, { height: 52 * scale, paddingHorizontal: 18 * scale }]}>
          <Image source={ICON_STAR} style={{ width: 26 * scale, height: 26 * scale, marginRight: 6 * scale }} />
          <Text style={[st.starsTxt, { fontSize: 18 * scale }]}>{stars}</Text>
        </View>

        {/* Pet card */}
        <View style={[st.petCardFrame, st.neon, { borderRadius: 26 * scale, borderWidth: 2 }]}>
          <View style={[st.petCardBody, { borderRadius: 24 * scale }]}>
            <View style={[st.petRow, { margin: 16 * scale }]}>
              <Image
                source={petMeta.img}
                style={{ width: 138 * scale, height: 160 * scale, borderRadius: 16 * scale, marginRight: 14 * scale, top: 17 }}
              />
              <View style={st.rightCol}>
                <Text style={[st.petName, { fontSize: 28 * scale, textAlign: 'right', left: -40 }]}>{petMeta.name}</Text>
                <Text style={[st.label, { marginTop: 6 * scale, alignSelf: 'flex-start', fontSize: 14 * scale }]}>Satiety:</Text>

                <View
                  style={[
                    st.barOuter,
                    { height: 28 * scale, width: '100%', alignSelf: 'flex-end', borderRadius: 10 * scale, borderColor: barBorder, borderWidth: 2 },
                  ]}
                >
                  <View style={[st.barTrack, { borderRadius: 8 * scale, left: 2, right: 2, top: 2, bottom: 2 }]}>
                    <LinearGradient
                      colors={barColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                      style={[st.barFill, { width: `${percent}%`, borderRadius: 8 * scale }]}
                    />
                  </View>
                  <Text style={[st.barText, { fontSize: 13 * scale }]}>{Math.round(percent)}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Feed row */}
        <View style={[st.feedRow, { gap: 12 * scale }]}>
          <ImgButton onPress={feed} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[btn.label, { fontSize: 18 * scale }]}>Feed the pet  </Text>
              <Image source={ICON_APPLE} style={{ width: 26 * scale, height: 26 * scale, marginLeft: 6 * scale }} />
            </View>
          </ImgButton>
          <View style={[st.costWrap, st.neonSoft]}>
            <Image source={ICON_STAR} style={{ width: 32 * scale, height: 32 * scale, marginRight: 6 * scale }} />
            <Text style={[st.costTxt, { fontSize: 20 * scale }]}>{STAR_COST}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[st.statsWrap, st.neon, { borderRadius: 12 * scale }]}>
          <View style={[st.stats, { borderRadius: 12 * scale }]}>
            <View style={[st.levelRow, { paddingVertical: 8 * scale }]}>
              {(() => {
                const BAR_H = 52 * scale;
                const nudgeY = Platform.OS === 'android' ? 2 * scale : 1 * scale;

                return (
                  <View style={[st.levelBar, { height: BAR_H, borderRadius: 14 * scale, borderWidth: 2, paddingHorizontal: 12 * scale, marginTop: 2 * scale }]}>
                    <View style={{ position: 'absolute', left: 2, right: 2, top: 2, bottom: 2, borderRadius: 14 * scale, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={['#E5BD4F', '#C7952B']}
                        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${levelProgress}%`, borderRadius: 14 * scale }}
                      />
                    </View>

                    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[st.levelText, { fontSize: 15 * scale, lineHeight: 15 * scale, transform: [{ translateY: nudgeY }], ...Platform.select({ android: { includeFontPadding: false, textAlignVertical: 'center' } }) }]}>
                        {`Point  ${levelProgress}/100`}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <View style={[st.levelRight, { marginLeft: 12 * scale }]}>
                <Text style={[st.levelLabel, { fontSize: 13 * scale, marginBottom: 2 * scale }]}>Level:</Text>
                <Text style={[st.levelNum,   { fontSize: 32 * scale, lineHeight: 34 * scale }]}>{level}</Text>
              </View>
            </View>

            <View style={[st.divider, { height: 3 * scale, marginVertical: 10 * scale }]} />

            <View style={[st.kvRow, { paddingVertical: 6 * scale }]}>
              <Text style={[st.kvKey, { fontSize: 16 * scale }]}>{petMeta.name} lives with you already:</Text>
              <Text style={[st.kvVal, { fontSize: 26 * scale }]}>{daysTogether} days</Text>
            </View>
            <View style={[st.kvRow, { paddingVertical: 6 * scale }]}>
              <Text style={[st.kvKey, { fontSize: 16 * scale }]}>Number of feedings:</Text>
              <Text style={[st.kvVal, { fontSize: 26 * scale }]}>{feedCount} times</Text>
            </View>

            <ImgButton label="SHARE PET" onPress={sharePet} style={{ marginTop: 14 * scale, alignSelf: 'center', width: '90%', marginBottom: 6 * scale }} />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

/* стили */
const st = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },

  headerRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  back: { width: 48, height: 48 },
  title: { color: COLORS.title, fontFamily: TITAN, textAlign: 'center' },
  titleGlow: { textShadowColor: COLORS.accent, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },

  starsPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginBottom: 10,
  },
  starsTxt: { color: COLORS.text, fontFamily: TITAN },

  petCardFrame: { marginHorizontal: 16, marginBottom: 12, borderColor: COLORS.primary },
  petCardBody:  { backgroundColor: COLORS.card },

  petRow: { flexDirection: 'row', alignItems: 'center' },
  rightCol: { flex: 1, justifyContent: 'center', alignItems: 'flex-end' },

  petName: { color: COLORS.text, fontFamily: TITAN },
  label:   { color: COLORS.text, opacity: 0.9, fontFamily: TITAN },

  barOuter: { width: '100%', marginTop: 6, position: 'relative', justifyContent: 'center', overflow: 'hidden' },
  barTrack: { position: 'absolute', backgroundColor: '#00000066', overflow: 'hidden' },
  barFill:  { position: 'absolute', left: 0, top: 0, bottom: 0 },
  barText:  { position: 'absolute', width: '100%', textAlign: 'center', color: COLORS.text, fontFamily: TITAN },

  feedRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 2, marginBottom: 6 },
  costWrap: { flexDirection: 'row', alignItems: 'center' },
  costTxt:  { color: COLORS.text, fontFamily: TITAN },

  statsWrap: {
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  stats: { backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },

  levelRow:  { flexDirection: 'row', alignItems: 'center' },
  levelBar:  { flex: 1, backgroundColor: '#2a2a2a', justifyContent: 'center', borderColor: COLORS.primary },
  levelText: { color: '#FFE8B5', fontFamily: TITAN, textAlign: 'center' },

  levelRight: { alignItems: 'center', justifyContent: 'center' },
  levelLabel: { color: COLORS.text, opacity: 0.9, fontFamily: TITAN },
  levelNum:   { color: COLORS.text, fontFamily: TITAN },

  divider: { backgroundColor: COLORS.primary, borderRadius: 2, opacity: 0.9, marginHorizontal: 10 },

  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 10 },
  kvKey: { color: '#FFE8B5' },
  kvVal: { fontFamily: TITAN, color: COLORS.secondary },

  goneCard: { marginHorizontal: 16, marginTop: 20, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  goneText: { textAlign: 'center', color: COLORS.text, fontFamily: TITAN },

  neon:     { shadowColor: COLORS.accent, shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  neonSoft: { shadowColor: COLORS.accent, shadowOpacity: 0.35, shadowRadius: 8,  shadowOffset: { width: 0, height: 0 }, elevation: 4 },
});

/* кнопка */
const btn = StyleSheet.create({
  bg: {
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    overflow: 'hidden',
  },
  image: { borderRadius: 22 },

  // накладка-градиент (перекраска без новых картинок)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    opacity: 0.96,
  },
  // янтарное свечение
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  // блики
  shineTL: {
    position: 'absolute',
    left: 18, top: 10,
    width: 60, height: 28,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
  },
  shineTR: {
    position: 'absolute',
    right: 18, top: 10,
    width: 70, height: 30,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    opacity: 0.14,
  },

  // контрастная надпись
  label: { color: '#000', fontSize: 20, fontFamily: TITAN },
});
