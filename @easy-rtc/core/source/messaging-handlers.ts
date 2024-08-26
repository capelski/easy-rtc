import { MessagingConnection } from './messaging-connection';

export type DefaultMessageType = string;

export type OnConnectionClosedHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;
export type OnConnectionReadyHandler<TMessage = DefaultMessageType> = (
  connection: MessagingConnection<TMessage>,
) => void;
export type OnMessageReceivedHandler<TMessage = DefaultMessageType> = (
  message: TMessage,
  connection: MessagingConnection<TMessage>,
) => void;

export type MessagingHandlers<TMessage = DefaultMessageType> = {
  connectionClosed?: OnConnectionClosedHandler<TMessage>;
  connectionReady?: OnConnectionReadyHandler<TMessage>;
  dataChannel?: RTCPeerConnection['ondatachannel'];
  iceCandidate?: RTCPeerConnection['onicecandidate'];
  messageReceived?: OnMessageReceivedHandler<TMessage>;
};
