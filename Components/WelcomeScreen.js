// Components/WelcomeScreen.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, ScrollView,
  Pressable, useWindowDimensions, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PAGES = 5;
const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

/* ─ palette (под CHICKEN STAR BUDDY) ─ */
const COLORS = {
  gold:    '#FFC83D',                 // тёплый золотой контур/акцент
  gold2:   '#FFE08A',                 // светлый золотой заголовков/активных точек
  magenta: '#FF8A00',                 // «свечение» — тёплый янтарный
  text:    '#FFFFFF',
  card:    'rgba(24, 14, 0, 0.92)',   // тёмно-коричневый контейнер
};

const LOGO = require('../assets/logoB.webp');

export default function WelcomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [page, setPage] = useState(0);
  const [pet, setPet] = useState(null);

  const appleAngles = useMemo(
    () => Array.from({ length: 3 }, () => Math.random() * 50 - 25),
    []
  );

  const go = (to) => {
    const clamped = Math.max(0, Math.min(PAGES - 1, to));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setPage(clamped);
  };
  const next = () => page < PAGES - 1 && go(page + 1);
  const finish = () => navigation.navigate('CreateProfile', { preselectedPet: pet });

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/bg1.webp')} style={styles.bg} resizeMode="cover">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const p = Math.round(e.nativeEvent.contentOffset.x / width);
            setPage(p);
          }}
        >
          {/* ─ Page 1 ─ */}
          <Page width={width} styles={styles}>
            <View style={[styles.heroCard, styles.neonSoft]}>
              <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
            </View>
            <View style={[styles.block, styles.neon]}>
              <Text style={styles.title}>Buddy Star Pet</Text>
              <Text style={styles.subtitle}>is your personal star partner!</Text>
              <Text style={styles.descCenter}>
                Collect stars for completed habits, feed them to your virtual assistant
                so he doesn't run away
              </Text>
              <PrimaryButton label="START" onPress={next} />
            </View>
          </Page>

          {/* ─ Page 2 ─ */}
          <Page width={width} styles={styles}>
            <View style={styles.peopleWrap}>
              <View style={styles.person}>
                <Text style={styles.personLabel}>Woman</Text>
                <Image source={require('../assets/woman.webp')} style={styles.personImg} resizeMode="contain" />
              </View>
              <View style={styles.person}>
                <Text style={styles.personLabel}>Man</Text>
                <Image source={require('../assets/man.webp')} style={styles.personImg} resizeMode="contain" />
              </View>
            </View>

            <View style={[styles.block, styles.neon]}>
              <LogoChip size={56} style={{ marginBottom: 10 }} />
              <Text style={styles.title}>Confidential</Text>
              <Text style={styles.subtitle}>one-click registration</Text>
              <Text style={styles.descCenter}>
                Enter your name, choose your gender — we don't share your information with anyone:
                all data remains exclusively on your phone
              </Text>
              <PrimaryButton label="REGISTRY" onPress={next} />
            </View>
          </Page>

          {/* ─ Page 3 ─ */}
          <Page width={width} styles={styles}>
            <View style={styles.treeWrap}>
              <LinesBehind width={width} pad={styles._pad} />

              <View style={[styles.petsTop, { zIndex: 1 }]}>
                <PetCard
                  label="Charles"
                  active={pet === 'charles'}
                  onPress={() => setPet('charles')}
                  img={require('../assets/charles.webp')}
                  big
                />
              </View>

              <View style={[styles.petsBottomRow, { zIndex: 1 }]}>
                <PetCard
                  label="Kenny"
                  active={pet === 'kenny'}
                  onPress={() => setPet('kenny')}
                  img={require('../assets/kenny.webp')}
                />
                <PetCard
                  label="Wonder"
                  active={pet === 'wonder'}
                  onPress={() => setPet('wonder')}
                  img={require('../assets/wonder.webp')}
                />
              </View>
            </View>

            <View style={[styles.block, styles.neon]}>
              <Text style={styles.titleLarge}>Choose one of{'\n'}the star pet</Text>
              <Text style={styles.descCenter}>
                Meet our star family — choose your first friend from three characters
              </Text>
              <PrimaryButton label="NEXT" disabled={!pet} onPress={next} />
            </View>
          </Page>

          {/* ─ Page 4 ─ */}
          <Page width={width} styles={styles}>
            <View style={[styles.rewardCard, styles.neonSoft]}>
              <LogoChip size={40} style={{ marginRight: 10 }} />
              <Image source={require('../assets/star.webp')} style={styles.rewardIcon} />
              <Text style={styles.rewardTextCenter}>Reward: 3 stars</Text>
            </View>

            <View style={[styles.questCard, styles.neon]}>
              <Text style={styles.questTitle}>Quest 1</Text>
              <Text style={styles.questSubtitle}>READ 5 PAGES TODAY</Text>
              <ButtonImageGreen label="COMPLETE" onPress={() => {}} />
            </View>

            <View style={[styles.block, styles.neon]}>
              <Text style={styles.title}>Create your{'\n'}own quests</Text>
              <Text style={styles.descCenter}>Add up to three daily tasks (drink water, read a page, stretch)</Text>
              <PrimaryButton label="CONTINUE" onPress={next} />
            </View>
          </Page>

          {/* ─ Page 5 ─ */}
          <Page width={width} styles={styles}>
            <View style={styles.finalTop}>
              <Image source={require('../assets/kenny.webp')} style={styles.finalPet} resizeMode="contain" />
              <View style={styles.applesRow}>
                <Image source={require('../assets/apple.webp')} style={[styles.apple, { transform: [{ rotate: `${appleAngles[0]}deg` }] }]} />
                <Image source={require('../assets/apple.webp')} style={[styles.apple, styles.appleMid, { transform: [{ rotate: `${appleAngles[1]}deg` }] }]} />
                <Image source={require('../assets/apple.webp')} style={[styles.apple, { transform: [{ rotate: `${appleAngles[2]}deg` }] }]} />
              </View>
            </View>

            <View style={[styles.block, styles.neon]}>
              <LogoChip size={48} style={{ marginBottom: 10 }} />
              <Text style={styles.titleXL}>START TO{'\n'}READY????</Text>
              <Text style={styles.descCenter}>
                Complete the first task and get 3 starting stars for the Buddy upgrade!
              </Text>
              <PrimaryButton label="Yes, START" onPress={finish} />
            </View>
          </Page>
        </ScrollView>

        {/* индикатор страниц */}
        <View style={styles.dots}>
          {Array.from({ length: PAGES }).map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      </ImageBackground>
    </View>
  );
}

