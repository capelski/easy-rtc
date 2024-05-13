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
    const [messages, setMessages] = useState<Message[]>([]);
    const [peerMode, setPeerMode] = useState<PeerMode>();
    const [peerToPeerMessaging, setPeerToPeerMessaging] = useState<PeerToPeerMessaging>();
    const [localData, setLocalData] = useState('');
    const [textMessage, setTextMessage] = useState('');

    const foreignerMessages = useForeignerEvents<Message>(setMessages);

    const eventHandlers: PeerToPeerHandlers = {
        onConnectionReady: () => setConnectionReady(true),
        onLocalDataReady: (peerData) => setLocalData(JSON.stringify(peerData)),
        onMessageReceived: (message) =>
            foreignerMessages.registerEvent({ sender: 'They', text: message }),
    };

    const startSessionHandler = () => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.starter);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        nextPeerToPeerConnection.startSession();
    };

    const joinSessionHandler = (data: string) => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(eventHandlers);
        setPeerMode(PeerMode.joiner);
        setPeerToPeerMessaging(nextPeerToPeerConnection);

        const parsedData: PeerData = JSON.parse(data);
        nextPeerToPeerConnection.joinSession(parsedData);
    };

    const videoRef = useRef(null);

    useEffect(() => {
        const params = new URL(document.location.toString()).searchParams;
        const data = params.get(remoteDataParameterName);
        if (data) {
            joinSessionHandler(decompressRemoteData(data));
        }
    }, []);

    useEffect(() => {
        if (videoRef.current && localData) {
            const qrScanner = new QrScanner(
                videoRef.current,
                (result) => {
                    const parsedData: PeerData = JSON.parse(decompressRemoteData(result.data));
                    peerToPeerMessaging?.establishConnection(parsedData);

                    qrScanner.stop();
                },
                {},
            );
            qrScanner.start();
        }
    }, [videoRef.current]);

    foreignerMessages.processEvents(messages);

    function reset() {
        setConnectionReady(false);
        setLocalData('');
        setMessages([]);
        setPeerMode(undefined);
        setPeerToPeerMessaging(undefined);
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
                    {peerMode !== PeerMode.joiner && !localData && (
                        <p>
                            <button onClick={startSessionHandler}>Start session</button>
                        </p>
                    )}

                    {localData &&
                        (peerMode === PeerMode.joiner ? (
                            <QRCode
                                value={compressRemoteData(localData)}
                                size={0.9 * Math.min(window.innerHeight, window.innerWidth)}
                                style={{ width: '100%' }}
                            />
                        ) : (
                            <p>
                                <button
                                    onClick={() => {
                                        const url = new URL(window.location.href);
                                        url.searchParams.append(
                                            remoteDataParameterName,
                                            compressRemoteData(localData),
                                        );
                                        navigator.clipboard.writeText(url.toString());
                                    }}
                                    type="button"
                                >
                                    Copy session link
                                </button>
                            </p>
                        ))}

                    {peerMode === PeerMode.starter && localData && (
                        <p>
                            <video ref={videoRef} width="100%"></video>
                        </p>
                    )}
                </React.Fragment>
            )}
        </div>
    );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
