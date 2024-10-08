import { ConnectionStatus } from './connection-status';
import { DefaultMessageType, MessagingHandlers } from './messaging-handlers';
import { PeerMode } from './peer-mode';
import { deserializePeerData, serializePeerData } from './serialization';

export interface MessagingConnectionOptions extends RTCConfiguration {
  /** Encode the peer data generated by startConnection/joinConnection, so the resulting
   * string is shorter. Both peers must use the same value to establish a connection.
   *
   * Example: Using minification when passing the remote peer data via query string parameter
   * will make URLs shorter. */
  minification?: boolean;
}

export class MessagingConnection<TMessage = DefaultMessageType> {
  protected _rtcConnection: RTCPeerConnection = undefined!;
  get rtcConnection(): Omit<
    RTCPeerConnection,
    'onconnectionstatechange' | 'ondatachannel' | 'onicecandidate'
  > {
    return this._rtcConnection;
  }

  protected localIceCandidates: RTCIceCandidate[] = [];

  protected session: RTCSessionDescriptionInit | undefined;
  protected dataChannel: RTCDataChannel | undefined;

  protected configuration: RTCConfiguration | undefined;
  protected minification: boolean | undefined;
  protected peerDataResolve: ((peerData: string) => void) | undefined;
  protected peerDataReject: ((error: Error) => void) | undefined;

  readonly on: MessagingHandlers<TMessage> = {};

  protected _localPeerData: string | undefined;
  get localPeerData() {
    return this._localPeerData;
  }

  protected _peerMode: PeerMode | undefined;
  get peerMode() {
    return this._peerMode;
  }

  protected _status: ConnectionStatus = undefined!;
  get status() {
    return this._status;
  }

  constructor(options: MessagingConnectionOptions = {}) {
    const { minification, ...configuration } = options;
    this.configuration = configuration;
    this.minification = minification;
    this.reset();
  }

  /** Closes the connection and generates a connectionClosed event when done */
  closeConnection() {
    /** This will close the data channel at the same time for both peers, which
     * is more reliable than the connection.onconnectionstatechange. The connectionClosed
     * event will be generated in the dataChannel.onclose handler */
    this._rtcConnection.close();
  }

  /** Completes the connection and generates a connectionReady event when done */
  completeConnection(remoteData: string) {
    const remotePeerData = deserializePeerData(remoteData, this.minification);
    this._rtcConnection.setRemoteDescription(remotePeerData.session);
  }

  /** Joins the connection defined by remoteData and returns the data needed by
   * the other peer to complete the connection */
  async joinConnection(remoteData: string) {
    this._peerMode = PeerMode.joiner;
    this._status = ConnectionStatus.pending;

    const remotePeerData = deserializePeerData(remoteData, this.minification);
    await this._rtcConnection.setRemoteDescription(remotePeerData.session);

    for (const candidate of remotePeerData.candidates) {
      await this._rtcConnection.addIceCandidate(candidate);
    }

    const connectionPromise = new Promise<string>((resolve, reject) => {
      this.peerDataResolve = resolve;
      this.peerDataReject = reject;
    });

    this.session = await this._rtcConnection.createAnswer();
    /* This will generate several ICE candidates, which will resolve the returned promise */
    await this._rtcConnection.setLocalDescription(this.session);

    return connectionPromise;
  }

  reset() {
    this.localIceCandidates = [];
    this.session = undefined;
    this.peerDataResolve = undefined;
    this.peerDataReject = undefined;
    this._peerMode = undefined;
    this._localPeerData = undefined;
    this._status = ConnectionStatus.new;

    this._rtcConnection = new RTCPeerConnection(this.configuration);

    this._rtcConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.localIceCandidates.push(event.candidate);
        this.on.iceCandidate?.(event.candidate);
      } else {
        // WebRTC finished collecting ICE candidates
        if (
          this._peerMode === PeerMode.starter ||
          (this._peerMode === PeerMode.joiner &&
            this._rtcConnection.iceGatheringState === 'complete' &&
            this._rtcConnection.iceConnectionState === 'connected')
        ) {
          this._localPeerData = serializePeerData(
            { candidates: this.localIceCandidates, session: this.session! },
            this.minification,
          );
          this.peerDataResolve!(this._localPeerData);
        } else {
          this.peerDataReject!(
            new Error(
              'Error during ICE gathering. Use chrome://webrtc-internals to troubleshoot the problem',
            ),
          );
          this._status = ConnectionStatus.errored;
        }
      }
    };

    this._rtcConnection.onconnectionstatechange = (event) => {
      if (
        this._rtcConnection.connectionState === 'disconnected' &&
        this._rtcConnection.iceConnectionState === 'disconnected' &&
        this.dataChannel
      ) {
        this._status = ConnectionStatus.closed;
        this.on.connectionClosed?.(this);
      }

      this.on.connectionStateChange?.bind(this._rtcConnection)(event);
    };

    this._rtcConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setDataChannelHandlers(dataChannel);
      this.on.dataChannel?.bind(this._rtcConnection)(event);
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
    this._status = ConnectionStatus.pending;

    const dataChannel = this._rtcConnection.createDataChannel('data-channel');
    this.setDataChannelHandlers(dataChannel);

    const connectionPromise = new Promise<string>((resolve, reject) => {
      this.peerDataResolve = resolve;
      this.peerDataReject = reject;
    });

    this.session = await this._rtcConnection.createOffer();
    /* This will generate several ICE candidates, which will resolve the returned promise */
    await this._rtcConnection.setLocalDescription(this.session);

    return connectionPromise;
  }

  protected setDataChannelHandlers(dataChannel: RTCDataChannel) {
    dataChannel.onopen = () => {
      this.dataChannel = dataChannel;
      this._status = ConnectionStatus.active;
      this.on.connectionReady?.(this);
    };

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.on.messageReceived?.(data, this);
    };

    dataChannel.onclose = () => {
      this.dataChannel = undefined;
      this._status = ConnectionStatus.closed;
      this.on.connectionClosed?.(this);
    };
  }
}
