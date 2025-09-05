// Components/LuckySpin.js — Catch the Apples (GameEngine + Matter.js) + Scroll + 10-min cooldown
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, ImageBackground, Pressable, StyleSheet, Platform, Dimensions, ScrollView,
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

/* ─ UI ─ */
const COLORS = {
  primary:   '#D7A02E',
  secondary: '#FFC83D',
  accent:    '#FF8A00',
  text:      '#FFFFFF',
  title:     '#FFE08A',
  card:      'rgba(24,14,0,0.92)',
  card2:     'rgba(34,22,4,0.88)',
  line:      'rgba(255,255,255,0.14)',
  dim:       'rgba(255,255,255,0.82)',
  shadow:    '#000000',
};
const TITAN = Platform.select({ ios: 'TitanOne', android: 'TitanOne-Regular' });

/* ─ storage ─ */
const STARS_KEY     = 'bsp:stars';
const KEY_PROFILE   = '@bsp_profile';

/* КУЛДАУН 10 минут */
const LAST_TS_KEY   = 'bsp:luckySpin:lastTs';
const COOLDOWN_MS   = 10 * 60 * 1000; // 10 минут

/* ─ assets ─ */
const BG        = require('../assets/bg.webp');
const BTN_IMG   = require('../assets/btn_big.webp');
const ICON_BACK = require('../assets/icon_back.webp');
const APPLE_IMG = require('../assets/apple.webp');
const PETS = {
  charles: require('../assets/charles.webp'),
  kenny:   require('../assets/kenny.webp'),
  wonder:  require('../assets/wonder.webp'),
};

/* ─ gameplay ─ */
const AREA_H         = 380;
const GAME_MS        = 20000;
const SPAWN_MS       = 550;
const APPLE_MIN      = 28;
const APPLE_MAX      = 56;
const APPLE_V_MIN    = 160;
const APPLE_V_MAX    = 300;
const PLAYER_W       = 96;
const PLAYER_H       = 96;
const EDGE_PAD       = 8;

/* ─ helpers ─ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const { width: SCREEN_W } = Dimensions.get('window');
const mmss = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* ─ Renderers ─ */
const PlayerRenderer = ({ body, size = [PLAYER_W, PLAYER_H], petKey }) => {
  if (!body) return null;
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={PETS[petKey] || PETS.charles}
      style={{ position:'absolute', left:x, top:y, width:size[0], height:size[1], resizeMode:'contain' }}
    />
  );
};

const AppleRenderer = ({ body, size = [40, 40] }) => {
  if (!body) return null;
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={APPLE_IMG}
      style={{ position:'absolute', left:x, top:y, width:size[0], height:size[1], resizeMode:'contain' }}
    />
  );
};

/* ─ Systems ─ */
const Physics = (entities, { time }) => {
  Matter.Engine.update(entities.physics.engine, time.delta);
  return entities;
};

const TouchControl = (entities, { touches }) => {
  const { bounds } = entities;
  const player = entities.player;
  if (!player?.body) return entities;

  const moveTouches = touches.filter(t => t.type === 'move' || t.type === 'start');
  if (moveTouches.length) {
    const t = moveTouches[moveTouches.length - 1];
    // t.event.pageX может быть неопределён у некоторых устройств → fallback на locationX
    const pageX = t.event?.pageX ?? (bounds.pageX + t.event?.locationX ?? bounds.w / 2);
    const localX = clamp(pageX - bounds.pageX, 0, bounds.w);
    const x = clamp(bounds.x + localX, bounds.x + PLAYER_W / 2, bounds.x + bounds.w - PLAYER_W / 2);
    Matter.Body.setPosition(player.body, { x, y: player.body.position.y });
  }
  return entities;
};

const SpawnApples = (entities, { time }) => {
  const { world } = entities.physics;
  const { lastSpawnAt, nextSpawnIn } = entities.spawner;
  if (lastSpawnAt == null) {
    entities.spawner.lastSpawnAt = time.current;
    entities.spawner.nextSpawnIn = 200;
    return entities;
  }
  if (time.current - lastSpawnAt >= nextSpawnIn) {
    const id = `apple_${Math.random().toString(36).slice(2)}`;
    const size = Math.round(rand(APPLE_MIN, APPLE_MAX));
    const x = entities.bounds.x + rand(size/2, entities.bounds.w - size/2);
    const y = entities.bounds.y - size;
    const body = Matter.Bodies.circle(x, y, size/2, { isSensor: true, label: 'Apple' });
    Matter.World.add(world, body);
    entities[id] = {
      body,
      size: [size, size],
      vy: rand(APPLE_V_MIN, APPLE_V_MAX),
      renderer: AppleRenderer,
    };
    entities.spawner.lastSpawnAt = time.current;
    entities.spawner.nextSpawnIn = SPAWN_MS;
  }
  return entities;
};

