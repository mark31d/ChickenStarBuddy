// Components/MyQuestScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Pressable, FlatList, Alert, Image, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

/* ─── Chicken/Gold palette (как в MyPetScreen) ─── */
const COLORS = {
  text:    '#FFFFFF',
  title:   '#FFE08A',
  card:    'rgba(24,14,0,0.92)',   // тёмно-коричневый
  primary: '#D7A02E',              // золотая обводка
  secondary:'#FFC83D',             // яркое золото
  pill:    'rgba(255,255,255,0.14)',
  pill2:   'rgba(255,255,255,0.10)',
  shadow:  '#000000',
  accent:  '#FF8A00',              // янтарное свечение
};

/* assets (без добавления новых) */
const BG = require('../assets/bg.webp');
const BTN_SRC = {
  gold:  require('../assets/btn_big.webp'),
  green: require('../assets/btn_green.webp'),
};
const ICON_BACK  = require('../assets/icon_back.webp');
const ICON_TRASH = require('../assets/trash.webp');
const ICON_STAR  = require('../assets/Logo.webp');   // лого как «звезда»

/* ШРИФТ */
const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

const QUESTS_KEY = 'bsp:quests';
const STARS_KEY  = 'bsp:stars';

/* helpers */
const safeParse = (raw, fallback = []) => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : fallback; } catch { return fallback; } };
const isNewQuest = (createdAt) => {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 10 * 60 * 1000; // 10 минут
};

export default function MyQuestScreen() {
  const nav = useNavigation();
  const [stars, setStars] = useState(0);
  const [quests, setQuests] = useState([]);

  const loadAll = async () => {
    const [q, s] = await Promise.all([
      AsyncStorage.getItem(QUESTS_KEY),
      AsyncStorage.getItem(STARS_KEY),
    ]);
    const list = safeParse(q, []);
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : a.id || 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : b.id || 0;
      return tb - ta;
    });
    setQuests(list);
    setStars(s ? Number(s) : 0);
  };
  const saveQuests = async (list) => {
    setQuests(list);
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(list));
  };
  const setStarsPersist = async (value) => {
    setStars(value);
    await AsyncStorage.setItem(STARS_KEY, String(value));
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const onComplete = async (id) => {
    const next = quests.map(q => q.id === id ? { ...q, status: 'claimable' } : q);
    await saveQuests(next);
  };

  const onClaim = async (id) => {
    const q = quests.find(x => x.id === id);
    const reward = q?.reward ?? 3;
    await setStarsPersist(stars + reward);
    const next = quests.map(x => x.id === id ? { ...x, status: 'claimed' } : x);
    await saveQuests(next);
  };

  const onRemove = async (id) => {
    Alert.alert('Delete quest?', 'The action cannot be undone!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const next = quests.filter(q => q.id !== id);
          await saveQuests(next);
        }
      }
    ]);
  };

  const empty = quests.length === 0;

  const renderItem = ({ item, index }) => {
    const showNew = isNewQuest(item.createdAt);
    return (
      <View style={[styles.card, styles.shadowSoft]}>
        {/* левая часть с запасом справа под rewardBox */}
        <View style={{flex:1, paddingRight: 170}}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{`Quest ${index + 1}`}</Text>
            {showNew && <View style={styles.newPill}><Text style={styles.newTxt}>NEW</Text></View>}
          </View>

          {!!item.title && (
            <Text style={styles.cardSub}>{String(item.title).toUpperCase()}</Text>
          )}

          {/* плашки-метаданные */}
          <View style={styles.metaRow}>
            {item.remindAt && (
              <View style={styles.metaPill}>
                <Text style={styles.metaTxt}>⏰ {item.remindAt}</Text>
              </View>
            )}
            {item.createdAt && (
              <View style={[styles.metaPill, { opacity: 0.75 }]}>
                <Text style={styles.metaTxt}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* награда — абсолютная коробка справа сверху */}
        <View style={[styles.rewardBox, styles.shadowSoft]}>
          <Image source={ICON_STAR} style={styles.rewardIcon} resizeMode="contain" />
          <Text style={styles.rewardTxt}>{`Reward: ${item.reward ?? 3} stars`}</Text>
        </View>

        {/* кнопки */}
        <View style={styles.row}>
          {item.status === 'open' && (
            <ImgButton label="COMPLETE" variant="green" onPress={() => onComplete(item.id)} size="small" />
          )}
          {item.status === 'claimable' && (
            <ImgButton label="CLAIM" variant="gold" onPress={() => onClaim(item.id)} size="small1" />
          )}
          {item.status === 'claimed' && (
            <ImgButton label="CLAIMED" variant="gold" disabled size="small1" />
          )}

          <Pressable style={styles.trash} onPress={() => onRemove(item.id)}>
            <Image source={ICON_TRASH} style={styles.trashIcon} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.back}>
          <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
        </Pressable>
        <Text style={styles.title}>My Quest</Text>
        <View style={[styles.starsPill, styles.shadowSoft]}>
          <Image source={ICON_STAR} style={{ width:18, height:18, marginRight:6 }} />
          <Text style={styles.starsTxt}>{stars}</Text>
        </View>
      </View>

      {/* content */}
      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            There are no quests for today.{'\n'}Would you like to add one?
          </Text>
          <ImgButton
            label="Add new quest"
            variant="gold"
            onPress={() => nav.navigate('NewQuest')}
            size="big"
          />
        </View>
      ) : (
        <>
          <FlatList
            data={quests}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{padding:16, paddingBottom:140}}
            renderItem={renderItem}
            extraData={stars}
          />
          <View style={styles.footer}>
            <ImgButton
              label="Add new quest"
              variant="gold"
              onPress={() => nav.navigate('NewQuest')}
              size="big"
            />
          </View>
        </>
      )}
    </ImageBackground>
  );
}

