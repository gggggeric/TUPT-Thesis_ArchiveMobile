import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../api';

// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2DD4BF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '78105a6b-7968-4ce2-a519-3f451bc2b8aa',
      })).data;
      console.log('Expo Push Token retrieved:', token);
    } catch (error) {
      console.log('Error fetching Expo Push Token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (token) {
    // Send the token to the backend
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        const response = await fetch(`${API_BASE_URL}/user/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({ pushToken: token }),
        });
        const data = await response.json();
        console.log('Backend response for registering push token:', data);
      }
    } catch (err) {
      console.log('Error registering push token on backend:', err);
    }
  }

  return token;
}
