import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import VoiceLabScreen from './src/screens/VoiceLabScreen';
import VocabScreen from './src/screens/VocabScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ShadowingScreen from './src/screens/ShadowingScreen';


import SpeakBetterScreen from './src/screens/SpeakBetterScreen';
import InterviewPrepScreen from './src/screens/InterviewPrepScreen';
import GymHubScreen from './src/screens/GymHubScreen';
import GrowthHubScreen from './src/screens/GrowthHubScreen';
import { getProfile } from './src/utils/storage';
import SplashScreen from './src/components/SplashScreen';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function scheduleDailyReminder() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎙️ Speaking time!",
      body: "2 minutes is all it takes. Open your tracker and speak today.",
      sound: true,
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Today: { active: '🏠', inactive: '🏠' },
  Gym: { active: '💪', inactive: '💪' },
  Growth: { active: '📈', inactive: '📈' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const notificationListener = useRef();

  useEffect(() => {
    initialize();
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  const initialize = async () => {
    // Set a safety timeout of 3 seconds
    const safetyTimeout = setTimeout(() => {
      if (isInitializing) {
        setIsInitializing(false);
      }
    }, 3000);

    try {
      // 1. Setup Notifications
      if (Platform.OS !== 'web') {
        try {
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#6C63FF',
            });
          }
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          if (existingStatus !== 'granted') await Notifications.requestPermissionsAsync();
        } catch (e) {
          console.warn('Notifications Init Failed:', e);
        }
      }

      // 2. Check Persisted Login
      const userStr = await AsyncStorage.getItem('currUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setProfile(user);
        setIsLoggedIn(true);
      } else {
        const p = await getProfile();
        if (p) setProfile(p);
      }
    } catch (e) {
      console.error('Init Error', e);
    } finally {
      clearTimeout(safetyTimeout);
      setIsInitializing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('currUser');
      setIsLoggedIn(false);
      setProfile(null);
    } catch(e) { console.error('Logout error', e); }
  };

  if (!splashComplete) {
    return (
      <SplashScreen onFinish={() => setSplashComplete(true)} />
    );
  }

  if (isInitializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLogin={(user) => {
          setSplashComplete(false); // Trigger splash again for the entrance
          setIsLoggedIn(true);
          setProfile(user);
        }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1C1C36',
              borderTopWidth: 0,
              paddingBottom: Platform.OS === 'ios' ? 20 : 12,
              paddingTop: 12,
              height: Platform.OS === 'ios' ? 85 : 70,
              elevation: 20,
              borderRadius: 30,
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 55 : 55,
              left: 20,
              right: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
            },
            tabBarActiveTintColor: '#6C63FF',
            tabBarInactiveTintColor: '#B0B0D0',
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              marginTop: 2,
            },
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20 }}>
                {focused
                  ? TAB_ICONS[route.name]?.active || '?'
                  : TAB_ICONS[route.name]?.inactive || '?'}
              </Text>
            ),
          })}
        >
          <Tab.Screen name="Today">
            {(props) => <HomeScreen {...props} profile={profile} onLogout={handleLogout} />}
          </Tab.Screen>
          
          <Tab.Screen name="Gym">
            {(props) => <GymHubScreen {...props} />}
          </Tab.Screen>

          <Tab.Screen name="Growth">
            {(props) => <GrowthHubScreen {...props} />}
          </Tab.Screen>

          <Tab.Screen name="Settings">
            {(props) => <SettingsScreen {...props} profile={profile} />}
          </Tab.Screen>

          {/* Hidden Practice Screens */}
          <Tab.Screen name="Lab" options={{ tabBarButton: () => null }}>
            {(props) => <VoiceLabScreen {...props} profile={profile} />}
          </Tab.Screen>
          <Tab.Screen name="Vocab" options={{ tabBarButton: () => null }}>
            {(props) => <VocabScreen {...props} profile={profile} />}
          </Tab.Screen>
          <Tab.Screen name="Shadow" options={{ tabBarButton: () => null }}>
            {(props) => <ShadowingScreen {...props} />}
          </Tab.Screen>
          <Tab.Screen name="Better" options={{ tabBarButton: () => null }}>
            {(props) => <SpeakBetterScreen {...props} />}
          </Tab.Screen>
          <Tab.Screen name="Journal" options={{ tabBarButton: () => null }}>
            {(props) => <HistoryScreen {...props} profile={profile} />}
          </Tab.Screen>
          <Tab.Screen name="Interview" options={{ tabBarButton: () => null }}>
            {(props) => <InterviewPrepScreen {...props} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' },
});
