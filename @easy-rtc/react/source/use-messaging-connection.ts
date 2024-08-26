import {
  DefaultMessageType,
  MessagingConnection,
  MessagingConnectionOptions,
  OnConnectionClosedHandler,
  OnConnectionReadyHandler,
  OnMessageReceivedHandler,
  PeerMode,
} from '@easy-rtc/core';
import { useMemo, useState } from 'react';
import { ReactMessagingHandlers } from './react-messaging-handlers';

export type MessagingConnectionReact<TMessage = DefaultMessageType> = Pick<
  MessagingConnection<TMessage>,
  | 'closeConnection'
  | 'completeConnection'
  | 'joinConnection'
  | 'reset'
  | 'sendMessage'
  | 'startConnection'
> & {
  readonly hasCompletedConnection: boolean;
  readonly isActive: boolean;
  readonly localPeerData: string;

  on(event: 'connectionClosed', handler: OnConnectionClosedHandler<TMessage>): void;
  on(event: 'connectionReady', handler: OnConnectionReadyHandler<TMessage>): void;
  on(event: 'connectionStateChange', handler: RTCPeerConnection['onconnectionstatechange']): void;
  on(event: 'dataChannel', handler: RTCPeerConnection['ondatachannel']): void;
  on(event: 'iceCandidate', handler: RTCPeerConnection['onicecandidate']): void;
  on(event: 'iceCandidateError', handler: RTCPeerConnection['onicecandidateerror']): void;
  on(
    event: 'iceConnectionStateChange',
    handler: RTCPeerConnection['oniceconnectionstatechange'],
  ): void;
  on(
    event: 'iceGatheringStateChange',
    handler: RTCPeerConnection['onicegatheringstatechange'],
  ): void;
  on(event: 'messageReceived', handler: OnMessageReceivedHandler<TMessage>): void;
  on(event: 'negotiationNeeded', handler: RTCPeerConnection['onnegotiationneeded']): void;
  on(event: 'signalingStateChange', handler: RTCPeerConnection['onsignalingstatechange']): void;

  readonly peerMode: PeerMode | undefined;
  readonly rtcConnection: Omit<
    MessagingConnection<TMessage>['rtcConnection'],
    | 'onconnectionstatechange'
    | 'ondatachannel'
    | 'onicecandidate'
    | 'onicecandidateerror'
    | 'oniceconnectionstatechange'
    | 'onicegatheringstatechange'
    | 'onnegotiationneeded'
    | 'onsignalingstatechange'
  >;
};

export function useMessagingConnection<
  TMessage = DefaultMessageType,
