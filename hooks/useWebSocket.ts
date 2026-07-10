import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from '../constants';

// Use global WebSocket for React Native
declare const WebSocket: any;

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'user_joined' | 'user_left';
  groupId?: number;
  userId?: number;
  message?: any;
  data?: any;
}

export const useWebSocket = (groupId: number, enabled: boolean = true, tokenOverride?: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(async () => {
    console.log(`🔌 Connect called: enabled=${enabled}, groupId=${groupId}, readyState=${ws.current?.readyState}`);
    if (!enabled || ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const stored = tokenOverride || await AsyncStorage.getItem('accessToken');
      if (!stored) {
        console.log('No access token found');
        return;
      }

      // Get base URL from endpoint
      const protocol = endpoints.baseURL.includes('localhost') || endpoints.baseURL.includes('192.168') ? 'ws' : 'wss';
      let baseURL = endpoints.baseURL.replace('http://', '').replace('https://', '');
      // Remove any trailing /api to avoid /api/api duplication
      if (baseURL.endsWith('/api')) {
        baseURL = baseURL.slice(0, -4);
      }
      const wsUrl = `${protocol}://${baseURL}/api/groups/${groupId}/ws`;

      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

      // For React Native, use the built-in WebSocket with token in URL
      const authWsUrl = `${wsUrl}?token=${encodeURIComponent(stored)}`;
      console.log('🔐 Authenticated WS URL: %s?token=***', wsUrl);
      console.log(`🔐 Token length: ${stored.length}`);
      const socket = new WebSocket(authWsUrl);

      socket.onopen = () => {
        console.log(`✅ WebSocket connected for group ${groupId}`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        ws.current = socket;
      };

      socket.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 WebSocket message received:', data);
          setLastMessage(data as WebSocketMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error: any) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socket.onclose = (event: any) => {
        console.log(`🔌 WebSocket closed for group ${groupId}`, event.code, event.reason);
        setIsConnected(false);

        // Attempt reconnection if unexpected close
        if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [groupId, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (ws.current) {
      try { ws.current.close(1000, 'Client disconnecting'); } catch {}
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    // Normalize: allow callers to pass just the payload → infer type='message'
    // If called as sendMessage(payloadObject), treat it as { type: 'message', data: payloadObject }
    let finalType: string = type as unknown as string;
    let finalData: any = data;
    if (typeof type === 'object' && data === undefined) {
      finalData = type as unknown as any;
      finalType = 'message';
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type: finalType, data: finalData });
        ws.current.send(message);
        console.log('📤 WebSocket message sent:', { type: finalType, data: finalData });
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const sendTyping = useCallback((username: string) => {
    sendMessage('typing', { name: username });
  }, [sendMessage]);

  const sendReadReceipt = useCallback((messageId: number) => {
    sendMessage('read', { messageId });
  }, [sendMessage]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => { disconnect(); };
  }, [groupId, enabled, connect, disconnect]);

  return {
    lastMessage,
    isConnected,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    reconnect: connect,
  };
};