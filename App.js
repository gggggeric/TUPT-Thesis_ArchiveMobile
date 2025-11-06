import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './Pages/Landing';
import LoginScreen from './Pages/Auth/Login';
import RegisterScreen from './Pages/Auth/Register';
import HomeScreen from './Pages/Home';
import { ToastProvider } from './utils/ToastContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
          }}
        >
           <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}