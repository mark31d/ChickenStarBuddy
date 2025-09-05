// App.js — без таб бара, только Stack

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- Экраны ---
import Loader         from './Components/Loader';
import WelcomeScreen  from './Components/WelcomeScreen';
import CreateProfile  from './Components/CreateProfile';

import MainScreen     from './Components/MainScreen';
import MyQuestScreen  from './Components/MyQuestScreen';
import NewQuestScreen from './Components/NewQuestScreen';
import MyPetScreen    from './Components/MyPetScreen';
import SettingsScreen from './Components/TipsScreen';
import AboutScreen    from './Components/AboutScreen';
import LuckySpin    from './Components/LuckySpin';
const RootStack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <Loader />;

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#000000',
      card:       '#000000',
      text:       '#FFFFFF',
      border:     'rgba(255,255,255,0.1)',
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <NavigationContainer theme={theme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {/* онбординг */}
          <RootStack.Screen name="Welcome"       component={WelcomeScreen} />
          <RootStack.Screen name="CreateProfile" component={CreateProfile} />

          {/* главный экран */}
          <RootStack.Screen name="Main"          component={MainScreen} />

          {/* остальные экраны как обычные stack-скрины */}
          <RootStack.Screen name="MyQuest"       component={MyQuestScreen} />
          <RootStack.Screen name="MyPet"         component={MyPetScreen} />
          <RootStack.Screen name="Settings"      component={SettingsScreen} />
          <RootStack.Screen name="About"         component={AboutScreen} />

          {/* доп. стэк-экран */}
          <RootStack.Screen name="NewQuest"      component={NewQuestScreen} />
            {/* доп. стэк-экран */}
            <RootStack.Screen name="LuckySpin"      component={LuckySpin} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
