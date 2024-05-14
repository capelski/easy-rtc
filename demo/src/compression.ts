const compressionTransformations = [
    ['\\r\\na=extmap-allow-mixed', '$a'],
    ['\\r\\na=fingerprint', '$b'],
    ['\\r\\na=ice-options', '$c'],
    ['\\r\\na=max-message-size', '$d'],
    ['\\r\\na=msid-semantic', '$e'],
    ['\\r\\na=sctp-port', '$f'],
    ['\\r\\na=setup', '$g'],
    ['\\r\\nm=application', '$h'],
    ['\\r\\na=ice-ufrag', '$i'],
    ['candidate', '$j'],
    ['network-cost', '$k'],
    ['network-id', '$l'],
    ['sdpMLineIndex', '$m'],
    ['typ host generation', '$n'],
    ['typ host tcptype active generation', '$o'],
    ['usernameFragment', '$p'],
    ['webrtc-datachannel', '$q'],
    ['"type":"offer"', '$r'],
    ['\\r\\na=group', '$s'],
    ['sdpMid', '$t'],
    ['\\r\\na=mid', '$u'],
    ['UDP/DTLS/SCTP', '$v'],
    ['\\r\\na=ice-pwd', '$w'],
    [':actpass', '$x'],
    ['ufrag', '$z'],
    ['"', '_'],
];

export const compressRemoteData = (data: string): string => {
    return compressionTransformations.reduce<string>((reduced, [text, symbol]) => {
        return reduced.replaceAll(text, symbol);
    }, data);
};

export const decompressRemoteData = (data: string): string => {
    return compressionTransformations.reduce<string>((reduced, [text, symbol]) => {
        return reduced.replaceAll(symbol, text);
    }, data);
};
