import { PeerMode, useMessagingConnection } from '@easy-rtc/react';
import QrScanner from 'qr-scanner';
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { useExternalEvents } from 'react-external-events';
import QRCode from 'react-qr-code';

export const remoteDataParameterName = 'd';

interface Message {
  sender: 'You' | 'They';
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [remotePeerData, setRemotePeerData] = useState('');
  const [textMessage, setTextMessage] = useState('');
  const [useQRCode, setUseQRCode] = useState(false);

  const externalMessages = useExternalEvents<Message>();
  externalMessages.processNext((message) => {
    setMessages([...messages, message]);
  });

  const reset = () => {
    setMessages([]);
    setRemotePeerData('');
    setTextMessage('');
    setUseQRCode(false);
    messaging.reset();
  };

  const messaging = useMessagingConnection(
    {
      onMessageReceived: (message) =>
        externalMessages.registerEvent({ sender: 'They', text: message }),
    },
    { minification: true },
  );

  const videoRef = useRef(null);

  const copyConnectionCode = () => {
    navigator.clipboard.writeText(messaging.localPeerData);
  };

  const copyConnectionLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.append(remoteDataParameterName, messaging.localPeerData);
    navigator.clipboard.writeText(url.toString());
  };

  const copyVerificationCode = () => {
    navigator.clipboard.writeText(messaging.localPeerData);
  };

  const scanQrHandler = async () => {
    setUseQRCode(true);

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

  useEffect(() => {
    const params = new URL(document.location.toString()).searchParams;
    const data = params.get(remoteDataParameterName);
    if (data) {
      setRemotePeerData(data);
      window.history.pushState({}, '', window.location.origin + window.location.pathname);
    }
  }, []);

  return (
    <div>
      {!messaging.isActive && !messaging.hasCompletedConnection && (
        <React.Fragment>
          {!messaging.peerMode ? (
            <div>
              <p>
                <button onClick={messaging.startConnection}>Start connection</button>
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
                <button
                  disabled={!remotePeerData}
                  onClick={() => messaging.joinConnection(remotePeerData)}
                >
                  Join connection
                </button>
              </p>
            </div>
          ) : !messaging.localPeerData ? (
            <p>Processing...</p>
          ) : messaging.peerMode === PeerMode.starter ? (
            <div>
              <p>Connection code</p>
              <textarea
                disabled={true}
                rows={3}
                style={{ width: '100%' }}
                value={messaging.localPeerData}
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
                  onClick={() => messaging.completeConnection(remotePeerData)}
                  type="button"
                  disabled={!remotePeerData}
                >
                  Complete connection
                </button>
                <button onClick={scanQrHandler} type="button">
                  Scan QR
                </button>
              </p>

              {useQRCode && <video ref={videoRef} width="100%"></video>}
            </div>
          ) : (
            <div>
              <textarea
                disabled={true}
                rows={3}
                style={{ width: '100%' }}
                value={messaging.localPeerData}
              ></textarea>
              <p>
                <button onClick={copyVerificationCode} type="button">
                  Copy verification code
                </button>
                <button disabled={useQRCode} onClick={() => setUseQRCode(true)} type="button">
                  Display QR code
                </button>
              </p>
              {useQRCode && (
                <QRCode
                  value={messaging.localPeerData}
                  size={0.9 * Math.min(window.innerHeight, window.innerWidth)}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          )}
        </React.Fragment>
      )}

      {messaging.hasCompletedConnection && (
        <React.Fragment>
          <p>
            <span>Messages</span>
            <textarea
              disabled={!messaging.isActive}
              onChange={(event) => {
                setTextMessage(event.target.value);
              }}
              rows={3}
              style={{ marginBottom: 16, width: '100%' }}
              value={textMessage}
            ></textarea>
            <button
              disabled={!messaging.isActive}
              onClick={() => {
                setMessages([...messages, { sender: 'You', text: textMessage }]);
                messaging.sendMessage(textMessage);
                setTextMessage('');
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
              disabled={!messaging.isActive}
              onClick={() => {
                messaging.closeConnection();
              }}
            >
              Close connection
            </button>
            <button disabled={messaging.isActive} onClick={reset}>
              Reset
            </button>
          </p>
        </React.Fragment>
      )}
    </div>
  );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
