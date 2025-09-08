import Pusher from 'pusher-js';

class PusherService {
  private static instance: PusherService;
  private pusher: Pusher | null = null;
  private channels: Map<string, any> = new Map();

  private constructor() {
    this.initializePusher();
  }

  public static getInstance(): PusherService {
    if (!PusherService.instance) {
      PusherService.instance = new PusherService();
    }
    return PusherService.instance;
  }

  private initializePusher(): void {
    if (typeof window === 'undefined') return;

    // Use environment variables for Pusher configuration
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;
    const pusherScheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME;

    if (!pusherKey || !pusherCluster) {
      console.error('Pusher configuration is missing');
      return;
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: pusherScheme === 'https',
      enabledTransports: ['ws', 'wss'],
      wsHost: pusherScheme === 'http' ? 'ws-ap2.pusher.com' : 'ws-ap2.pusher.com',
      wsPort: pusherScheme === 'http' ? 80 : 443,
      wssPort: 443,
    });

    // Connection event handlers
    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully');
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
    });
  }

  public getConnectionState(): string {
    if (!this.pusher) return 'disconnected';
    return this.pusher.connection.state;
  }

  public subscribeToChannel(channelName: string): any {
    if (!this.pusher) {
      console.error('Pusher not initialized');
      return null;
    }

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    
    console.log(`Subscribed to channel: ${channelName}`);
    return channel;
  }

  public unsubscribeFromChannel(channelName: string): void {
    if (!this.pusher) return;

    const channel = this.channels.get(channelName);
    if (channel) {
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  public bindToEvent(channelName: string, eventName: string, callback: (data: any) => void): void {
    const channel = this.subscribeToChannel(channelName);
    if (channel) {
      channel.bind(eventName, callback);
      console.log(`Bound to event: ${eventName} on channel: ${channelName}`);
    }
  }

  public unbindFromEvent(channelName: string, eventName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unbind(eventName);
      console.log(`Unbound from event: ${eventName} on channel: ${channelName}`);
    }
  }

  public disconnect(): void {
    if (this.pusher) {
      this.pusher.disconnect();
      this.channels.clear();
      console.log('Pusher disconnected and channels cleared');
    }
  }

  public reconnect(): void {
    if (this.pusher) {
      this.pusher.connect();
      console.log('Attempting to reconnect Pusher');
    }
  }
}

export default PusherService;