>(): MessagingConnectionReact<TMessage>;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  options: MessagingConnectionOptions,
): MessagingConnectionReact<TMessage>;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  connection: MessagingConnection<TMessage>,
): MessagingConnectionReact<TMessage>;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  connectionOrOptions?: MessagingConnection<TMessage> | MessagingConnectionOptions,
): MessagingConnectionReact<TMessage> {
  const [hasCompletedConnection, setHasCompletedConnection] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [localPeerData, setLocalPeerData] = useState('');
  const [peerMode, setPeerMode] = useState<PeerMode>();

  const [, forceUpdate] = useState<{}>();

  const {
    closeConnection,
    completeConnection,
    joinConnection,
    on,
    reset,
    sendMessage,
    startConnection,
    rtcConnection,
  } = useMemo(() => {
    const connection: MessagingConnection<TMessage> =
      connectionOrOptions instanceof MessagingConnection
        ? connectionOrOptions
        : new MessagingConnection<TMessage>(connectionOrOptions);

    const handlers: ReactMessagingHandlers<TMessage> = {
      ...connection.on,
    };

    connection.on.connectionClosed = () => {
      setIsActive(false);
      handlers.connectionClosed?.(connection);
    };

    connection.on.connectionReady = () => {
      setHasCompletedConnection(true);
      setIsActive(true);
      handlers.connectionReady?.(connection);
    };

    const castConnection = connection.rtcConnection as RTCPeerConnection;

    connection.rtcConnection.onconnectionstatechange = function (event) {
      forceUpdate({});
      handlers.connectionStateChange?.bind(castConnection)(event);
    };

    connection.on.dataChannel = function (event) {
      forceUpdate({});
      handlers.dataChannel?.bind(castConnection)(event);
    };

    connection.on.iceCandidate = function (event) {
      forceUpdate({});
      handlers.iceCandidate?.bind(castConnection)(event);
    };

    connection.rtcConnection.onicecandidateerror = function (event) {
      forceUpdate({});
      handlers.iceCandidateError?.bind(castConnection)(event);
    };

    connection.rtcConnection.oniceconnectionstatechange = function (event) {
      forceUpdate({});
      handlers.iceConnectionStateChange?.bind(castConnection)(event);
    };

    connection.rtcConnection.onicegatheringstatechange = function (event) {
      forceUpdate({});
      handlers.iceGatheringStateChange?.bind(castConnection)(event);
    };

    connection.rtcConnection.onnegotiationneeded = function (event) {
      forceUpdate({});
      handlers.negotiationNeeded?.bind(castConnection)(event);
    };

    connection.rtcConnection.onsignalingstatechange = function (event) {
      forceUpdate({});
      handlers.signalingStateChange?.bind(castConnection)(event);
    };

    const startConnection = async () => {
      const connectionPromise = connection.startConnection();
      setPeerMode(connection.peerMode);
      const nextLocalPeerData = await connectionPromise;
      setLocalPeerData(nextLocalPeerData);
      return nextLocalPeerData;
    };

    const joinConnection = async (remotePeerData: string) => {
      const connectionPromise = connection.joinConnection(remotePeerData);
      setPeerMode(connection.peerMode);
      const nextLocalPeerData = await connectionPromise;
      setLocalPeerData(nextLocalPeerData);
      return nextLocalPeerData;
    };

    const completeConnection: MessagingConnection<TMessage>['completeConnection'] =
      connection.completeConnection.bind(connection);

    const sendMessage: MessagingConnection<TMessage>['sendMessage'] =
      connection.sendMessage.bind(connection);

    const closeConnection: MessagingConnection<TMessage>['closeConnection'] =
      connection.closeConnection.bind(connection);

    function on(event: 'connectionClosed', handler: OnConnectionClosedHandler<TMessage>): void;
    function on(event: 'connectionReady', handler: OnConnectionReadyHandler<TMessage>): void;
    function on(
      event: 'connectionStateChange',
      handler: RTCPeerConnection['onconnectionstatechange'],
    ): void;
    function on(event: 'dataChannel', handler: RTCPeerConnection['ondatachannel']): void;
    function on(event: 'iceCandidate', handler: RTCPeerConnection['onicecandidate']): void;
    function on(
      event: 'iceCandidateError',
      handler: RTCPeerConnection['onicecandidateerror'],
    ): void;
    function on(
      event: 'iceConnectionStateChange',
      handler: RTCPeerConnection['oniceconnectionstatechange'],
    ): void;
    function on(
      event: 'iceGatheringStateChange',
      handler: RTCPeerConnection['onicegatheringstatechange'],
    ): void;
    function on(event: 'messageReceived', handler: OnMessageReceivedHandler<TMessage>): void;
    function on(
      event: 'negotiationNeeded',
      handler: RTCPeerConnection['onnegotiationneeded'],
    ): void;
    function on(
      event: 'signalingStateChange',
      handler: RTCPeerConnection['onsignalingstatechange'],
    ): void;
    function on(
      event:
        | 'connectionClosed'
        | 'connectionReady'
        | 'connectionStateChange'
        | 'dataChannel'
        | 'iceCandidate'
        | 'iceCandidateError'
        | 'iceConnectionStateChange'
        | 'iceGatheringStateChange'
        | 'messageReceived'
        | 'negotiationNeeded'
        | 'signalingStateChange',
      handler: any,
    ) {
      handlers[event] = handler;
    }

    const reset = () => {
      connection.reset();
      setHasCompletedConnection(false);
      setIsActive(false);
      setLocalPeerData('');
      setPeerMode(connection.peerMode);
    };

    return {
      closeConnection,
      completeConnection,
      joinConnection,
      on,
      reset,
      sendMessage,
      startConnection,
      rtcConnection: connection.rtcConnection,
    };
  }, []);

  return {
    // Handlers
    closeConnection,
    completeConnection,
    joinConnection,
    on,
    reset,
    sendMessage,
    startConnection,
    // State
    hasCompletedConnection,
    isActive,
    localPeerData,
    peerMode,
    rtcConnection,
  };
}
