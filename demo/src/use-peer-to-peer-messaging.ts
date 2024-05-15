import { useState } from 'react';
import { PeerToPeerHandlers, PeerToPeerMessaging } from '../../src/peer-to-peer-messaging';

export enum PeerMode {
    joiner = 'joiner',
    starter = 'starter',
}

export const usePeerToPeerMessaging = (
    onMessageReceived: PeerToPeerHandlers['onMessageReceived'],
    { useCompression }: { useCompression?: boolean } = {},
) => {
    const [connectionReady, setConnectionReady] = useState(false);
    const [localPeerData, setLocalPeerData] = useState('');
    const [peerMode, setPeerMode] = useState<PeerMode>();
    const [connection, setConnection] = useState<PeerToPeerMessaging>();

    const reset = () => {
        setConnectionReady(false);
        setLocalPeerData('');
        setPeerMode(undefined);
        setConnection(undefined);
    };

    const handlers: PeerToPeerHandlers = {
        onConnectionClosed: reset,
        onConnectionReady: () => setConnectionReady(true),
        onMessageReceived: onMessageReceived,
    };

    const startConnection = async () => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(handlers, { useCompression });
        setPeerMode(PeerMode.starter);
        setConnection(nextPeerToPeerConnection);

        const nextLocalPeerData = await nextPeerToPeerConnection.startConnection();
        setLocalPeerData(nextLocalPeerData);
    };

    const joinConnection = async (remotePeerData: string) => {
        const nextPeerToPeerConnection = new PeerToPeerMessaging(handlers, { useCompression });
        setPeerMode(PeerMode.joiner);
        setConnection(nextPeerToPeerConnection);

        const nextLocalPeerData = await nextPeerToPeerConnection.joinConnection(remotePeerData);
        setLocalPeerData(nextLocalPeerData);
    };

    const completeConnection = (remotePeerData: string) => {
        connection?.completeConnection(remotePeerData);
    };

    const sendMessage = (message: string) => {
        connection?.send(message);
    };

    const closeConnection = () => {
        connection?.closeConnection();
        reset();
    };

    return {
        // Handlers
        closeConnection,
        completeConnection,
        joinConnection,
        sendMessage,
        startConnection,
        // State
        connectionReady,
        localPeerData,
        peerMode,
    };
};
