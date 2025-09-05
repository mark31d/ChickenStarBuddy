// Components/MainScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, Image, ImageBackground, StyleSheet, Pressable,
  useWindowDimensions, Platform, ScrollView, Modal, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

/* Chicken/Gold palette (как на CHICKEN STAR BUDDY) */
const THEME = {
  card:    'rgba(24,14,0,0.92)',   // тёмно-коричневый контейнер
  card2:   'rgba(24,14,0,0.85)',
  outline: '#D7A02E',              // золотистая обводка
  gold:    '#FFC83D',              // тёплый золото
  gold2:   '#FFE08A',              // светлое золото (заголовки/актив)
  white:   '#FFFFFF',
  shadow:  '#000000',
  glow:    '#FF8A00',              // мягкое янтарное свечение
};

const BUTTON_TEXT = '#000000';
const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

const STORAGE = {
  PROFILE: '@bsp_profile',
  STARS: 'bsp:stars',
  STARS_OLD: '@bsp_stars',
  NEXT_QUEST_AT: 'bsp:nextQuestAt',
  NEXT_QUEST_AT_OLD: '@bsp_nextQuestAt',
  CURRENT_QUEST: 'bsp:currentQuest',
  JOURNAL: 'bsp:journal',
};

const QUESTS = [
  'Feed your Buddy Star Pet – 1 time.',
  'Stay in the app for at least 60 seconds.',
  'Read one interesting article or excerpt from a book.',
  'Drink a glass of water.',
  'Do a 5-minute stretch or light exercise.',
  'Write down one thing you are grateful for today.',
  'Send a greeting or thank you to a friend.',
  'Clean up your desk or tidy up the area around you for 2 minutes.',
  'Breathe deeply 5 times (mindfulness session).',
  'Go for a minute walk around the rooms or yard.',
];

const ROUTES = {
  quest: 'MyQuest',
  pet: 'MyPet',
  settings: 'Settings',
  about: 'About',
  spin: 'LuckySpin',
};

