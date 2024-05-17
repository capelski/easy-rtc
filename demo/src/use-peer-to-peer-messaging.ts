import { useMemo, useState } from 'react';
import { PeerToPeerMessaging, PeerToPeerParameters } from '../../src/peer-to-peer-messaging';
export { PeerMode, PeerToPeerParameters } from '../../src/peer-to-peer-messaging';

export const usePeerToPeerMessaging = (params: PeerToPeerParameters) => {
    const [localPeerData, setLocalPeerData] = useState('');
    const [connection, setConnection] = useState<PeerToPeerMessaging>(
        () => new PeerToPeerMessaging({ ...params }),
    );

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
                const nextLocalPeerData = await connection.startConnection();
                setLocalPeerData(nextLocalPeerData);
            };

            const joinConnection = async (remotePeerData: string) => {
                const nextLocalPeerData = await connection.joinConnection(remotePeerData);
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
        peerMode: connection.peerMode,
    };
};
