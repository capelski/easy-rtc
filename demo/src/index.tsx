import QrScanner from 'qr-scanner';
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import QRCode from 'react-qr-code';
import { PeerToPeerHandlers, PeerToPeerMessaging } from '../../src/peer-to-peer-messaging';
import { deserializePeerData, serializePeerData } from './serialization';
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
    const [displayQRCode, setDisplayQRCode] = useState(false);
    const [localPeerData, setLocalPeerData] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [peerMode, setPeerMode] = useState<PeerMode>();
    const [peerToPeerMessaging, setPeerToPeerMessaging] = useState<PeerToPeerMessaging>();
    const [remotePeerData, setRemotePeerData] = useState('');
    const [textMessage, setTextMessage] = useState('');

    const foreignerMessages = useForeignerEvents<Message>(setMessages);

    const eventHandlers: PeerToPeerHandlers = {
        onConnectionClosed: reset,
        onConnectionReady: () => setConnectionReady(true),
        onMessageReceived: (message) =>
            foreignerMessages.registerEvent({ sender: 'They', text: message }),
    };

    const startConnection = async () => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.starter);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        const peerData = await nextPeerToPeerConnection.startConnection();
        setLocalPeerData(serializePeerData(peerData));
    };

    const copyConnectionCode = () => {
        navigator.clipboard.writeText(localPeerData);
    };

    const copyConnectionLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.append(remoteDataParameterName, localPeerData);
        navigator.clipboard.writeText(url.toString());
    };

    const joinConnection = async () => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.joiner);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        const peerData = await nextPeerToPeerConnection.joinConnection(
            deserializePeerData(remotePeerData),
        );
        setLocalPeerData(serializePeerData(peerData));
    };

    const copyVerificationCode = () => {
        navigator.clipboard.writeText(localPeerData);
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

    const completeConnection = () => {
        peerToPeerMessaging?.completeConnection(deserializePeerData(remotePeerData));
    };

    const videoRef = useRef(null);

    useEffect(() => {
        const params = new URL(document.location.toString()).searchParams;
        const data = params.get(remoteDataParameterName);
        if (data) {
            setRemotePeerData(data);
        }
    }, []);

    foreignerMessages.processEvents(messages);

    function reset() {
        setConnectionReady(false);
        setDisplayQRCode(false);
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
                    {!peerMode ? (
                        <div>
                            <p>
                                <button onClick={startConnection}>Start connection</button>
                            </p>
                            <hr />
                            <p>Connection code</p>
                            <textarea
                                onChange={(event) => {
                                    setRemotePeerData(event.target.value);
                                }}
                                rows={3}
                                style={{ width: '100%' }}
                                value={remotePeerData}
                            ></textarea>
                            <p>
                                <button disabled={!remotePeerData} onClick={joinConnection}>
                                    Join connection
                                </button>
                            </p>
                        </div>
                    ) : !localPeerData ? (
                        <p>Processing...</p>
                    ) : peerMode === PeerMode.starter ? (
                        <div>
                            <p>Connection code</p>
                            <textarea
                                disabled={true}
                                rows={3}
                                style={{ width: '100%' }}
                                value={localPeerData}
                            ></textarea>
                            <p>
                                <button onClick={copyConnectionCode} type="button">
                                    Copy connection code
                                </button>
                                <button onClick={copyConnectionLink} type="button">
                                    Copy connection link
                                </button>
                            </p>
                            <p>Verification code</p>
                            <textarea
                                onChange={(event) => {
                                    setRemotePeerData(event.target.value);
                                }}
                                rows={3}
                                style={{ width: '100%' }}
                                value={remotePeerData}
                            ></textarea>
                            <p>
                                <button
                                    onClick={completeConnection}
                                    type="button"
                                    disabled={!remotePeerData}
                                >
                                    Complete connection
                                </button>
                                <button onClick={scanQrHandler} type="button">
                                    Scan QR
                                </button>
                            </p>

                            <video ref={videoRef} width="100%"></video>
                        </div>
                    ) : (
                        <div>
                            <textarea
                                disabled={true}
                                rows={3}
                                style={{ width: '100%' }}
                                value={localPeerData}
                            ></textarea>
                            <p>
                                <button onClick={copyVerificationCode} type="button">
                                    Copy verification code
                                </button>
                                <button
                                    disabled={displayQRCode}
                                    onClick={() => setDisplayQRCode(true)}
                                    type="button"
                                >
                                    Display QR code
                                </button>
                            </p>
                            {displayQRCode && (
                                <QRCode
                                    value={localPeerData}
                                    size={0.9 * Math.min(window.innerHeight, window.innerWidth)}
                                    style={{ width: '100%' }}
                                />
                            )}
                        </div>
                    )}
                </React.Fragment>
            )}
        </div>
    );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
