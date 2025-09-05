// Components/NewQuestScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, TextInput, Pressable,
  Modal, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

/* assets (без новых) */
const BG         = require('../assets/bg.webp');
const BTN_BIG    = require('../assets/btn_big.webp'); // 992×292
const ICON_CLOCK = require('../assets/icon_clock.webp');
const ICON_BELL  = require('../assets/icon_bell.webp');
const ICON_STAR  = require('../assets/star.webp');
const ICON_BACK  = require('../assets/icon_back.webp');

/* ─── Chicken/Gold palette (как на MyPet/MyQuest) ─── */
const COLORS = {
  primary:   '#D7A02E',                 // золотая обводка
  secondary: '#FFC83D',                 // яркое золото
  accent:    '#FF8A00',                 // янтарное свечение
  title:     '#FFE08A',                 // заголовки
  text:      '#FFFFFF',
  dim:       'rgba(255,255,255,0.70)',
  line:      'rgba(255,255,255,0.14)',
  card:      'rgba(24,14,0,0.92)',      // тёмно-коричневый
  card2:     'rgba(38,24,0,0.88)',
  field:     'rgba(28,18,0,0.92)',
  fieldDim:  'rgba(20,12,0,0.70)',
};

const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });
const QUESTS_KEY = 'bsp:quests';

const CATEGORIES = ['Health', 'Study', 'Work', 'Fitness', 'Focus'];
const WEEK_DAYS  = ['S','M','T','W','T','F','S']; // 0..6 (Sun..Sat)

