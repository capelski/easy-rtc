import {
  ConnectionStatus,
  MessagingConnection,
  PeerMode,
  useMessagingConnection,
} from '@easy-rtc/react';
import QrScanner from 'qr-scanner';
import React, { useEffect, useRef, useState } from 'react';
import { useExternalEvents } from 'react-external-events';
import QRCode from 'react-qr-code';

export const remoteDataParameterName = 'd';

interface Message {
  sender: 'You' | 'They';
  text: string;
}

export type ConnectionProps = {
  connection: MessagingConnection;
};

export const Connection: React.FC<ConnectionProps> = (props) => {
  const [displayRtcActivity, setDisplayRtcActivity] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [remotePeerData, setRemotePeerData] = useState('');
  const [rtcActivity, setRtcActivity] = useState<string[]>([]);
  const [textMessage, setTextMessage] = useState('');
  const [useQRCode, setUseQRCode] = useState(false);

  const externalMessages = useExternalEvents<string>();
  const messaging = useMessagingConnection(props.connection);

  useEffect(() => {
    const logConnectionState = (message: string) => () => {
      externalMessages.registerEvent(
        `${message} - connectionState: ${messaging.rtcConnection.connectionState} / iceConnectionState: ${messaging.rtcConnection.iceConnectionState} / iceGatheringState: ${messaging.rtcConnection.iceGatheringState} / state: ${messaging.rtcConnection.sctp?.state} / signalingState: ${messaging.rtcConnection.signalingState}`,
      );
    };

    messaging.on('connectionStateChange', logConnectionState('Connection state change'));

    messaging.on('iceCandidate', (event) => {
      externalMessages.registerEvent(
        `ICE candidate - protocol: ${event.candidate?.protocol} / type: ${event.candidate?.type} / address: ${event.candidate?.address} / relatedAddress: ${event.candidate?.relatedAddress}`,
      );
    });

    messaging.on('iceCandidateError', (event) => {
      externalMessages.registerEvent(
        `ICE candidate error - errorCode: ${event.errorCode} / errorText: ${event.errorText} / address: ${event.address}`,
      );
    });

    messaging.on('iceConnectionStateChange', logConnectionState('ICE Connection state change'));

    messaging.on('iceGatheringStateChange', logConnectionState('ICE Gathering state change'));

    messaging.on('negotiationNeeded', logConnectionState('Negotiation needed'));

    messaging.on('signalingStateChange', logConnectionState('Signaling state change'));
  }, [rtcActivity]);

  externalMessages.processNext((message) => {
    setRtcActivity([message, ...rtcActivity]);
  });

  useEffect(() => {
    // The event handler needs to be re-declared every time messages changes
    messaging.on('messageReceived', (message) => {
      setMessages([...messages, { sender: 'They', text: message }]);
    });
  }, [messages]);

  const reset = () => {
    setMessages([]);
    setRemotePeerData('');
    setRtcActivity([]);
    setTextMessage('');
    setUseQRCode(false);
    messaging.reset();
  };

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
    <div style={{ backgroundColor: '#e6f3f7', margin: 8, padding: 8 }}>
      {(messaging.status === ConnectionStatus.new ||
        messaging.status === ConnectionStatus.pending) && (
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

      {(messaging.status === ConnectionStatus.active ||
        messaging.status === ConnectionStatus.closed) && (
        <React.Fragment>
          <p>
            <span>Messages</span>
            <textarea
              disabled={messaging.status === ConnectionStatus.closed}
              onChange={(event) => {
                setTextMessage(event.target.value);
              }}
              rows={3}
              style={{ marginBottom: 16, width: '100%' }}
              value={textMessage}
            ></textarea>
            <button
              disabled={messaging.status === ConnectionStatus.closed || !textMessage}
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
              disabled={messaging.status === ConnectionStatus.closed}
              onClick={() => {
                messaging.closeConnection();
              }}
            >
              Close connection
            </button>
            <button disabled={messaging.status !== ConnectionStatus.closed} onClick={reset}>
              Reset
            </button>
          </p>
        </React.Fragment>
      )}

      {messaging.status === ConnectionStatus.errored && (
        <div>
          <p>Could not establish connection</p>
          <p>
            <button onClick={reset}>Reset</button>
          </p>
        </div>
      )}

      <div>
        <button
          onClick={() => {
            setDisplayRtcActivity(!displayRtcActivity);
          }}
          type="button"
        >
          {displayRtcActivity ? 'Hide' : 'Show'} RTC activity
        </button>
        {displayRtcActivity && (
          <div>
            <p style={{ fontStyle: 'italic' }}>
              <span>
                Connection state:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {messaging.rtcConnection.connectionState}
                </span>{' '}
                /{' '}
              </span>
              <span>
                ICE connection state:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {messaging.rtcConnection.iceConnectionState}
                </span>{' '}
                /{' '}
              </span>
              <span>
                ICE gathering state:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {messaging.rtcConnection.iceGatheringState}
                </span>{' '}
                /{' '}
              </span>
              <span>
                SCTP state:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {messaging.rtcConnection.sctp?.state || '-'}
                </span>{' '}
                /{' '}
              </span>
              <span>
                Signaling state:{' '}
                <span style={{ fontWeight: 'bold' }}>{messaging.rtcConnection.signalingState}</span>
              </span>
            </p>
            {rtcActivity.map((text, index) => (
              <div key={index}>{text}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