/* ─ helpers ─ */
function Page({ children, width, styles }) {
  return (
    <View style={{ width }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.pageScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* кнопки — используем ту же картинку, цвет текста тёмный */
function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] },
      ]}
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

function ButtonImageGreen({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ translateY: pressed ? 1 : 0 }] }]}>
      <ImageBackground
        source={require('../assets/btn_green.webp')}
        resizeMode="stretch"
        capInsets={{ top: 22, left: 22, bottom: 22, right: 22 }}
        style={[imgBtn.bg, { height: 176, width: 340 }]}
        imageStyle={imgBtn.image}
      >
        <Text style={[imgBtn.label, { fontSize: 22 }]}>COMPLETE</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* чип логотипа */
function LogoChip({ size = 32, style }) {
  const inner = size + 10;
  return (
    <View style={[chip.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image source={LOGO} style={{ width: inner, height: inner, borderRadius: inner / 2 }} resizeMode="contain" />
    </View>
  );
}

/* карточка питомца */
function PetCard({ img, label, active, onPress, big }) {
  // активный — градиент золота, неактивный — тёмно-коричневый
  const gradientColors = active ? ['#E5BD4F', '#C7952B'] : ['#1E1406', '#2A1B0C'];
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
      <View
        style={[
          petStyles.card,
          big && petStyles.big,
          active ? petStyles.borderGold : petStyles.borderGrey,
          active && petStyles.activeShadow,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[petStyles.inner, big && petStyles.innerBig]}
        >
          <Image source={img} style={[petStyles.imgFill, !active && petStyles.imgDim]} resizeMode="cover" />
        </LinearGradient>
      </View>
      <Text style={[petStyles.name, active && petStyles.nameActive]}>{label}</Text>
    </Pressable>
  );
}

function LinesBehind({ width, pad }) {
  const cw = width - pad * 2;
  const TOP = 220;
  const BOT = 140;
  const gapY = 64;

  const edge = Math.round(cw * 0.02);
  const topX = (cw - TOP) / 2;
  const topY = 0;

  const leftX = edge;
  const leftY = TOP + gapY;
  const rightX = cw - edge - BOT;
  const rightY = leftY;

  return (
    <View pointerEvents="none" style={treeStyles.linesWrap}>
      <DashLine from={{ x: topX + TOP * 0.28, y: topY + TOP * 0.92 }} to={{ x: leftX + BOT * 0.18, y: leftY - 10 }} />
      <DashLine from={{ x: topX + TOP * 0.72, y: topY + TOP * 0.92 }} to={{ x: rightX + BOT * 0.82, y: rightY - 10 }} />
      <DashLine from={{ x: leftX + 6, y: leftY + 10 }} to={{ x: rightX + BOT - 6, y: rightY + 10 }} />
    </View>
  );
}

function DashLine({ from, to, color = '#FFC83D', size = 4, gap = 10, radius = 2 }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const count = Math.max(2, Math.floor(len / (size + gap)));
  const left = (from.x + to.x) / 2 - len / 2;
  const top = (from.y + to.y) / 2 - size / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: len,
        height: size,
        transform: [{ rotate: `${angle}deg` }],
        justifyContent: 'space-between',
        flexDirection: 'row',
        zIndex: 0,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: size, height: size, backgroundColor: color, borderRadius: radius }} />
      ))}
    </View>
  );
}