/* image button: перекраска поверх исходной текстуры (как в MyPetScreen) */
function ImgButton({ label, onPress, variant='gold', size='small', disabled=false }) {
  const isBig = size === 'big';
  const sizeStyle = size === 'big' ? btn.big : size === 'small1' ? btn.small1 : btn.small ;

  // цвета оверлея
  const overlay =
    variant === 'green'
      ? ['#38F06C', '#15C447'] // зелёный для COMPLETE
      : ['#FFD45A', '#FF9F1C']; // золотой градиент

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] }]}
    >
      <ImageBackground
        source={variant === 'green' ? BTN_SRC.green : BTN_SRC.gold}
        resizeMode="stretch"
        capInsets={{ top: 20, left: 20, bottom: 20, right: 20 }}
        style={[btn.bg, sizeStyle]}
        imageStyle={[btn.image, isBig ? { borderRadius: 22 } : { borderRadius: 16 }]}
      >
        {/* градиентная перекраска и блики */}
        <LinearGradient colors={overlay} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={btn.overlay} />
        <View style={btn.glow} />
        <View style={btn.shineL} />
        <View style={btn.shineR} />
        <Text style={[btn.label, isBig && btn.labelBig]}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* styles */
const styles = StyleSheet.create({
  bg: { flex:1, backgroundColor:'#000' },

  header: {
    paddingTop: 54, paddingHorizontal: 16,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between'
  },
  back: { width:48, height:48 },

  title: {
    color: COLORS.title,
    fontSize: 32,
    fontFamily: TITAN,
    textShadowColor: COLORS.accent,
    textShadowRadius: 8,
  },

  starsPill: {
    paddingHorizontal:14, height:44, borderRadius:14, borderWidth:2,
    borderColor: COLORS.primary, backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection:'row', alignItems:'center'
  },
  starsTxt: { color: COLORS.text, fontSize:18, fontFamily: TITAN },

  emptyWrap: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  emptyText: { color: COLORS.text, fontSize:20, textAlign:'center', marginBottom:24, fontFamily: TITAN },

  card: {
    backgroundColor: COLORS.card,
    borderRadius:24, padding:16, marginBottom:16,
    borderWidth:2, borderColor: COLORS.primary,
  },

  titleRow: { flexDirection:'row', alignItems:'center', gap:8 },
  cardTitle: { color: COLORS.title, fontSize:22, marginBottom:6, fontFamily: TITAN, textShadowColor: COLORS.accent, textShadowRadius: 6 },
  newPill: {
    paddingHorizontal:8, paddingVertical:2, borderRadius:10,
    backgroundColor: COLORS.pill2, borderWidth:1, borderColor: COLORS.primary,
  },
  newTxt: { color: '#FFE8B5', fontSize:10, fontFamily: TITAN },

  cardSub:   { color: COLORS.text, opacity:0.95, fontSize:14, marginBottom:10, letterSpacing:1 },

  metaRow: { flexDirection:'row', gap:8, flexWrap:'wrap', marginBottom: 6 },
  metaPill: {
    paddingHorizontal:10, paddingVertical:4, borderRadius:12,
    backgroundColor: COLORS.pill2, borderWidth:1, borderColor: COLORS.primary,
  },
  metaTxt: { color: COLORS.text, fontSize:12 },

  rewardBox: {
    position:'absolute', right:12, top:12, width:150, height:64, borderRadius:16,
    backgroundColor: 'rgba(0,0,0,0.35)', borderWidth:2, borderColor: COLORS.primary,
    alignItems:'center', justifyContent:'center'
  },
  rewardIcon:{ width:28, height:28, marginBottom:4 },
  rewardTxt: { color: COLORS.text, fontSize:12, fontFamily: TITAN },

  row: { flexDirection:'row', alignItems:'center', gap:12, marginTop:12, flexWrap:'wrap' },

  trash:{ marginLeft:'auto', alignItems:'center', justifyContent:'center' },
  trashIcon: { width:62, height:62 },

  footer:{ position:'absolute', left:0, right:0, bottom:24, paddingHorizontal:16 },

  shadowSoft: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

/* image button styles */
const btn = StyleSheet.create({
  bg: { alignItems:'center', justifyContent:'center', paddingHorizontal: 30, overflow:'hidden' },

  small:  { height: 120, minWidth: 220, borderRadius: 16, alignSelf:'flex-start', marginTop: 6 },
  small1: { height: 120, minWidth: 220, borderRadius: 16, alignSelf:'flex-start', marginTop: 6 },

  big:   { height: 60, borderRadius: 22, alignSelf: 'stretch' },
  image: { borderRadius: 20 },
  label: { color:'#000', fontSize:18, fontFamily: TITAN },
  labelBig: { fontSize:22 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    opacity: 0.96,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  shineL: {
    position:'absolute', left:18, top:10, width:60, height:26,
    borderRadius:18, backgroundColor:'#FFFFFF', opacity:0.18,
  },
  shineR: {
    position:'absolute', right:18, top:10, width:70, height:28,
    borderRadius:20, backgroundColor:'#FFFFFF', opacity:0.14,
  },
});
