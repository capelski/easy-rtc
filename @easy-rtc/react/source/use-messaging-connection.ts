import {
  DefaultMessageType,
  MessagingConnection,
  MessagingConnectionOptions,
  PeerMode,
} from '@easy-rtc/core';
import { useMemo, useState } from 'react';

export type MessagingConnectionReact<TMessage = DefaultMessageType> = Pick<
  MessagingConnection<TMessage>,
  | 'closeConnection'
  | 'completeConnection'
  | 'joinConnection'
  | 'on'
  | 'reset'
  | 'sendMessage'
  | 'startConnection'
  | 'rtcConnection'
> & {
  readonly hasCompletedConnection: boolean;
  readonly isActive: boolean;
  readonly peerMode: PeerMode | undefined;
  readonly localPeerData: string;
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

    const addConnectionClosedHandler = () => {
      connection.on(
        'connectionClosed',
        () => {
          setIsActive(false);
        },
        { clearHandlers: false },
      );
    };

    const addConnectionReadyHandler = () => {
      connection.on(
        'connectionReady',
        () => {
          setHasCompletedConnection(true);
          setIsActive(true);
        },
        { clearHandlers: false },
      );
    };

    addConnectionClosedHandler();
    addConnectionReadyHandler();
    connection.onHandlerReplaced = (eventType) => {
      if (eventType === 'connectionClosed') {
        addConnectionClosedHandler();
      } else if (eventType === 'connectionReady') {
        addConnectionReadyHandler();
      }
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

    const on: MessagingConnection<TMessage>['on'] = connection.on.bind(connection);

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