/* ─ styles ─ */
function makeStyles(w, h) {
  const PAD = Math.min(26, Math.round(w * 0.06));
  const isTall = h > 800;

  const created = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg: { flex: 1 },

    pageScroll: {
      minHeight: h,
      paddingHorizontal: PAD,
      paddingTop: isTall ? 86 : 58,
      paddingBottom: 26,
      justifyContent: 'flex-end',
      rowGap: 10,
    },

    heroCard: {
      alignSelf: 'center',
      width: w - PAD * 2,
      height: Math.min(w - PAD * 2, 420),
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: -30,
      marginTop: -6,
      backgroundColor: COLORS.card,
      borderWidth: 2,
      borderColor: COLORS.gold,
    },
    heroLogo: { width: '100%', height: '100%', borderRadius: 26, marginTop: -40 },

    block: {
      width: '100%',
      backgroundColor: COLORS.card,
      borderRadius: 26,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: COLORS.gold,
    },

    treeWrap: { width: '100%', minHeight: 420, position: 'relative', marginBottom: 10 },
    petsTop: { alignItems: 'center', marginBottom: 8 },

    petsBottomRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 12,
      columnGap: 12,
    },

    title: {
      fontFamily: TITAN, fontSize: 28, color: COLORS.gold2, marginBottom: 2, textAlign: 'center',
      textShadowColor: COLORS.magenta, textShadowRadius: 8,
    },
    titleLarge: {
      fontFamily: TITAN, fontSize: 32, color: COLORS.gold2, textAlign: 'center', marginBottom: 8, lineHeight: 36,
      textShadowColor: COLORS.magenta, textShadowRadius: 8,
    },
    titleXL: {
      fontFamily: TITAN, fontSize: 36, color: COLORS.gold2, textAlign: 'center', marginBottom: 8, lineHeight: 40,
      textShadowColor: COLORS.magenta, textShadowRadius: 8,
    },
    subtitle: { fontFamily: TITAN, fontSize: 18, color: COLORS.gold2, marginBottom: 12, textAlign: 'center' },
    desc: { fontSize: 15, color: COLORS.text, opacity: 0.92, lineHeight: 20, marginBottom: 14, textAlign: 'center' },
    descCenter: { fontSize: 16, color: COLORS.text, opacity: 0.92, textAlign: 'center', lineHeight: 22, marginBottom: 14 },

    peopleWrap: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 20 },
    person: { alignItems: 'center', flex: 1, marginTop: -14 },
    personLabel: { fontFamily: TITAN, color: COLORS.text, fontSize: 14, marginBottom: 8, textAlign: 'center' },
    personImg: { width: w * 0.66, height: h * 0.44, marginBottom: -36 },

    rewardCard: {
      alignSelf: 'center',
      width: w - PAD * 2,
      backgroundColor: COLORS.card,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 26,
      borderWidth: 2,
      borderColor: COLORS.gold,
    },
    rewardIcon: { width: 40, height: 40, marginRight: 6, flexShrink: 0 },
    rewardTextCenter: { color: COLORS.text, fontWeight: '700', textAlign: 'center', flex: 1 },

    questCard: {
      borderWidth: 2,
      borderColor: COLORS.gold,
      borderRadius: 22,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginVertical: 6,
      marginHorizontal: 4,
      marginBottom: 10,
      backgroundColor: COLORS.card,
      alignItems: 'center',
    },
    questTitle: { fontFamily: TITAN, color: COLORS.text, fontSize: 26, marginBottom: 6, textAlign: 'center' },
    questSubtitle: { color: COLORS.text, fontSize: 16, opacity: 0.95, textAlign: 'center', marginBottom: 12 },

    finalTop: { alignItems: 'center', marginBottom: -10, marginTop: 30 },
    finalPet: { width: w * 0.8, height: h * 0.36 },

    applesRow: {
      position: 'absolute',
      top: 4,
      width: Math.min(220, Math.round(w * 0.54)),
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 2,
    },
    apple: { width: Math.max(36, Math.min(50, Math.round(w * 0.12))), height: Math.max(36, Math.min(50, Math.round(w * 0.12))), top: -30 },
    appleMid: { marginTop: -30 },

    dots: { position: 'absolute', bottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
    dotActive: { backgroundColor: COLORS.gold2 },

    neon: {
      shadowColor: COLORS.magenta,
      shadowOpacity: 0.55,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
    neonSoft: {
      shadowColor: COLORS.magenta,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
  });

  return { ...created, _pad: PAD };
}

