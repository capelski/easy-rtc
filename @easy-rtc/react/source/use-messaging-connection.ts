import {
  MessagingConnection,
  MessagingConnectionHandlers,
  MessagingConnectionOptions,
  PeerMode,
} from '@easy-rtc/core';
import { useMemo, useState } from 'react';

export const useMessagingConnection = (
  handlers: MessagingConnectionHandlers,
  options?: MessagingConnectionOptions,
) => {
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
    startConnection,
  } = useMemo(() => {
    const wrapHandlers = (_handlers: MessagingConnectionHandlers): MessagingConnectionHandlers => ({
      onConnectionClosed: (instance) => {
        _handlers.onConnectionClosed?.(instance);
        setIsActive(false);
      },
      onConnectionReady: (instance) => {
        _handlers.onConnectionReady?.(instance);
        setHasCompletedConnection(true);
        setIsActive(true);
      },
      onMessageReceived: (message, instance) => {
        _handlers.onMessageReceived(message, instance);
      },
    });

    const connection = new MessagingConnection(wrapHandlers(handlers), options);

    const startConnection = async () => {
      const connectionPromise = connection.startConnection();
      setPeerMode(connection.peerMode);
      const nextLocalPeerData = await connectionPromise;
      setLocalPeerData(nextLocalPeerData);
    };

    const joinConnection = async (remotePeerData: string) => {
      const connectionPromise = connection.joinConnection(remotePeerData);
      setPeerMode(connection.peerMode);
      const nextLocalPeerData = await connectionPromise;
      setLocalPeerData(nextLocalPeerData);
    };

    const completeConnection: MessagingConnection['completeConnection'] =
      connection.completeConnection.bind(connection);

    const sendMessage: MessagingConnection['sendMessage'] = connection.sendMessage.bind(connection);

    const closeConnection: MessagingConnection['closeConnection'] =
      connection.closeConnection.bind(connection);

    const reset = (
      newHandlers?: MessagingConnectionHandlers,
      newOptions?: MessagingConnectionOptions,
    ) => {
      connection.reset(newHandlers ? wrapHandlers(newHandlers) : undefined, newOptions);
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
    startConnection,
    // State
    hasCompletedConnection,
    isActive,
    localPeerData,
    peerMode,
  };
};
