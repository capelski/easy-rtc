export type PeerData = {
    c: RTCIceCandidateInit[];
    s: RTCSessionDescriptionInit;
};

export interface PeerToPeerHandlers {
    onConnectionClosed?: () => void;
    onConnectionReady?: () => void;
    onMessageReceived: (message: string) => void;
}

export class PeerToPeerMessaging {
    protected readonly rtcConnection: RTCPeerConnection = new RTCPeerConnection();
    protected readonly localIceCandidates: RTCIceCandidate[] = [];

    protected session: RTCSessionDescriptionInit | undefined;
    protected dataChannel: RTCDataChannel | undefined;

    protected peerDataReadyTimeout: number | undefined;
    protected peerDataResolver: ((peerData: PeerData) => void) | undefined;

    constructor(protected handlers: PeerToPeerHandlers) {
        this.rtcConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.localIceCandidates.push(event.candidate);

                if (this.peerDataReadyTimeout) {
                    clearTimeout(this.peerDataReadyTimeout);
                }
                this.peerDataReadyTimeout = window.setTimeout(() => {
                    this.peerDataResolver!({ c: this.localIceCandidates, s: this.session! });
                }, 300);
            }
        };

        this.rtcConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            this.setDataChannelHandlers(dataChannel);
        };

        this.rtcConnection.onconnectionstatechange = () => {
            if (
                this.rtcConnection.connectionState === 'connected' &&
                this.handlers.onConnectionReady
            ) {
                this.handlers.onConnectionReady();
            } else if (
                this.rtcConnection.connectionState === 'disconnected' &&
                this.handlers.onConnectionClosed
            ) {
                this.handlers.onConnectionClosed();
            }
        };
    }

    closeConnection() {
        this.rtcConnection.close();
    }

    /** Completes the connection and calls onConnectionReady when done */
    completeConnection(remoteData: PeerData) {
        this.rtcConnection.setRemoteDescription(remoteData.s);
    }

    /** Joins the connection defined by remoteData and returns the data needed by
     * the other peer to complete the connection */
    async joinConnection(remoteData: PeerData) {
        await this.rtcConnection.setRemoteDescription(remoteData.s);

        for (const candidate of remoteData.c) {
            await this.rtcConnection.addIceCandidate(candidate);
        }

        const connectionPromise = new Promise<PeerData>((resolve) => {
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
        const dataChannel = this.rtcConnection.createDataChannel('data-channel');
        this.setDataChannelHandlers(dataChannel);

        const connectionPromise = new Promise<PeerData>((resolve) => {
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
        };

        dataChannel.onmessage = (event) => {
            this.handlers.onMessageReceived(event.data);
        };

        dataChannel.onclose = () => {
            this.dataChannel = undefined;
        };
    }
}
