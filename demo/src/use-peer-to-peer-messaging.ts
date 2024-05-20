import { useMemo, useState } from 'react';
import {
    PeerMode,
    PeerToPeerHandlers,
    PeerToPeerMessaging,
    PeerToPeerOptions,
} from '../../src/peer-to-peer-messaging';

export { PeerMode, PeerToPeerHandlers, PeerToPeerMessaging, PeerToPeerOptions };

export const usePeerToPeerMessaging = (
    handlers: PeerToPeerHandlers,
    options?: PeerToPeerOptions,
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
        const wrapHandlers = (_handlers: PeerToPeerHandlers): PeerToPeerHandlers => ({
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

        const connection = new PeerToPeerMessaging(wrapHandlers(handlers), options);

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

        const completeConnection: PeerToPeerMessaging['completeConnection'] =
            connection.completeConnection.bind(connection);

        const sendMessage: PeerToPeerMessaging['sendMessage'] =
            connection.sendMessage.bind(connection);

        const closeConnection: PeerToPeerMessaging['closeConnection'] =
            connection.closeConnection.bind(connection);

        const reset = (newHandlers?: PeerToPeerHandlers, newOptions?: PeerToPeerOptions) => {
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
