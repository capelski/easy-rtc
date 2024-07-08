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
  readonly peerMode: PeerMode | undefined;
  readonly localPeerData: string;
  setHandler(event: 'onConnectionClosed', handler: OnConnectionClosedHandler<TMessage>): void;
  setHandler(event: 'onConnectionReady', handler: OnConnectionReadyHandler<TMessage>): void;
  setHandler(event: 'onMessageReceived', handler: OnMessageReceivedHandler<TMessage>): void;
};

export function useMessagingConnection<
  TMessage = DefaultMessageType,
>(): MessagingConnectionReact<TMessage>;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  options: MessagingConnectionOptions<TMessage>,
): MessagingConnectionReact;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  connection: MessagingConnection<TMessage>,
): MessagingConnectionReact<TMessage>;
export function useMessagingConnection<TMessage = DefaultMessageType>(
  connectionOrOptions?: MessagingConnection<TMessage> | MessagingConnectionOptions<TMessage>,
): MessagingConnectionReact<TMessage> {
  const [hasCompletedConnection, setHasCompletedConnection] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [localPeerData, setLocalPeerData] = useState('');
  const [peerMode, setPeerMode] = useState<PeerMode>();

  const {
    closeConnection,
    completeConnection,
    joinConnection,
    reset,
    sendMessage,
    setHandler,
    startConnection,
  } = useMemo(() => {
    const connection =
      connectionOrOptions instanceof MessagingConnection
        ? connectionOrOptions
        : new MessagingConnection<TMessage>(connectionOrOptions);

    const originalHandlers = connection.handlers;
    connection.handlers = {
      onConnectionClosed: (connection) => {
        originalHandlers.onConnectionClosed?.(connection);
        setIsActive(false);
      },
      onConnectionReady: (connection) => {
        originalHandlers.onConnectionReady?.(connection);
        setHasCompletedConnection(true);
        setIsActive(true);
      },
      onMessageReceived: (message, connection) => {
        originalHandlers.onMessageReceived?.(message, connection);
      },
    };

    function setHandler(
      event: 'onConnectionClosed',
      handler: OnConnectionClosedHandler<TMessage>,
    ): void;
    function setHandler(
      event: 'onConnectionReady',
      handler: OnConnectionReadyHandler<TMessage>,
    ): void;
    function setHandler(
      event: 'onMessageReceived',
      handler: OnMessageReceivedHandler<TMessage>,
    ): void;
    function setHandler(
      event: 'onConnectionClosed' | 'onConnectionReady' | 'onMessageReceived',
      handler: any,
    ) {
      originalHandlers[event] = handler;
    }

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
      reset,
      sendMessage,
      setHandler,
      startConnection,
    };
  }, []);

  return {
    // Handlers
    closeConnection,
    completeConnection,
    joinConnection,
    reset,
    sendMessage,
    setHandler,
    startConnection,
    // State
    hasCompletedConnection,
    isActive,
    localPeerData,
    peerMode,
  };
}