export default function NewQuestScreen() {
  const nav = useNavigation();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [effort, setEffort] = useState(3); // 1..5
  const [repeat, setRepeat] = useState('none'); // none|daily|weekdays|weekends|custom
  const [customDays, setCustomDays] = useState([]); // [0..6]

  const [bellOn, setBellOn] = useState(false);
  const [time, setTime] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const onChangeTime = (_e, t) => {
    if (Platform.OS === 'android') setPickerOpen(false);
    if (t) setTime(t);
  };

  const pad = (n) => String(n).padStart(2, '0');

  const formatTime12 = (d) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const am = h < 12 ? 'AM' : 'PM';
    h = h % 12 || 12;
    return `${h}:${pad(m)} ${am}`;
  };

  // smart-парсинг времени из текста
  const extractTimeFromString = (str) => {
    if (!str) return null;
    const r1 = /(at|в)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
    const r2 = /\b(\d{1,2}):(\d{2})\b/i;
    const r3 = /\b(\d{1,2})\s*(am|pm)\b/i;

    let h, m, ap, match, cleaned = str;

    if ((match = str.match(r1))) {
      h = parseInt(match[2], 10);
      m = match[3] ? parseInt(match[3], 10) : 0;
      ap = match[4];
      cleaned = str.replace(r1, '').replace(/\s{2,}/g, ' ').trim();
    } else if ((match = str.match(r2))) {
      h = parseInt(match[1], 10);
      m = parseInt(match[2], 10);
      ap = null;
      cleaned = str.replace(r2, '').replace(/\s{2,}/g, ' ').trim();
    } else if ((match = str.match(r3))) {
      h = parseInt(match[1], 10);
      m = 0;
      ap = match[2];
      cleaned = str.replace(r3, '').replace(/\s{2,}/g, ' ').trim();
    } else {
      return null;
    }

    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) return null;

    if (ap) {
      const isPM = ap.toLowerCase() === 'pm';
      h = h % 12 + (isPM ? 12 : 0);
    }

    const dt = new Date();
    dt.setHours(h, m, 0, 0);
    return { dt, text: cleaned };
  };

  const onTitleEndEditing = () => {
    const res = extractTimeFromString(title);
    if (!res) return;
    setTime(res.dt);
    setBellOn(true);
    setTitle(res.text);
  };

  const toggleCustomDay = (idx) => {
    setCustomDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort((a,b) => a-b)
    );
  };

  const repeatLabel = () => {
    switch (repeat) {
      case 'daily': return 'Daily';
      case 'weekdays': return 'Weekdays';
      case 'weekends': return 'Weekends';
      case 'custom': return customDays.length ? `Days: ${customDays.map(d => WEEK_DAYS[d]).join('')}` : 'Custom';
      default: return 'None';
    }
  };

  const previewLine = () => {
    const bits = [];
    if (bellOn) bits.push(`⏰ ${formatTime12(time)}`);
    if (repeat !== 'none') bits.push(repeatLabel());
    if (category) bits.push(category);
    bits.push('★'.repeat(effort));
    return bits.join(' • ');
  };

  const createQuest = async () => {
    const t = title.trim();
    if (!t) return;

    const newQuest = {
      id: Date.now(),
      title: t,
      reward: 3,
      status: 'open',
      remindAt: bellOn ? formatTime12(time) : null,
      repeat,
      customDays,
      category,
      effort,
      createdAt: new Date().toISOString(),
    };

    const raw = await AsyncStorage.getItem(QUESTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(newQuest);
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(list));
    nav.goBack();
  };

  const canCreate = title.trim().length > 0;

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header */}
        <View style={s.header}>
          <Pressable onPress={() => nav.goBack()} style={s.backBtn}>
            <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
          </Pressable>
          <Text style={s.headerTitle}>New quest</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* content (scrollable) */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.label}>Name quest:</Text>

          <View style={[s.inputWrap, s.neonSoft]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onEndEditing={onTitleEndEditing}
              style={s.input}
              placeholder="Read 5 pages..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              returnKeyType="done"
              autoCapitalize="sentences"
              maxLength={60}
            />
            <Text style={s.counter}>{title.length}/60</Text>
          </View>
          <Text style={s.tip}>Tip: type “at 7 pm” or “21:30” to auto-fill reminder time</Text>

          {/* шаблоны */}
          <View style={s.templatesRow}>
            <TemplateChip label="Drink water" onPress={() => setTitle('Drink water')} />
            <TemplateChip label="Read 5 pages" onPress={() => setTitle('Read 5 pages')} />
            <TemplateChip label="Stretch 10 minutes" onPress={() => setTitle('Stretch 10 minutes')} />
            <TemplateChip label="Walk 20 minutes" onPress={() => setTitle('Walk 20 minutes')} />
          </View>

          {/* категория */}
          <Text style={s.label}>Category:</Text>
          <View style={s.selRow}>
            {CATEGORIES.map((c) => (
              <SelectChip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          {/* повтор */}
          <Text style={s.label}>Repeat:</Text>
          <View style={s.selRow}>
            <SelectChip label="None"      selected={repeat === 'none'}      onPress={() => setRepeat('none')} />
            <SelectChip label="Daily"     selected={repeat === 'daily'}     onPress={() => setRepeat('daily')} />
            <SelectChip label="Weekdays"  selected={repeat === 'weekdays'}  onPress={() => setRepeat('weekdays')} />
            <SelectChip label="Weekends"  selected={repeat === 'weekends'}  onPress={() => setRepeat('weekends')} />
            <SelectChip label="Custom"    selected={repeat === 'custom'}    onPress={() => setRepeat('custom')} />
          </View>
          {repeat === 'custom' && (
            <View style={s.daysRow}>
              {WEEK_DAYS.map((d, i) => (
                <DayChip key={i} label={d} selected={customDays.includes(i)} onPress={() => toggleCustomDay(i)} />
              ))}
            </View>
          )}

          {/* напоминание */}
          <Text style={[s.label, { marginTop: 8 }]}>Remind me of:</Text>
          <View style={s.remindRow}>
            <Pressable style={[s.timeField, s.neonSoft]} onPress={() => setPickerOpen(true)}>
              <Image source={ICON_CLOCK} style={[s.clock, { tintColor: COLORS.secondary }]} />
              <Text style={s.timeText}>{bellOn ? formatTime12(time) : 'Add time'}</Text>
            </Pressable>

            <Pressable
              onPress={() => setBellOn((v) => !v)}
              style={[
                s.bellBox,
                s.neonSoft,
                {
                  borderColor: bellOn ? COLORS.accent : 'rgba(255,255,255,0.18)',
                  backgroundColor: bellOn ? 'rgba(255,138,0,0.14)' : COLORS.fieldDim,
                },
              ]}
            >
              <Image
                source={ICON_BELL}
                style={[s.bell, { tintColor: bellOn ? COLORS.accent : 'rgba(255,255,255,0.35)' }]}
              />
            </Pressable>
          </View>

          {/* усилие */}
          <Text style={s.label}>Effort:</Text>
          <View style={s.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => {
              const active = i < effort;
              return (
                <Pressable key={i} onPress={() => setEffort(i + 1)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Image
                    source={ICON_STAR}
                    style={{
                      width: 34, height: 34, marginHorizontal: 4,
                      tintColor: active ? COLORS.secondary : 'rgba(255,255,255,0.24)',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* превью */}
          <View style={[s.previewCard, s.neon]}>
            <Text style={s.previewTitle}>{title.trim() || 'Your quest title'}</Text>
            <View style={s.previewLineWrap}>
              <Text style={s.previewLineText}>{previewLine()}</Text>
            </View>
          </View>

          {/* reward card */}
          <View style={[s.rewardCard, s.neon]}>
            <Image source={ICON_STAR} style={{ width: 48, height: 48, marginRight: 12, tintColor: COLORS.secondary }} />
            <Text style={s.rewardText}>Reward: 3 stars</Text>
          </View>

          {/* create button — минимум 120 по высоте; перекраска золотым */}
          <ImgButton
            label="CREATE"
            onPress={createQuest}
            disabled={!canCreate}
            style={s.createBtn}
          />
        </ScrollView>

        {/* time picker */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <View style={s.modalBackdrop}>
            <View style={s.pickerWrap}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  onChange={(e, t) => t && setTime(t)}
                  style={{ width: '100%' }}
                />
              ) : (
                <DateTimePicker value={time} mode="time" display="default" onChange={onChangeTime} />
              )}

              {/* OK — минимум 120, та же кнопка */}
              <ImgButton label="OK" onPress={() => setPickerOpen(false)} style={s.okBtn} />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

/* chips */
function TemplateChip({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.chip}>
        <Text style={s.chipText}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SelectChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={[s.selChip, selected && s.selChipActive]}>
        <Text style={[s.selChipText, selected && s.selChipTextActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function DayChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <View style={[s.dayChip, selected && s.dayChipActive]}>
        <Text style={[s.dayChipText, selected && s.dayChipTextActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

/* большая кнопка-изображение — минимум 120; золотая перекраска поверх исходной текстуры */
function ImgButton({ label, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] },
        style,
      ]}
    >
      <ImageBackground
        source={BTN_BIG}
        resizeMode="stretch"
        capInsets={{ top: 22, left: 22, bottom: 22, right: 22 }}
        style={btn.bg}
        imageStyle={btn.image}
      >
        {/* золотой градиент-оверлей */}
        <LinearGradient
          colors={['#FFD45A', '#FF9F1C']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={btn.overlay}
        />
        {/* мягкое янтарное свечение */}
        <View style={btn.glow} />
        {/* блики */}
        <View style={btn.shineL} />
        <View style={btn.shineR} />

        <Text style={btn.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* ─ styles ─ */
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },

  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 48, height: 48 },
  headerTitle: {
    color: COLORS.title,
    fontSize: 32,
    fontFamily: TITAN,
    textShadowColor: COLORS.accent,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },

  label: { color: COLORS.text, fontSize: 20, fontFamily: TITAN, marginBottom: 8 },

  inputWrap: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  input: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: TITAN,
    paddingVertical: 6,
  },
  counter: {
    position: 'absolute',
    right: 10,
    bottom: 6,
    color: COLORS.dim,
    fontSize: 12,
  },
  tip: { color: COLORS.dim, fontSize: 12, marginBottom: 12 },

  templatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.fieldDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: { color: COLORS.text, fontSize: 13, fontFamily: TITAN },

  selRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  selChip: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selChipActive: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(255,200,61,0.18)',
  },
  selChipText: { color: '#EDECEC', fontSize: 14, fontFamily: TITAN },
  selChipTextActive: { color: COLORS.secondary },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayChip: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.fieldDim,
    borderWidth: 1, borderColor: COLORS.line,
  },
  dayChipActive: { borderColor: COLORS.secondary, backgroundColor: 'rgba(255,200,61,0.18)' },
  dayChipText: { color: COLORS.text, fontSize: 13, fontFamily: TITAN },
  dayChipTextActive: { color: COLORS.secondary },

  remindRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  timeField: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLORS.field,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  clock: { width: 22, height: 22, marginRight: 10 },
  timeText: { color: COLORS.text, fontSize: 18, fontFamily: TITAN },

  bellBox: {
    width: 96,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fieldDim,
  },
  bell: { width: 28, height: 28 },

  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },

  previewCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 12,
    marginBottom: 14,
  },
  previewTitle: { color: COLORS.text, fontSize: 18, fontFamily: TITAN, marginBottom: 6 },
  previewLineWrap: {
    paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  previewLineText: { color: COLORS.text, fontSize: 14 },

  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card2,
    borderRadius: 18,
    padding: 16,
    marginTop: 2,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rewardText: { color: COLORS.text, fontSize: 20, fontFamily: TITAN },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWrap: {
    width: '86%',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },

  /* КНОПКИ: минимум 120 по высоте */
  createBtn: {
    alignSelf: 'center',
    width: '86%',
    height: 120,
    borderRadius: 26,
    marginTop: 8,
  },
  okBtn: {
    alignSelf: 'center',
    width: '86%',
    height: 120,
    borderRadius: 26,
    marginTop: 14,
  },

  /* неон */
  neon: {
    shadowColor: COLORS.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  neonSoft: {
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});

const btn = StyleSheet.create({
  bg: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,           // ← минимум 120
    borderRadius: 26,
    paddingHorizontal: 34,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  image: { borderRadius: 26 },

  // золотая перекраска
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    opacity: 0.96,
  },
  // янтарное свечение
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  // блики
  shineL: {
    position:'absolute', left:22, top:16, width:70, height:30,
    borderRadius:20, backgroundColor:'#FFFFFF', opacity:0.16,
  },
  shineR: {
    position:'absolute', right:22, top:16, width:80, height:32,
    borderRadius:22, backgroundColor:'#FFFFFF', opacity:0.12,
  },

  label: { color: '#000', fontSize: 24, fontFamily: TITAN, top: -2 },
});
