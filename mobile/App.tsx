import React, {useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import VocabularyScreen from './src/screens/VocabularyScreen';
import StudyScreen from './src/screens/StudyScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WordDetailScreen from './src/screens/WordDetailScreen';
import SwipeStudyScreen from './src/screens/SwipeStudyScreen';

// Import providers
import {LanguageProvider} from './src/contexts/LanguageContext';
import {QueryProvider} from './src/contexts/QueryContext';
import {ThemeProvider} from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Vocabulary') {
            iconName = 'library-books';
          } else if (route.name === 'Study') {
            iconName = 'school';
          } else if (route.name === 'Progress') {
            iconName = 'bar-chart';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
      })}>
      <Tab.Screen 
        name="Vocabulary" 
        component={VocabularyScreen}
        options={{
          tabBarLabel: '単語',
        }}
      />
      <Tab.Screen 
        name="Study" 
        component={StudyScreen}
        options={{
          tabBarLabel: '学習',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: '進捗',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: '設定',
        }}
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
                <Stack.Navigator screenOptions={{headerShown: false}}>
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