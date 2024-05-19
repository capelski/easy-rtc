import { useMemo, useState } from 'react';
import {
    PeerMode,
    PeerToPeerMessaging,
    PeerToPeerParameters,
} from '../../src/peer-to-peer-messaging';

export { PeerMode, PeerToPeerParameters };

export const usePeerToPeerMessaging = (params: PeerToPeerParameters) => {
    const [connection, setConnection] = useState<PeerToPeerMessaging>(
        () => new PeerToPeerMessaging({ ...params }),
    );
    const [localPeerData, setLocalPeerData] = useState('');
    const [peerMode, setPeerMode] = useState<PeerMode>();

    const { closeConnection, completeConnection, joinConnection, sendMessage, startConnection } =
        useMemo(() => {
            const originalHandler = params.onConnectionClosed;
            connection.params.onConnectionClosed = () => {
                setLocalPeerData('');
                originalHandler?.();
                setTimeout(() => {
                    setConnection(new PeerToPeerMessaging({ ...params }));
                }, 0);
            };

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

            const completeConnection = (remotePeerData: string) => {
                connection.completeConnection(remotePeerData);
            };

            const sendMessage = (message: string) => {
                connection.send(message);
            };

            const closeConnection = () => {
                connection.closeConnection();
            };

            return {
                connection,
                closeConnection,
                completeConnection,
                joinConnection,
                sendMessage,
                startConnection,
            };
        }, [connection]);

    return {
        // Handlers
        closeConnection,
        completeConnection,
        joinConnection,
        sendMessage,
        startConnection,
        // State
        localPeerData,
        peerMode,
    };
};
