import {
  MessagingConnection,
  MessagingConnectionOptions,
  OnConnectionClosedHandler,
  OnConnectionReadyHandler,
  OnMessageReceivedHandler,
  PeerMode,
} from '@easy-rtc/core';
import { useMemo, useState } from 'react';

export type MessagingConnectionReact = Pick<
  MessagingConnection,
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
  setHandler(event: 'onConnectionClosed', handler: OnConnectionClosedHandler): void;
  setHandler(event: 'onConnectionReady', handler: OnConnectionReadyHandler): void;
  setHandler(event: 'onMessageReceived', handler: OnMessageReceivedHandler): void;
};

export function useMessagingConnection(): MessagingConnectionReact;
export function useMessagingConnection(
  options: MessagingConnectionOptions,
): MessagingConnectionReact;
export function useMessagingConnection(connection: MessagingConnection): MessagingConnectionReact;
export function useMessagingConnection(
  connectionOrOptions?: MessagingConnection | MessagingConnectionOptions,
): MessagingConnectionReact {
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
        : new MessagingConnection(connectionOrOptions);

    const originalHandlers = connection.handlers;
    connection.handlers = {
      onConnectionClosed: (instance) => {
        originalHandlers.onConnectionClosed?.(instance);
        setIsActive(false);
      },
      onConnectionReady: (instance) => {
        originalHandlers.onConnectionReady?.(instance);
        setHasCompletedConnection(true);
        setIsActive(true);
      },
      onMessageReceived: (message, instance) => {
        originalHandlers.onMessageReceived?.(message, instance);
      },
    };

    function setHandler(event: 'onConnectionClosed', handler: OnConnectionClosedHandler): void;
    function setHandler(event: 'onConnectionReady', handler: OnConnectionReadyHandler): void;
    function setHandler(event: 'onMessageReceived', handler: OnMessageReceivedHandler): void;
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

    const completeConnection: MessagingConnection['completeConnection'] =
      connection.completeConnection.bind(connection);

    const sendMessage: MessagingConnection['sendMessage'] = connection.sendMessage.bind(connection);

    const closeConnection: MessagingConnection['closeConnection'] =
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
