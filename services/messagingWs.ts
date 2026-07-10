import { endpoints } from "../constants";

type Handler = (event: any) => void;

class MessagingWs {
  private ws: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private reconnectTimer: any = null;
  private token: string | null = null;
  private lastConnectedToken: string | null = null;
  private isClosedByUser = false;

  connect(token: string) {
    if (!token) return;
    this.token = token;
    this.isClosedByUser = false;
    const isLive = this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING);
    // If token changed, force reconnect so server sees the fresh JWT.
    if (isLive && this.lastConnectedToken && this.lastConnectedToken !== token) {
      try {
        this.ws?.close();
      } catch {}
      this.ws = null;
    } else if (isLive) {
      return;
    }

    const httpBase = endpoints.baseURL; // e.g. http://host:4000/api
    const wsBase = httpBase.replace(/^https?:\/\//, (m) => (m === "https://" ? "wss://" : "ws://"));
    const url = `${wsBase}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);
      this.lastConnectedToken = token;
      this.ws.onopen = () => {
        // connected
      };
      this.ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          this.handlers.forEach((h) => h(parsed));
        } catch {
          // ignore
        }
      };
      this.ws.onerror = () => {
        // allow close handler to reconnect
      };
      this.ws.onclose = () => {
        this.ws = null;
        if (this.isClosedByUser) return;
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.isClosedByUser = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
    this.lastConnectedToken = null;
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(type: string, data: any) {
    const payload = JSON.stringify({ type, data });
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(payload);
      } catch {}
      return;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !this.token) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.token) return;
      this.connect(this.token);
    }, 800);
  }
}

export const messagingWs = new MessagingWs();

