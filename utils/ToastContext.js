import React, { createContext, useContext, useRef } from 'react';
import ToastManager from './toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toastRef = useRef();

  return (
    <ToastContext.Provider value={toastRef}>
      {children}
      <ToastManager ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const toastRef = useContext(ToastContext);
  if (!toastRef) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return toastRef.current;
};