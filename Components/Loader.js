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
} from 'react-native';

/**
 * Лоадер: широкое вращающееся кольцо из цветных точек (палитра PlayOJO),
 * логотип — строго по центру.
 *
 * Props:
 * - onFinish?: () => void
 * - delay?: number               // мс до вызова onFinish (по умолчанию 1200)
 * - showLogo?: boolean           // показывать логотип в центре (по умолчанию true)
 * - message?: string             // подпись под лоадером
 */
export default function Loader({ onFinish, delay = 1200, showLogo = true, message }) {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  // вращение кольца
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // авто-закрытие
  useEffect(() => {
    if (!onFinish) return;
    const t = setTimeout(onFinish, delay);
    return () => clearTimeout(t);
  }, [onFinish, delay]);

  // геометрия — ШИРЕ кольцо
  const BOX = Math.min(Math.round(Math.min(width, height) * 0.60), 360); // общий размер кольца
  const N   = 16;                                 // количество точек
  const DOT = Math.max(12, Math.round(BOX * 0.10)); // диаметр точки
  const R   = BOX / 2 - DOT / 2 - 2;              // радиус
  const LOGO_IN = Math.round(BOX * 0.65);         // размер логотипа в центре

  // цвета PlayOJO
  const C = { pink: '#FF5BD3', violet: '#7B3FF2', blue: '#2E4BFF' };
  const ringColors = [C.pink, C.violet, C.blue, C.violet];

  const dots = Array.from({ length: N }).map((_, i) => {
    const t = (i / N) * Math.PI * 2;
    const left = BOX / 2 + R * Math.cos(t) - DOT / 2;
    const top  = BOX / 2 + R * Math.sin(t) - DOT / 2;
    const color = ringColors[i % ringColors.length];

    return (
      <View
        key={i}
        style={[
          styles.dot,
          {
            left,
            top,
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.5,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          },
        ]}
      />
    );
  });

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../assets/bg.webp')} style={styles.bg} resizeMode="cover">
        <View style={styles.center}>
          {/* Обёртка кольца — дети центрируются, логотип окажется ровно по центру */}
          <View style={[styles.ringWrap, { width: BOX, height: BOX }]}>
            <Animated.View style={[styles.ring, { width: BOX, height: BOX, transform: [{ rotate }] }]}>
              {dots}
            </Animated.View>

            {showLogo && (
              <Image
                source={require('../assets/Logo.webp')}
                style={[styles.centerLogo, { width: LOGO_IN, height: LOGO_IN }]}
                resizeMode="contain"
              />
            )}
          </View>

          {!!message && <Text style={styles.caption}>{message}</Text>}
        </View>
      </ImageBackground>
    </View>
  );
}

/* ───────── styles ───────── */
function makeStyles(w, h) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg:   { flex: 1 },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    ringWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    dot: {
      position: 'absolute',
    },
    centerLogo: {
      // без абсолютов — центрируется за счёт alignItems/justifyContent родителя
    },

    caption: {
      marginTop: 18,
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.85,
    },
  });
}