/* ───────── кнопки: минимум 120 высоты ───────── */
const imgBtn = StyleSheet.create({
  bg: {
    height: 128,              // минимум 120+
    minWidth: 240,
    paddingHorizontal: 38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 24,
  },
  image: { borderRadius: 24 },
  label: { fontFamily: TITAN, fontSize: 26, color: '#1a1000', textAlign: 'center' }, // тёмный на золоте
});

/* chip styles */
const chip = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1305',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    overflow: 'hidden',
  },
});

/* PetCard styles */
const petStyles = StyleSheet.create({
  card: {
    width: 140,
    height: 140,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 6,
    backgroundColor: '#120B02',
  },
  big: { width: 220, height: 220, borderRadius: 28, marginBottom: 8 },

  borderGold: { borderColor: COLORS.gold },
  borderGrey: { borderColor: 'rgba(255,220,120,0.35)' },

  inner: { flex: 1, borderRadius: 22 },
  innerBig: { borderRadius: 26 },

  imgFill: { width: '100%', height: '100%' },
  imgDim: { opacity: 0.86 },

  name: { marginTop: 6, color: COLORS.gold2, fontFamily: TITAN, textAlign: 'center' },
  nameActive: { color: COLORS.gold, textShadowColor: COLORS.magenta, textShadowRadius: 6 },

  activeShadow: {
    shadowColor: COLORS.gold2,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});

const treeStyles = StyleSheet.create({
  linesWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
