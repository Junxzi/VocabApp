// App.tsx
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// 良い例：そのまま使う
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import VocabularyScreen from './src/screens/VocabularyScreen';
import StudyScreen from './src/screens/StudyScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WordDetailScreen from './src/screens/WordDetailScreen';
import SwipeStudyScreen from './src/screens/SwipeStudyScreen';
import AddWordScreen from './src/screens/AddWordScreen';

import { QueryProvider } from './src/contexts/QueryContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { insertUserSchema } from '../shared/schema';

type TabParamList = {
  Vocabulary: undefined;
  Study: undefined;
  Progress: undefined;
  Settings: undefined;
};
type StackParamList = {
  Main: undefined;
  WordDetail: { wordId: number };
  SwipeStudy: undefined;
  AddWord: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<StackParamList>();
export function TabNavigator({ navigation }: any) {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Vocabulary: 'library-books',
            Study:      'school',
            Progress:   'bar-chart',
            Settings:   'settings',
          }
          return <MaterialIcons name={icons[route.name] ?? 'circle'} size={size} color={color} />
        },
        tabBarActiveTintColor:   '#000',
        tabBarInactiveTintColor: '#666',
        // add bottom inset so bar sits above the home-indicator
        tabBarStyle: {
          height:          65 + insets.bottom,
          paddingTop:      8,
          paddingBottom:   insets.bottom + 8,
          backgroundColor: '#fff',
          borderTopColor:  '#e0e0e0',
        },
        headerRight: () =>
          route.name === 'Vocabulary' ? (
            <TouchableOpacity onPress={() => navigation.navigate('AddWord')}>
              <MaterialIcons name="add" size={28} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Tab.Screen name="Vocabulary" component={VocabularyScreen} options={{ title: '単語' }} />
      <Tab.Screen name="Study"      component={StudyScreen}      options={{ title: '学習' }} />
      <Tab.Screen name="Progress"   component={ProgressScreen}   options={{ title: '進捗' }} />
      <Tab.Screen name="Settings"   component={SettingsScreen}   options={{ title: '設定' }} />
    </Tab.Navigator>
  )
}

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryProvider>
          <LanguageProvider>
            <ThemeProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  backgroundColor={isDarkMode ? '#000' : '#fff'}
                />

                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Main" component={TabNavigator} />
                  <Stack.Screen
                    name="WordDetail"
                    component={WordDetailScreen}
                    options={{
                      headerShown: true,
                      headerTitle: '単語詳細',
                      headerBackTitleVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="SwipeStudy"
                    component={SwipeStudyScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                  />
                  <Stack.Screen
                    name="AddWord"
                    component={AddWordScreen}
                    options={{
                      presentation: 'modal',
                      headerShown: true,
                      headerTitle: '単語を追加',
                      headerBackTitleVisible: false,
                    }}
                  />
                </Stack.Navigator>

                <Toast />
              </NavigationContainer>
            </ThemeProvider>
          </LanguageProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;