import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { db } from './src/services/storage/database';
import { notifications } from './src/services/phone/notifications';
import { ChatScreen } from './src/screens/ChatScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    async function init() {
      await db.init();
      await notifications.init();
    }
    init().catch(console.error);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'chatbubble';
            if (route.name === 'Chat') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            } else if (route.name === 'Obaveze') {
              iconName = focused ? 'checkbox' : 'checkbox-outline';
            } else if (route.name === 'Uvidi') {
              iconName = focused ? 'bulb' : 'bulb-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6C63FF',
          tabBarInactiveTintColor: '#999',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontWeight: '600', color: '#1A1A2E' },
        })}
      >
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerTitle: 'RAFI' }}
        />
        <Tab.Screen
          name="Obaveze"
          component={TasksScreen}
          options={{ headerTitle: 'Moje obaveze' }}
        />
        <Tab.Screen
          name="Uvidi"
          component={InsightsScreen}
          options={{ headerTitle: 'Uvidi' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
