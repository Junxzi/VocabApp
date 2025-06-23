import React from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import screens
import VocabularyScreen from './src/screens/VocabularyScreen';
import StudyScreen from './src/screens/StudyScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WordDetailScreen from './src/screens/WordDetailScreen';
import SwipeStudyScreen from './src/screens/SwipeStudyScreen';
import AddWordScreen from './src/screens/AddWordScreen';

// Import providers
import { LanguageProvider } from './src/contexts/LanguageContext';
import { QueryProvider } from './src/contexts/QueryContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Vocabulary':
              iconName = 'library-books';
              break;
            case 'Study':
              iconName = 'school';
              break;
            case 'Progress':
              iconName = 'bar-chart';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        headerRight: () =>
          route.name === 'Vocabulary' ? (
            <TouchableOpacity onPress={() => navigation.navigate('AddWord')}>
              <MaterialIcons name="add" size={28} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          ) : null,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{ tabBarLabel: '単語', title: 'Vocabulary' }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{ tabBarLabel: '学習', title: 'Study' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarLabel: '進捗', title: 'Progress' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '設定', title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <LanguageProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  backgroundColor="#ffffff"
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
                    options={{
                      headerShown: false,
                      gestureEnabled: false,
                    }}
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
              </NavigationContainer>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;