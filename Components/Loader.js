// Components/Loader.js
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  Image,
  Text,
  Platform,
} from 'react-native';

export default function Loader({ onFinish, delay = 1200, showLogo = true, message }) {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  // авто-закрытие
  useEffect(() => {
    if (!onFinish) return;
    const t = setTimeout(onFinish, delay);
    return () => clearTimeout(t);
  }, [onFinish, delay]);

  // логотип — пульс и лёгкий «боб»
  const pulse = useRef(new Animated.Value(0)).current;
  const bob   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pul = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
      ])
    );
    const bb = Animated.loop(
      Animated.sequence([
        Animated.timing(bob,  { toValue: -6, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob,  { toValue:  0, duration: 420, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
      ])
    );
    pul.start(); bb.start();
    return () => { pul.stop(); bb.stop(); };
  }, [pulse, bob]);

  // «метеоры» (золотые)
  const GOLD_TINTS = ['#FFD45A', '#FFC83D', '#FFB648', '#FF8A00'];
  const STARS = 18;
  const starRefs = useRef(
    Array.from({ length: STARS }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      s: new Animated.Value(0.8),
      o: new Animated.Value(0),
      r: `${42 + Math.round(Math.random() * 10)}deg`,
      size: Math.round(14 + Math.random() * 12),
      tint: GOLD_TINTS[Math.floor(Math.random() * GOLD_TINTS.length)],
      delay: Math.round(Math.random() * 600),
    }))
  ).current;

  useEffect(() => {
    function run(star) {
      const startX = -width * 0.25 + Math.random() * (width * 0.45);
      const startY = -height * 0.25 + Math.random() * (height * 0.35);
      const endX   = startX + width * 1.35;
      const endY   = startY + height * 1.35;
      const dur    = 1400 + Math.random() * 1400;

      star.x.setValue(startX);
      star.y.setValue(startY);
      star.s.setValue(0.8);
      star.o.setValue(0);

      Animated.sequence([
        Animated.delay(star.delay),
        Animated.parallel([
          Animated.timing(star.x, { toValue: endX, duration: dur, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(star.y, { toValue: endY, duration: dur, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(star.o, { toValue: 1, duration: dur * 0.25, useNativeDriver: true }),
            Animated.timing(star.o, { toValue: 0, duration: dur * 0.25, delay: dur * 0.50, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(star.s, { toValue: 1.25, duration: dur * 0.55, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(star.s, { toValue: 0.9,  duration: dur * 0.45, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run(star));
    }
    starRefs.forEach(run);
  }, [width, height, starRefs]);

  const scalePulse = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/bg.webp')} style={styles.bg} resizeMode="cover">
        <View style={styles.center}>
          <View style={styles.playfield}>
            {/* мягкое янтарное свечение */}
            <Animated.View style={[styles.centerGlow, { transform: [{ scale: scalePulse }] }]} />
            {/* золотой дождь из звёзд */}
            {starRefs.map((star, i) => (
              <Animated.Image
                key={i}
                source={require('../assets/star.webp')}
                resizeMode="contain"
                style={[
                  styles.meteor,
                  {
                    width: star.size,
                    height: star.size,
                    tintColor: star.tint,
                    transform: [
                      { translateX: star.x },
                      { translateY: star.y },
                      { rotate: star.r },
                      { scale: star.s },
                    ],
                    opacity: star.o,
                  },
                ]}
              />
            ))}

            {/* логотип */}
            {showLogo && (
              <Animated.View style={[styles.logoWrap, { transform: [{ translateY: bob }, { scale: scalePulse }] }]}>
                <Image source={require('../assets/Logo.webp')} style={styles.logo} resizeMode="contain" />
              </Animated.View>
            )}
          </View>

          {!!message && <Text style={styles.caption}>{message}</Text>}
        </View>
      </ImageBackground>
    </View>
  );
}

/* ─ styles ─ */
function makeStyles(w, h) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg:   { flex: 1 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // тёмно-коричневый контейнер как на постере
    playfield: {
      width: Math.min(Math.round(Math.min(w, h) * 0.78), 420),
      height: Math.min(Math.round(Math.min(w, h) * 0.78), 420),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: 'rgba(24,14,0,0.82)',
      borderWidth: 2,
      borderColor: '#D7A02E',        // золотая окантовка
      shadowColor: '#FF8A00',        // янтарное свечение
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
      ...Platform.select({ android: { elevation: 8 } }),
    },

    // тёплое внутреннее свечение
    centerGlow: {
      position: 'absolute',
      width: '70%',
      height: '70%',
      borderRadius: 999,
      backgroundColor: 'rgba(255,168,0,0.12)',
      borderWidth: 2,
      borderColor: '#FFC83D',
    },

    meteor: { position: 'absolute' },

    logoWrap: {
      width: '64%',
      height: '64%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: { width: '100%', height: '100%' },

    caption: { marginTop: 16, color: '#FFE7B0', fontSize: 14, opacity: 0.95 },
  });
}