const MoveApples = (entities, { time }) => {
  const { bounds } = entities;
  Object.keys(entities).forEach(key => {
    if (!key.startsWith('apple_')) return;
    const a = entities[key];
    const b = a.body;
    if (!b) return;
    const dy = (a.vy || 0) * (time.delta / 1000);
    Matter.Body.setPosition(b, { x: b.position.x, y: b.position.y + dy });
    if (b.position.y - (a.size[1]/2) > bounds.y + bounds.h + 40) {
      Matter.World.remove(entities.physics.world, b);
      delete entities[key];
    }
  });
  return entities;
};

const Collisions = (entities, { dispatch }) => {
  const player = entities.player;
  if (!player?.body) return entities;

  const px1 = player.body.position.x - PLAYER_W/2;
  const py1 = player.body.position.y - PLAYER_H/2;
  const px2 = px1 + PLAYER_W;
  const py2 = py1 + PLAYER_H;

  Object.keys(entities).forEach(key => {
    if (!key.startsWith('apple_')) return;
    const a = entities[key];
    const b = a.body;
    const sx1 = b.position.x - a.size[0]/2;
    const sy1 = b.position.y - a.size[1]/2;
    const sx2 = sx1 + a.size[0];
    const sy2 = sy1 + a.size[1];
    const hit = !(sx2 < px1 || sx1 > px2 || sy2 < py1 || sy1 > py2);
    if (hit) {
      dispatch({ type: 'caught', value: 1 });
      Matter.World.remove(entities.physics.world, b);
      delete entities[key];
    }
  });
  return entities;
};

