import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";

const HOST_MODE_KEY = "user_host_mode";

interface HostModeContextType {
  isHostMode: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  switchToHostMode: () => void;
  switchToUserMode: () => void;
}

const HostModeContext = createContext<HostModeContextType | undefined>(undefined);

export const HostModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHostMode, setIsHostMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user } = useUser();

  // Load saved mode preference on mount
  useEffect(() => {
    loadHostMode();
  }, []);

  const loadHostMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(HOST_MODE_KEY);
      if (savedMode !== null) {
        setIsHostMode(JSON.parse(savedMode));
      }
    } catch (error) {
      console.error("Error loading host mode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHostMode = async (newMode: boolean) => {
    try {
      setIsTransitioning(true);
      setIsHostMode(newMode);
      await AsyncStorage.setItem(HOST_MODE_KEY, JSON.stringify(newMode));
      
      // If switching TO host mode and user is logged in, record it on server
      if (newMode && user?.accessToken) {
        try {
          await api.post(
            endpoints.recordHostModeSwitch,
            {},
            {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            }
          );
          console.log("✅ Recorded host mode switch on server");
        } catch (error) {
          console.error("❌ Failed to record host mode switch:", error);
          // Don't block the UI if this fails
        }
      }
      
      // Brief transition for tab switch feedback
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    } catch (error) {
      console.error("Error saving host mode:", error);
      setIsTransitioning(false);
    }
  };

  const switchToHostMode = () => toggleHostMode(true);
  const switchToUserMode = () => toggleHostMode(false);

  const value = {
    isHostMode,
    isLoading,
    isTransitioning,
    switchToHostMode,
    switchToUserMode,
  };

  return (
    <HostModeContext.Provider value={value}>
      {children}
    </HostModeContext.Provider>
  );
};

export const useHostMode = () => {
  const context = useContext(HostModeContext);
  if (context === undefined) {
    throw new Error("useHostMode must be used within a HostModeProvider");
  }
  return context;
};
