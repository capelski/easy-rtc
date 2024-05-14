import QrScanner from 'qr-scanner';
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import QRCode from 'react-qr-code';
import {
    PeerData,
    PeerToPeerHandlers,
    PeerToPeerMessaging,
} from '../../src/peer-to-peer-messaging';
import { compressRemoteData, decompressRemoteData } from './compression';
import { useForeignerEvents } from './use-foreigner-events';

export const remoteDataParameterName = 'd';

interface Message {
    sender: 'You' | 'They';
    text: string;
}

enum PeerMode {
    joiner = 'joiner',
    starter = 'starter',
}

function App() {
    const [connectionReady, setConnectionReady] = useState(false);
    const [localPeerData, setLocalPeerData] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [peerMode, setPeerMode] = useState<PeerMode>();
    const [peerToPeerMessaging, setPeerToPeerMessaging] = useState<PeerToPeerMessaging>();
    const [remotePeerData, setRemotePeerData] = useState('');
    const [textMessage, setTextMessage] = useState('');

    const foreignerMessages = useForeignerEvents<Message>(setMessages);

    const eventHandlers: PeerToPeerHandlers = {
        onConnectionReady: () => setConnectionReady(true),
        onMessageReceived: (message) =>
            foreignerMessages.registerEvent({ sender: 'They', text: message }),
    };

    const startConnection = async () => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.starter);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        const peerData = await nextPeerToPeerConnection.startConnection();
        setLocalPeerData(JSON.stringify(peerData));
    };

    const copyConnectionLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.append(remoteDataParameterName, compressRemoteData(localPeerData));
        navigator.clipboard.writeText(url.toString());
    };

    const joinConnection = async (data: string) => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.joiner);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        const parsedData: PeerData = JSON.parse(data);
        const peerData = await nextPeerToPeerConnection.joinConnection(parsedData);
        setLocalPeerData(JSON.stringify(peerData));
    };

    const copyVerificationCode = () => {
        navigator.clipboard.writeText(compressRemoteData(localPeerData));
    };

    const scanQrHandler = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
        });

        const qrScanner = new QrScanner(
            videoRef.current!,
            (result) => {
                setRemotePeerData(result.data);
                qrScanner.stop();
                stream.getTracks().forEach((t) => t.stop());
            },
            {},
        );

        qrScanner.start();
    };

    const completeConnection = (data: string) => {
        const parsedData: PeerData = JSON.parse(decompressRemoteData(data));
        peerToPeerMessaging?.completeConnection(parsedData);
    };

    const videoRef = useRef(null);

    useEffect(() => {
        const params = new URL(document.location.toString()).searchParams;
        const data = params.get(remoteDataParameterName);
        if (data) {
            setRemotePeerData(data);
            joinConnection(decompressRemoteData(data));
        }
    }, []);

    foreignerMessages.processEvents(messages);

    function reset() {
        setConnectionReady(false);
        setLocalPeerData('');
        setMessages([]);
        setPeerMode(undefined);
        setPeerToPeerMessaging(undefined);
        setRemotePeerData('');
        setTextMessage('');
    }

    return (
        <div>
            {connectionReady ? (
                <React.Fragment>
                    <p>
                        <span>Messages</span>
                        <textarea
                            onChange={(event) => {
                                setTextMessage(event.target.value);
                            }}
                            rows={3}
                            style={{ marginBottom: 16, width: '100%' }}
                            value={textMessage}
                        ></textarea>
                        <button
                            onClick={() => {
                                setMessages([...messages, { sender: 'You', text: textMessage }]);
                                setTextMessage('');
                                peerToPeerMessaging?.send(textMessage);
                            }}
                        >
                            Send
                        </button>
                    </p>
                    <div>
                        {messages.map((message, index) => (
                            <p key={`message-${index}`}>
                                {message.sender}: {message.text}
                            </p>
                        ))}
                    </div>
                    <p>
                        <button
                            onClick={() => {
                                peerToPeerMessaging?.closeConnection();
                                reset();
                            }}
                        >
                            Close connection
                        </button>
                    </p>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    {peerMode !== PeerMode.joiner && !localPeerData && (
                        <p>
                            <button onClick={startConnection}>Start connection</button>
                        </p>
                    )}

                    {localPeerData &&
                        (peerMode === PeerMode.joiner ? (
                            <div>
                                <button onClick={copyVerificationCode} type="button">
                                    Copy verification code
                                </button>
                                <QRCode
                                    value={compressRemoteData(localPeerData)}
                                    size={0.9 * Math.min(window.innerHeight, window.innerWidth)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        ) : (
                            <div>
                                <p>
                                    <button onClick={copyConnectionLink} type="button">
                                        Copy connection link
                                    </button>
                                </p>
                                <p>
                                    Verification code
                                    <textarea
                                        onChange={(event) => {
                                            setRemotePeerData(event.target.value);
                                        }}
                                        rows={3}
                                        style={{ marginBottom: 16, width: '100%' }}
                                        value={remotePeerData}
                                    ></textarea>
                                    <button onClick={scanQrHandler} type="button">
                                        Scan QR
                                    </button>
                                </p>
                                <p>
                                    <button
                                        onClick={() => completeConnection(remotePeerData)}
                                        type="button"
                                        disabled={!remotePeerData}
                                    >
                                        Complete connection
                                    </button>
                                </p>

                                <video ref={videoRef} width="100%"></video>
                            </div>
                        ))}
                </React.Fragment>
            )}
        </div>
    );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
