const BROADCAST_CHANNEL_NAME = 'agam-cross-tab';

interface BroadcastMessage<T = unknown> {
  type: string;
  payload?: T;
  requestId?: string;
  timestamp?: number;
}

type MessageHandler<T = unknown> = (message: BroadcastMessage<T>) => void;

export const CrossTabBroadcastService = {
  channel: null as BroadcastChannel | null,
  handlers: new Map<string, MessageHandler[]>(),

  init() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return false;
    }

    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const handlers = this.handlers.get(event.data.type);
      if (handlers) {
        handlers.forEach(handler => handler(event.data));
      }
    };

    return true;
  },

  on<T = unknown>(type: string, handler: MessageHandler<T>) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    const handlersList = this.handlers.get(type);
    if (handlersList) {
      handlersList.push(handler as MessageHandler<unknown>);
    }
  },

  off<T = unknown>(type: string, handler: MessageHandler<T>) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler<unknown>);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  },

  broadcast<T = unknown>(type: string, payload?: T) {
    this.channel?.postMessage({
      type,
      payload,
      timestamp: Date.now(),
    });
  },

  async request<TResponse = unknown>(
    requestType: string,
    responseType: string,
    payload?: unknown,
    timeout: number = 500
  ): Promise<TResponse | null> {
    if (!this.channel) {
      return null;
    }

    const requestId = crypto.randomUUID();

    return new Promise(resolve => {
      let received = false;

      const responseHandler = (message: BroadcastMessage<TResponse>) => {
        if (!received && message.requestId === requestId) {
          received = true;
          clearTimeout(timer);
          this.off(responseType, responseHandler);
          resolve(message.payload ?? null);
        }
      };

      const timer = setTimeout(() => {
        if (!received) {
          received = true;
          this.off(responseType, responseHandler);
          resolve(null);
        }
      }, timeout);

      this.on(responseType, responseHandler);

      this.channel?.postMessage({
        type: requestType,
        payload,
        requestId,
        timestamp: Date.now(),
      });
    });
  },

  respond<T = unknown>(responseType: string, requestId: string, payload: T) {
    this.channel?.postMessage({
      type: responseType,
      payload,
      requestId,
      timestamp: Date.now(),
    });
  },

  destroy() {
    this.channel?.close();
    this.channel = null;
    this.handlers.clear();
  },
};
