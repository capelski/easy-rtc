import { MessagingConnection } from './messaging-connection';

export type DefaultMessageType = string;

export type OnConnectionClosedHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;

export type OnConnectionReadyHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;

export type OnIceCandidate = (iceCandidate: RTCIceCandidate) => void;

export type OnMessageReceivedHandler<TMessage = DefaultMessageType> = (
  message: TMessage,
  connection: MessagingConnection<TMessage>,
) => void;

export type MessagingHandlers<TMessage = DefaultMessageType> = {
  connectionClosed?: OnConnectionClosedHandler<TMessage>;
  connectionReady?: OnConnectionReadyHandler<TMessage>;
  connectionStateChange?: RTCPeerConnection['onconnectionstatechange'];
  dataChannel?: RTCPeerConnection['ondatachannel'];
  iceCandidate?: OnIceCandidate;
  messageReceived?: OnMessageReceivedHandler<TMessage>;
};
