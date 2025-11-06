// utils/toast.js
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Custom Toast Component
const CustomToast = ({ message, type, visible, onHide }) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : 
                         type === 'error' ? '#F44336' : 
                         type === 'warning' ? '#FF9800' : '#2196F3';

  return (
    <Animated.View style={[styles.toast, { backgroundColor, opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// Toast Manager Component
const ToastManager = forwardRef((props, ref) => {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  });

  useImperativeHandle(ref, () => ({
    show: (message, type = 'info') => {
      setToast({
        visible: true,
        message,
        type
      });
    }
  }));

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return (
    <CustomToast
      message={toast.message}
      type={toast.type}
      visible={toast.visible}
      onHide={hideToast}
    />
  );
});

// Styles
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

// Export both components
export default ToastManager;
export { CustomToast };