/* ─ LuckySpin ─ */
export default function LuckySpin() {
  const navigation = useNavigation();
  const areaW = useMemo(() => Math.max(260, Math.round(SCREEN_W - 32)), []);
  const areaX = (SCREEN_W - areaW) / 2;

  const [petKey, setPetKey] = useState('charles');

  const [canPlay, setCanPlay]   = useState(true);
  const [coolLeft, setCoolLeft] = useState(0);        // сек до следующей игры
  const [playing, setPlaying]   = useState(false);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_MS / 1000);
  const [result, setResult]     = useState(null);

  const engineRef = useRef(null);
  const gameRef   = useRef(null);
  const [entities, setEntities] = useState(null);

  /* профиль → выбор питомца */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY_PROFILE);
        const p   = raw ? JSON.parse(raw) : null;
        if (p?.pet && PETS[p.pet]) setPetKey(p.pet);
      } catch {}
    })();
  }, []);

  /* Кулдаун 10 минут: тик раз в секунду */
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_TS_KEY);
        const last = raw ? parseInt(raw, 10) || 0 : 0;
        const leftMs = Math.max(0, COOLDOWN_MS - (Date.now() - last));
        const leftSec = Math.ceil(leftMs / 1000);
        if (!mounted) return;
        setCoolLeft(leftSec);
        setCanPlay(leftSec <= 0);
      } catch {
        if (!mounted) return;
        setCoolLeft(0);
        setCanPlay(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const makeEntities = useCallback(() => {
    const engine = Matter.Engine.create({ enableSleeping: false });
    engine.world.gravity.y = 0;

    const world = engine.world;
    const bounds = {
      x: areaX, y: 0, w: areaW, h: AREA_H,
      pageX: areaX,
    };

    const playerBody = Matter.Bodies.rectangle(
      bounds.x + bounds.w/2,
      bounds.y + bounds.h - EDGE_PAD - PLAYER_H/2,
      PLAYER_W, PLAYER_H,
      { isStatic: true, label: 'Player' }
    );
    Matter.World.add(world, [playerBody]);

    return {
      physics: { engine, world },
      bounds,
      spawner: { lastSpawnAt: null, nextSpawnIn: SPAWN_MS },
      player: {
        body: playerBody,
        size: [PLAYER_W, PLAYER_H],
        petKey,
        renderer: (p) => <PlayerRenderer {...p} petKey={petKey} />,
      },
    };
  }, [areaW, areaX, petKey]);

  const startGame = useCallback(() => {
    if (!canPlay || playing) return;

    setPlaying(true);
    setScore(0);
    setTimeLeft(GAME_MS / 1000);
    setResult(null);

    const ents = makeEntities();
    engineRef.current = ents.physics.engine;
    setEntities(ents);

    const startedAt = Date.now();
    const t = setInterval(() => {
      const left = Math.max(0, GAME_MS - (Date.now() - startedAt));
      setTimeLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(t);
        endGame(Math.max(1, Math.floor(score / 2)));
      }
    }, 1000);
    gameRef.current = { timer: t };
  }, [canPlay, playing, makeEntities, score]);

  const endGame = useCallback(async (reward) => {
    setPlaying(false);
    setResult(reward);

    try {
      const curRaw = await AsyncStorage.getItem(STARS_KEY);
      const cur    = curRaw ? parseInt(curRaw, 10) || 0 : 0;
      await AsyncStorage.multiSet([
        [STARS_KEY, String(cur + reward)],
        [LAST_TS_KEY, String(Date.now())], // ставим метку для 10-минутного кулдауна
      ]);
    } catch {}

    const eng = engineRef.current;
    if (eng) {
      const world = eng.world;
      Matter.World.clear(world, false);
      Matter.Engine.clear(eng);
    }
    if (gameRef.current?.timer) {
      clearInterval(gameRef.current.timer);
      gameRef.current.timer = null;
    }
  }, []);

  const onEvent = useCallback((e) => {
    if (!e || !e.type) return;
    if (e.type === 'caught') setScore(v => v + (e.value || 1));
  }, []);

  return (
    <ImageBackground source={BG} style={css.bg} resizeMode="cover">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={css.scrollContent}
        scrollEnabled={!playing}         // во время игры не даём скроллить
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={css.header}>
          <Pressable onPress={() => navigation.goBack()} style={css.back}>
            <Image source={ICON_BACK} style={{ width: 48, height: 48 }} />
          </Pressable>
          <Text style={css.title}>Catch the Apples</Text>
          <View style={css.back} />
        </View>

        {/* Card */}
        <View style={[css.card, css.shadowSoft]}>
          <Text style={css.desc}>
            {canPlay
              ? (playing ? 'Move your Buddy left/right and catch the falling apples!' : 'Catch apples to earn rewards!')
              : `Next play in ${mmss(coolLeft)}`
            }
          </Text>

          <View style={css.statusRow}>
            <View style={css.pill}><Text style={css.pillTxt}>Score: {score}</Text></View>
            <View style={[css.pill, { borderColor: COLORS.accent }]}><Text style={css.pillTxt}>Time: {timeLeft}s</Text></View>
            {!canPlay && <View style={[css.pill, { borderColor: COLORS.secondary }]}><Text style={css.pillTxt}>Next: {mmss(coolLeft)}</Text></View>}
          </View>

          {/* Игровая область */}
          <View style={[css.area, { height: AREA_H, width: '100%' }]}>
            <View style={css.areaGlow} pointerEvents="none" />
            {entities && playing ? (
              <GameEngine
                style={{ flex: 1 }}
                systems={[TouchControl, SpawnApples, MoveApples, Collisions, Physics]}
                entities={entities}
                onEvent={onEvent}
                running={true}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>

          {/* Кнопка */}
          {!playing && (
            <ImgButton
              label={canPlay ? (result != null ? `You got +${result}★` : 'PLAY') : `WAIT ${mmss(coolLeft)}`}
              onPress={canPlay ? startGame : undefined}
              disabled={!canPlay}
            />
          )}
        </View>

        {/* немного контента ниже, чтобы появился скролл даже на больших экранах */}
        <View style={{ height: 36 }} />
      </ScrollView>
    </ImageBackground>
  );
}

/* ─ Gold button ─ */
function ImgButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] },
      ]}
    >
      <ImageBackground
        source={BTN_IMG}
        resizeMode="stretch"
        capInsets={{ top: 60, left: 160, bottom: 60, right: 160 }}
        style={btn.bg}
        imageStyle={btn.image}
      >
        <LinearGradient colors={['#FFD45A', '#FF9F1C']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={btn.overlay} />
        <View style={btn.glow} />
        <View style={btn.shineL} />
        <View style={btn.shineR} />
        <Text style={btn.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* ─ styles ─ */
const css = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28 },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 10 },
  back: { width: 48, height: 48 },
  title: {
    color: COLORS.title, fontSize: 32, fontFamily: TITAN,
    textShadowColor: COLORS.accent, textShadowRadius: 10, textAlign: 'center',
  },

  card: { backgroundColor: COLORS.card, borderRadius: 28, borderWidth: 2, borderColor: COLORS.primary, padding: 16 },
  desc: { color: COLORS.dim, marginBottom: 12, textAlign:'center' },

  statusRow: { flexDirection:'row', justifyContent:'center', gap: 8, marginBottom: 10, flexWrap:'wrap' },
  pill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pillTxt: { color: COLORS.text, fontFamily: TITAN, fontSize: 14 },

  area: {
    borderRadius: 22, borderWidth: 1.5, borderColor: COLORS.line,
    backgroundColor: COLORS.card2, overflow: 'hidden', position: 'relative', marginBottom: 14,
  },
  areaGlow: {
    position:'absolute', left: -20, right: -20, top: -20, bottom: -20,
    shadowColor: COLORS.accent, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },

  shadowSoft: {
    shadowColor: COLORS.shadow, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width:0, height:4 }, elevation: 6
  },
});

const btn = StyleSheet.create({
  bg: {
    height: 140, borderRadius: 24, alignItems:'center', justifyContent:'center',
    paddingHorizontal: 32, overflow:'hidden', alignSelf:'stretch',
  },
  image: { borderRadius: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: 24, opacity: 0.96 },
  glow:    { ...StyleSheet.absoluteFillObject, borderRadius: 24, shadowColor: COLORS.accent, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  shineL:  { position:'absolute', left:22, top:16, width:70, height:30, borderRadius:20, backgroundColor:'#FFFFFF', opacity:0.16 },
  shineR:  { position:'absolute', right:22, top:16, width:80, height:32, borderRadius:22, backgroundColor:'#FFFFFF', opacity:0.12 },
  label:   { color: '#000', fontSize: 24, fontFamily: TITAN, top: -2 },
});
