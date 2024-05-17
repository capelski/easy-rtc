import { deserializePeerData, serializePeerData } from './serialization';

export interface PeerToPeerParameters {
    onConnectionClosed?: () => void;
    onConnectionReady?: (instance: PeerToPeerMessaging) => void;
    onMessageReceived: (message: string, instance: PeerToPeerMessaging) => void;
    useCompression?: boolean;
}

export enum PeerMode {
    joiner = 'joiner',
    starter = 'starter',
}

export class PeerToPeerMessaging {
    protected readonly rtcConnection: RTCPeerConnection = new RTCPeerConnection();
    protected readonly localIceCandidates: RTCIceCandidate[] = [];

    protected session: RTCSessionDescriptionInit | undefined;
    protected dataChannel: RTCDataChannel | undefined;

    protected peerDataReadyTimeout: number | undefined;
    protected peerDataResolver: ((peerData: string) => void) | undefined;

    protected _peerMode: PeerMode | undefined;
    get peerMode() {
        return this._peerMode;
    }

    constructor(public readonly params: PeerToPeerParameters) {
        this.rtcConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.localIceCandidates.push(event.candidate);

                if (this.peerDataReadyTimeout) {
                    clearTimeout(this.peerDataReadyTimeout);
                }
                this.peerDataReadyTimeout = window.setTimeout(() => {
                    this.peerDataResolver!(
                        serializePeerData(
                            { candidates: this.localIceCandidates, session: this.session! },
                            this.params.useCompression,
                        ),
                    );
                }, 300);
            }
        };

        this.rtcConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            this.setDataChannelHandlers(dataChannel);
        };

        this.rtcConnection.onconnectionstatechange = () => {
            if (
                this.rtcConnection.connectionState === 'disconnected' &&
                this.params.onConnectionClosed
            ) {
                this.params.onConnectionClosed();
            }
        };
    }

    /** Closes the connection and calls onConnectionClosed when done */
    closeConnection() {
        this.rtcConnection.close();
        this.params.onConnectionClosed?.();
    }

    /** Completes the connection and calls onConnectionReady when done */
    completeConnection(remoteData: string) {
        const remotePeerData = deserializePeerData(remoteData, this.params.useCompression);
        this.rtcConnection.setRemoteDescription(remotePeerData.session);
    }

    /** Joins the connection defined by remoteData and returns the data needed by
     * the other peer to complete the connection */
    async joinConnection(remoteData: string) {
        this._peerMode = PeerMode.joiner;

        const remotePeerData = deserializePeerData(remoteData, this.params.useCompression);
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

    send(message: string) {
        if (this.dataChannel) {
            this.dataChannel.send(message);
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

    private setDataChannelHandlers(dataChannel: RTCDataChannel) {
        dataChannel.onopen = () => {
            this.dataChannel = dataChannel;
            if (this.params.onConnectionReady) {
                this.params.onConnectionReady(this);
            }
        };

        dataChannel.onmessage = (event) => {
            this.params.onMessageReceived(event.data, this);
        };

        dataChannel.onclose = () => {
            this.dataChannel = undefined;
        };
    }
}
