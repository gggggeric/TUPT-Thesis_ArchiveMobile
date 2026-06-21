import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './Pages/Landing';
import LoginScreen from './Pages/Auth/Login';
import RegisterScreen from './Pages/Auth/Register';
import ForgotScreen from './Pages/Auth/Forgot';
import HomeScreen from './Pages/Home';
import ProfileScreen from './Pages/User/Profile';
import ThesisAnalysisScreen from './Pages/Thesis/ThesisAnalysis';
import SmartSearchScreen from './Pages/Thesis/SmartSearch';
import ThesisDetailScreen from './Pages/Thesis/ThesisDetail';
import AnalysisWorkspaceScreen from './Pages/Documents/Analysis/AnalysisWorkspace';
import SearchResultScreen from './Pages/Search/SearchResult';
import CollaborationScreen from './Pages/Collaboration/Collaboration';
import ApprovalsScreen from './Pages/User/Approvals';
import DocumentsHubScreen from './Pages/Documents/DocumentsHub';
import MySubmissionsScreen from './Pages/Documents/Submissions/MySubmissions';
import SubmitThesisScreen from './Pages/Documents/Submit/SubmitThesis';
import { ToastProvider } from './utils/ToastContext';
import API_BASE_URL from './api';

console.log('[App] Configured API_BASE_URL:', API_BASE_URL);

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
          <Stack.Screen name="ThesisAnalysis" component={ThesisAnalysisScreen} />
          <Stack.Screen name="SmartSearch" component={SmartSearchScreen} />
          <Stack.Screen name="ThesisDetail" component={ThesisDetailScreen} />
           <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Forgot" component={ForgotScreen} />
          
          <Stack.Screen name="AnalysisWorkspace" component={AnalysisWorkspaceScreen} />
          <Stack.Screen name="SearchResult" component={SearchResultScreen} />
          <Stack.Screen name="Collaboration" component={CollaborationScreen} />
          <Stack.Screen name="Approvals" component={ApprovalsScreen} />
          <Stack.Screen name="DocumentsHub" component={DocumentsHubScreen} />
          <Stack.Screen name="MySubmissions" component={MySubmissionsScreen} />
          <Stack.Screen name="SubmitThesis" component={SubmitThesisScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}