import { PeerMode } from './peer-mode';
import { deserializePeerData, serializePeerData } from './serialization';

export type DefaultMessageType = string;

export type OnConnectionClosedHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;
export type OnConnectionReadyHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;
export type OnMessageReceivedHandler<TMessage = DefaultMessageType> = (
  message: TMessage,
  connection: MessagingConnection<TMessage>,
) => void;

export type AddHandlerOptions = {
  /** Will clear previously added handlers. Defaults to true */
  clearHandlers?: boolean;
};

export interface MessagingConnectionOptions extends RTCConfiguration {
  /** Encode the peer data generated by startConnection/joinConnection, so the resulting
   * string is shorter. Both peers must use the same value to establish a connection.
   *
   * Example: Using minification when passing the remote peer data via query string parameter
   * will make URLs shorter. */
  minification?: boolean;
}

export class MessagingConnection<TMessage = DefaultMessageType> {
  protected handlers: {
    onConnectionClosed: OnConnectionClosedHandler<TMessage>[];
    onConnectionReady: OnConnectionReadyHandler<TMessage>[];
    onMessageReceived: OnMessageReceivedHandler<TMessage>[];
  };
  public onHandlerReplaced?: (
    type: 'connectionClosed' | 'connectionReady' | 'messageReceived',
  ) => void;

  protected rtcConnection: RTCPeerConnection = undefined!;
  protected localIceCandidates: RTCIceCandidate[] = [];

  protected session: RTCSessionDescriptionInit | undefined;
  protected dataChannel: RTCDataChannel | undefined;

  protected configuration: RTCConfiguration | undefined;
  protected minification: boolean | undefined;
  protected peerDataReadyTimeout: number | undefined;
  protected peerDataResolver: ((peerData: string) => void) | undefined;

  protected _localPeerData: string | undefined;
  get localPeerData() {
    return this._localPeerData;
  }

  protected _peerMode: PeerMode | undefined;
  get peerMode() {
    return this._peerMode;
  }

  get isActive() {
    return !!this.dataChannel;
  }

  constructor(options: MessagingConnectionOptions = {}) {
    this.handlers = {
      onConnectionClosed: [],
      onConnectionReady: [],
      onMessageReceived: [],
    };
    const { minification, ...configuration } = options;
    this.configuration = configuration;
    this.minification = minification;
    this.reset();
  }

  on(
    event: 'connectionClosed',
    handler: OnConnectionClosedHandler<TMessage>,
    options?: AddHandlerOptions,
  ): void;
  on(
    event: 'connectionReady',
    handler: OnConnectionReadyHandler<TMessage>,
    options?: AddHandlerOptions,
  ): void;
  on(
    event: 'messageReceived',
    handler: OnMessageReceivedHandler<TMessage>,
    options?: AddHandlerOptions,
  ): void;
  on(
    ...[event, handler, options]:
      | [
          event: 'connectionClosed',
          handler: OnConnectionClosedHandler<TMessage>,
          options?: AddHandlerOptions,
        ]
      | [
          event: 'connectionReady',
          handler: OnConnectionReadyHandler<TMessage>,
          options?: AddHandlerOptions,
        ]
      | [
          event: 'messageReceived',
          handler: OnMessageReceivedHandler<TMessage>,
          options?: AddHandlerOptions,
        ]
  ) {
    const clearHandlers = options?.clearHandlers ?? true;

    if (event === 'connectionClosed') {
      this.handlers.onConnectionClosed = clearHandlers
        ? [handler]
        : [...this.handlers.onConnectionClosed, handler];
    } else if (event === 'connectionReady') {
      this.handlers.onConnectionReady = clearHandlers
        ? [handler]
        : [...this.handlers.onConnectionReady, handler];
    } else if (event === 'messageReceived') {
      this.handlers.onMessageReceived = clearHandlers
        ? [handler]
        : [...this.handlers.onMessageReceived, handler];
    }

    if (clearHandlers) {
      this.onHandlerReplaced?.(event);
    }
  }

  /** Closes the connection and generates a connectionClosed event when done */
  closeConnection() {
    /** This will close the data channel at the same time for both peers, which
     * is more reliable than the connection.onconnectionstatechange. The connectionClosed
     * event will be generated in the dataChannel.onclose handler */
    this.rtcConnection.close();
  }

  /** Completes the connection and generates a connectionReady event when done */
  completeConnection(remoteData: string) {
    const remotePeerData = deserializePeerData(remoteData, this.minification);
    this.rtcConnection.setRemoteDescription(remotePeerData.session);
  }

  /** Joins the connection defined by remoteData and returns the data needed by
   * the other peer to complete the connection */
  async joinConnection(remoteData: string) {
    this._peerMode = PeerMode.joiner;

    const remotePeerData = deserializePeerData(remoteData, this.minification);
    await this.rtcConnection.setRemoteDescription(remotePeerData.session);

    for (const candidate of remotePeerData.candidates) {
      await this.rtcConnection.addIceCandidate(candidate);
    }

    const connectionPromise = new Promise<string>((resolve) => {
      this.peerDataResolver = resolve;
    });

    this.session = await this.rtcConnection.createAnswer();
    /* This will generate several ICE candidates, which will resolve the returned promise */
    await this.rtcConnection.setLocalDescription(this.session);

    return connectionPromise;
  }

  reset() {
    this.localIceCandidates = [];
    this.session = undefined;
    this.peerDataReadyTimeout = undefined;
    this.peerDataResolver = undefined;
    this._peerMode = undefined;
    this._localPeerData = undefined;

    this.rtcConnection = new RTCPeerConnection(this.configuration);

    this.rtcConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.localIceCandidates.push(event.candidate);

        if (this.peerDataReadyTimeout) {
          clearTimeout(this.peerDataReadyTimeout);
        }
        this.peerDataReadyTimeout = window.setTimeout(() => {
          this._localPeerData = serializePeerData(
            { candidates: this.localIceCandidates, session: this.session! },
            this.minification,
          );
          this.peerDataResolver!(this._localPeerData);
        }, 300);
      }
    };

    this.rtcConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setDataChannelHandlers(dataChannel);
    };
  }

  sendMessage(message: TMessage) {
    if (this.dataChannel) {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  /** Starts a connection and returns the data needed by the other peer to join the connection */
  async startConnection() {
    this._peerMode = PeerMode.starter;

    const dataChannel = this.rtcConnection.createDataChannel('data-channel');
    this.setDataChannelHandlers(dataChannel);

    const connectionPromise = new Promise<string>((resolve) => {
      this.peerDataResolver = resolve;
    });

    this.session = await this.rtcConnection.createOffer();
    /* This will generate several ICE candidates, which will resolve the returned promise */
    await this.rtcConnection.setLocalDescription(this.session);

    return connectionPromise;
  }

  protected setDataChannelHandlers(dataChannel: RTCDataChannel) {
    dataChannel.onopen = () => {
      this.dataChannel = dataChannel;
      this.handlers.onConnectionReady.forEach((handler) => handler(this));
    };

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handlers.onMessageReceived.forEach((handler) => handler(data, this));
    };

    dataChannel.onclose = () => {
      this.dataChannel = undefined;
      this.handlers.onConnectionClosed.forEach((handler) => handler(this));
    };
  }
}
