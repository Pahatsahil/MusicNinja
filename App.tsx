import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './src/navigation/MainNavigator';
import { Provider } from 'react-redux';
import store from '@redux/store/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@utills/ThemeContext';
import { Toast } from '@components/common';

const App = () => {
  return (
    <Provider store={store}>
      <GestureHandlerRootView>
        <ThemeProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
          <Toast />
        </ThemeProvider>
      </GestureHandlerRootView>
    </Provider>
  );
};
export default App;