const safeParse = (raw, fallback = []) => { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } };
const todayKeyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const formatDateShort = (yyyyMmDd) => {
  const [y, m, d] = String(yyyyMmDd).split('-').map(Number);
  if (!y || !m || !d) return '—';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function MainScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width), [width]);

  const [profile, setProfile] = useState(null);
  const [stars, setStars] = useState(0);
  const [nextQuestAt, setNextQuestAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [questIdx, setQuestIdx] = useState(0);

  const [journal, setJournal] = useState([]);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalText, setJournalText] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRaw, sRawNew, sRawOld, nRawNew, nRawOld, qRaw, jRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE.PROFILE),
          AsyncStorage.getItem(STORAGE.STARS),
          AsyncStorage.getItem(STORAGE.STARS_OLD),
          AsyncStorage.getItem(STORAGE.NEXT_QUEST_AT),
          AsyncStorage.getItem(STORAGE.NEXT_QUEST_AT_OLD),
          AsyncStorage.getItem(STORAGE.CURRENT_QUEST),
          AsyncStorage.getItem(STORAGE.JOURNAL),
        ]);
        if (pRaw) setProfile(JSON.parse(pRaw));
        const starsVal = sRawNew ?? sRawOld;
        if (starsVal != null) setStars(parseInt(starsVal, 10) || 0);
        const nVal = nRawNew ?? nRawOld;
        if (nVal != null) setNextQuestAt(parseInt(nVal, 10) || 0);
        const qVal = qRaw != null ? parseInt(qRaw, 10) : 0;
        setQuestIdx(Number.isFinite(qVal) && qVal >= 0 && qVal < QUESTS.length ? qVal : 0);

        const jList = safeParse(jRaw, []);
        jList.sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
        setJournal(jList);
      } catch {}
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const [sRawNew, sRawOld, nRawNew, nRawOld, qRaw, jRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE.STARS),
            AsyncStorage.getItem(STORAGE.STARS_OLD),
            AsyncStorage.getItem(STORAGE.NEXT_QUEST_AT),
            AsyncStorage.getItem(STORAGE.NEXT_QUEST_AT_OLD),
            AsyncStorage.getItem(STORAGE.CURRENT_QUEST),
            AsyncStorage.getItem(STORAGE.JOURNAL),
          ]);
          if (!alive) return;
          const starsVal = sRawNew ?? sRawOld;
          if (starsVal != null) setStars(parseInt(starsVal, 10) || 0);
          const nVal = nRawNew ?? nRawOld;
          if (nVal != null) setNextQuestAt(parseInt(nVal, 10) || 0);
          const qVal = qRaw != null ? parseInt(qRaw, 10) : questIdx;
          if (Number.isFinite(qVal) && qVal >= 0 && qVal < QUESTS.length) setQuestIdx(qVal);

          const jList = safeParse(jRaw, []);
          jList.sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
          setJournal(jList);
        } catch {}
      })();
      return () => { alive = false; };
    }, [questIdx])
  );

  useEffect(() => {
    const fromParams = route?.params?.stars;
    if (fromParams != null) {
      const n = Number(fromParams);
      if (!Number.isNaN(n)) {
        setStars(n);
        AsyncStorage.setItem(STORAGE.STARS, String(n)).catch(() => {});
      }
    }
  }, [route?.params?.stars]);

  const questAvailable = now >= (nextQuestAt || 0);

  const onClaim = useCallback(async () => {
    if (!questAvailable) return;
    const reward = 3;
    const newStars = stars + reward;
    setStars(newStars);

    const ts = Date.now() + 24 * 60 * 60 * 1000;
    setNextQuestAt(ts);

    let nextIdx = questIdx;
    if (QUESTS.length > 1) {
      do { nextIdx = Math.floor(Math.random() * QUESTS.length); } while (nextIdx === questIdx);
    }
    setQuestIdx(nextIdx);

    try {
      await AsyncStorage.multiSet([
        [STORAGE.STARS, String(newStars)],
        [STORAGE.NEXT_QUEST_AT, String(ts)],
        [STORAGE.CURRENT_QUEST, String(nextIdx)],
      ]);
    } catch {}
  }, [questAvailable, stars, questIdx]);

  const timeLeft = React.useMemo(() => {
    const diff = Math.max(0, (nextQuestAt || 0) - now);
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }, [nextQuestAt, now]);

  const avatar =
    profile?.gender === 'man'
      ? require('../assets/man.webp')
      : require('../assets/woman.webp');

  const go = (name) => {
    try { navigation.navigate(name); } catch (e) { console.warn('No route:', name); }
  };

  const openJournal = React.useCallback(() => {
    const key = todayKeyLocal();
    const today = journal.find(e => e?.date === key);
    setJournalText(today?.text ?? '');
    setJournalOpen(true);
  }, [journal]);

  const saveJournal = React.useCallback(async () => {
    const key = todayKeyLocal();
    const text = journalText.trim();
    if (!text) { setJournalOpen(false); return; }
    const filtered = journal.filter(e => e?.date !== key);
    const entry = { date: key, text, ts: Date.now() };
    const next = [entry, ...filtered].slice(0, 100);
    setJournal(next);
    setJournalOpen(false);
    try { await AsyncStorage.setItem(STORAGE.JOURNAL, JSON.stringify(next)); } catch {}
  }, [journalText, journal]);

  const todayHasNote = journal.some(e => e?.date === todayKeyLocal());

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/bg.webp')} style={styles.bg} resizeMode="cover">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <Image source={require('../assets/logoB.webp')} style={styles.logoBig} resizeMode="cover" />
            <View style={[styles.avatarWrap, styles.shadowSoft]}>
              <Image source={avatar} style={styles.avatarContain} resizeMode="contain" />
            </View>
          </View>

          {/* STARS COUNTER */}
          <View style={[styles.counter, styles.shadowSoft]}>
            <Image source={require('../assets/Logo.webp')} style={styles.counterStar} />
            <Text style={styles.counterText}>{stars}</Text>
          </View>

          {/* DAILY QUEST */}
          <View style={[styles.questWrap, styles.shadowSoft]}>
            <Text style={styles.questTitle}>Daily quest:</Text>
            <Text style={styles.questDesc}>{QUESTS[questIdx]}</Text>

            <View style={styles.questRow}>
              <View style={{ flex: 1 }}>
                {questAvailable ? (
                  <MiniButton label="CLAIM" onPress={onClaim} />
                ) : (
                  <Text style={styles.cooldown}>New quest: {timeLeft}</Text>
                )}
              </View>

              <View style={styles.rewardTile}>
                <Image source={require('../assets/star.webp')} style={styles.rewardStar} />
                <Text style={styles.rewardText}>Reward: 3 stars</Text>
              </View>
            </View>

            <View style={styles.questBorder} pointerEvents="none" />
          </View>

          {/* JOURNAL */}
          <View style={[styles.journalWrap, styles.shadowSoft]}>
            <Text style={styles.journalTitle}>Daily journal</Text>
            <Text style={styles.journalDesc}>Capture a tiny win or thought for today.</Text>

            <View style={styles.journalRow}>
              <View style={{ flex: 1 }}>
                <MiniButton label={todayHasNote ? 'EDIT' : 'WRITE'} onPress={openJournal} />
              </View>
              <View style={styles.journalHint}>
                <Text style={styles.journalHintTxt}>{todayHasNote ? 'Saved for today' : 'No note yet'}</Text>
              </View>
            </View>

            {journal.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.journalChipsRow}>
                {journal.slice(0, 6).map((e) => (
                  <View key={e.ts} style={styles.journalChip}>
                    <Text style={styles.journalChipDate}>{formatDateShort(e.date)}</Text>
                    <Text style={styles.journalChipText} numberOfLines={2}>{e.text}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* BIG BUTTONS */}
          <BigButton label="My Quest"   onPress={() => go(ROUTES.quest)} />
          <BigButton label="My Pet"     onPress={() => go(ROUTES.pet)} />
          <BigButton label="Game" onPress={() => go(ROUTES.spin)} />
          <BigButton label="Settings"   onPress={() => go(ROUTES.settings)} />
          <BigButton label="About"      onPress={() => go(ROUTES.about)} />
        </ScrollView>
      </ImageBackground>

      {/* JOURNAL MODAL */}
      <Modal visible={journalOpen} transparent animationType="fade" onRequestClose={() => setJournalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.shadowSoft]}>
            <Text style={styles.modalTitle}>Today’s note</Text>
            <TextInput
              value={journalText}
              onChangeText={setJournalText}
              style={styles.journalInput}
              placeholder="Write a tiny win, thought or gratitude…"
              placeholderTextColor="rgba(255,235,180,0.6)"
              multiline
              maxLength={200}
            />
            <Text style={styles.counterSmall}>{journalText.length}/200</Text>

            <MiniButton label="SAVE" onPress={saveJournal} />
            <Pressable onPress={() => setJournalOpen(false)} style={{ marginTop: 10 }}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* базовые кнопки */
function BigButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], opacity: disabled ? 0.45 : 1 }]}
    >
      <ImageBackground
        source={require('../assets/btn_big.webp')}
        style={btn.bigImg}
        imageStyle={btn.bigImgRadius}
        resizeMode="stretch"
      >
        <Text style={btn.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

function MiniButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <ImageBackground
        source={require('../assets/btn_big.webp')}
        style={mini.img}
        imageStyle={mini.imgRadius}
        resizeMode="stretch"
      >
        <Text style={mini.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* стили */
function makeStyles(w) {
  const PAD = Math.min(24, Math.round(w * 0.06));
  const tileSize = Math.min(130, Math.round(w * 0.34));
  const counterH = 64;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg: { flex: 1, paddingHorizontal: PAD, paddingTop: 20, paddingBottom: 0 },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      marginTop: 6,
      marginBottom: 8,
    },

    logoBig: { width: tileSize, height: tileSize, borderRadius: 25 },
    avatarWrap: {
      width: tileSize, height: tileSize, backgroundColor: THEME.card, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.outline,
    },
    avatarContain: { width: '100%', height: '100%', borderRadius: 22 },

    counter: {
      marginTop: 12, height: counterH, borderRadius: 22, backgroundColor: THEME.card2,
      borderWidth: 2, borderColor: THEME.outline, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 10,
    },
    counterStar: { width: 68, height: 48, marginRight: -6, resizeMode: 'contain' },
    counterText: { color: THEME.white, fontSize: 24, letterSpacing: 0.5, fontFamily: TITAN },

    questWrap: {
      marginTop: 16, backgroundColor: THEME.card2, borderRadius: 28, padding: 16,
      overflow: 'hidden', borderWidth: 2, borderColor: THEME.outline,
    },
    questBorder: { position: 'absolute', inset: 0, borderRadius: 28, borderWidth: 0, borderColor: 'transparent' },
    questTitle: { color: THEME.gold2, fontSize: 26, marginBottom: 6, fontFamily: TITAN, textShadowColor: THEME.glow, textShadowRadius: 6 },
    questDesc: { color: THEME.white, opacity: 0.95, fontSize: 16, marginBottom: 12 },
    questRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    rewardTile: {
      width: 140, backgroundColor: 'rgba(255,200,60,0.15)', borderRadius: 18,
      paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.outline,
    },
    rewardStar: { width: 36, height: 36, marginBottom: 6 },
    rewardText: { color: THEME.white, textAlign: 'center', fontFamily: TITAN, fontSize: 16 },
    cooldown: { color: THEME.white, fontSize: 16, paddingVertical: 10, fontFamily: TITAN },

    journalWrap: {
      marginTop: 16, backgroundColor: THEME.card2, borderRadius: 28, padding: 16,
      borderWidth: 2, borderColor: THEME.outline,
    },
    journalTitle: { color: THEME.gold2, fontSize: 24, fontFamily: TITAN, marginBottom: 4, textShadowColor: THEME.glow, textShadowRadius: 6 },
    journalDesc: { color: THEME.white, opacity: 0.95, marginBottom: 12 },
    journalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    journalHint: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
      backgroundColor: 'rgba(255,200,60,0.15)', borderWidth: 1, borderColor: THEME.outline,
    },
    journalHintTxt: { color: THEME.white, fontSize: 12 },
    journalChipsRow: { gap: 10, paddingRight: 4 },
    journalChip: {
      width: Math.min(200, Math.round(w * 0.5)), backgroundColor: 'rgba(255,200,60,0.15)',
      borderRadius: 16, padding: 10, borderWidth: 1, borderColor: THEME.outline,
    },
    journalChipDate: { color: THEME.gold2, marginBottom: 4, fontFamily: TITAN, fontSize: 12 },
    journalChipText: { color: THEME.white, fontSize: 14 },

    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modalCard: {
      width: '100%', backgroundColor: THEME.card2, borderRadius: 22, borderWidth: 2,
      borderColor: THEME.outline, padding: 16,
    },
    modalTitle: { color: THEME.gold2, fontSize: 20, fontFamily: TITAN, marginBottom: 10, textAlign: 'center', textShadowColor: THEME.glow, textShadowRadius: 6 },
    journalInput: {
      minHeight: 120, maxHeight: 220, borderRadius: 14, borderWidth: 1, borderColor: THEME.outline,
      backgroundColor: 'rgba(255,200,60,0.10)', paddingHorizontal: 12, paddingVertical: 10,
      color: THEME.white, textAlignVertical: 'top', fontSize: 16,
    },
    counterSmall: { alignSelf: 'flex-end', color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, marginBottom: 10 },
    modalClose: { color: THEME.white, fontSize: 16, textAlign: 'center', marginTop: 4, fontFamily: TITAN },

    shadowSoft: {
      shadowColor: THEME.shadow, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
  });
}

const btn = StyleSheet.create({
  bigImg: {
    height: 144, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginTop: -20, marginBottom:-50,
  },
  bigImgRadius: { borderRadius: 24 },
  label: { fontSize: 28, color: BUTTON_TEXT, fontFamily: TITAN },
});

const mini = StyleSheet.create({
  img: { width: 150, height: 98, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imgRadius: { borderRadius: 16 },
  label: { color: BUTTON_TEXT, fontSize: 18, fontFamily: TITAN },
});
