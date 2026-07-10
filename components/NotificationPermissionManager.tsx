import React, { useEffect, useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

export const NotificationPermissionManager: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { 
    permissionGranted, 
    isInitialized, 
    hasShownPermissionPrompt,
    markPermissionPromptShown 
  } = useNotificationContext();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!permissionGranted && !hasShownPermissionPrompt) {
      setShowPrompt(true);
    }
  }, [isInitialized, permissionGranted, hasShownPermissionPrompt]);

  const handleClose = async () => {
    setShowPrompt(false);
    await markPermissionPromptShown();
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <NotificationPermissionPrompt
      visible={showPrompt}
      onClose={handleClose}
    />
  );
};
