export type RemoteData = {
    c: RTCIceCandidateInit[];
    s: RTCSessionDescriptionInit;
};

export interface PeerToPeerHandlers {
    onConnectionReady?: () => void;
    onLocalDataReady: (peerData: RemoteData) => void;
    onMessageReceived: (message: string) => void;
}

export class PeerToPeerMessaging {
    protected readonly rtcConnection: RTCPeerConnection = new RTCPeerConnection();
    protected readonly localIceCandidates: RTCIceCandidate[] = [];

    protected session: RTCSessionDescriptionInit | undefined;
    protected dataChannel: RTCDataChannel | undefined;

    constructor(protected handlers: PeerToPeerHandlers) {
        this.rtcConnection.onicecandidate = (event) => {
            /* Each event.candidate generated after creating the offer
            must be added by the peer answering the connection */
            if (event.candidate) {
                this.localIceCandidates.push(event.candidate);
                this.handlers.onLocalDataReady({ c: this.localIceCandidates, s: this.session! });
            }
        };

        /* This method is called when the peer creates a channel */
        this.rtcConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            this.setDataChannelHandlers(dataChannel);
        };

        this.rtcConnection.onconnectionstatechange = () => {
            if (
                this.handlers.onConnectionReady &&
                this.rtcConnection.connectionState === 'connected'
            ) {
                this.handlers.onConnectionReady();
            }
        };
    }

    closeConnection() {
        this.rtcConnection.close();
    }

    async establishConnection(remoteData: RemoteData) {
        await this.rtcConnection.setRemoteDescription(remoteData.s);
        console.log(this.rtcConnection.connectionState, this.rtcConnection.signalingState);
    }

    async joinSession(remoteData: RemoteData) {
        await this.rtcConnection.setRemoteDescription(remoteData.s);

        for (const candidate of remoteData.c) {
            await this.rtcConnection.addIceCandidate(candidate);
        }

        this.session = await this.rtcConnection.createAnswer();
        await this.rtcConnection.setLocalDescription(this.session);
    }

    send(message: string) {
        if (this.dataChannel) {
            this.dataChannel.send(message);
            return true;
        }

        return false;
    }

    async startSession() {
        const dataChannel = this.rtcConnection.createDataChannel('data-channel');
        this.setDataChannelHandlers(dataChannel);

        this.session = await this.rtcConnection.createOffer();
        await this.rtcConnection.setLocalDescription(this.session);
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
