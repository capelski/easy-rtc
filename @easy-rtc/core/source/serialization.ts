export type PeerData = {
  candidates: RTCIceCandidateInit[];
  session: RTCSessionDescriptionInit;
};

const minificationTransformations = [
  ['\\r\\na=extmap-allow-mixed', '_a'],
  ['\\r\\na=fingerprint', '_b'],
  ['\\r\\na=ice-options', '_c'],
  ['\\r\\na=max-message-size', '_d'],
  ['\\r\\na=msid-semantic', '_e'],
  ['\\r\\na=sctp-port', '_f'],
  ['\\r\\na=setup', '_g'],
  ['\\r\\nm=application', '_h'],
  ['\\r\\na=ice-ufrag', '_i'],
  ['candidate', '_j'],
  ['network-cost', '_k'],
  ['network-id', '_l'],
  ['sdpMLineIndex', '_m'],
  ['typ host generation', '_n'],
  ['typ host tcptype active generation', '_o'],
  ['usernameFragment', '_p'],
  ['webrtc-datachannel', '_q'],
  ['"type":"offer"', '_r'],
  ['\\r\\na=group', '_s'],
  ['sdpMid', '_t'],
  ['\\r\\na=mid', '_u'],
  ['UDP/DTLS/SCTP', '_v'],
  ['\\r\\na=ice-pwd', '_w'],
  [':actpass', '_x'],
  ['ufrag', '_y'],
  ['BUNDLE', '_z'],
  ['trickle', '_A'],
  ['IN IP4', '_B'],
  ['sha-256', '_C'],
  [' udp ', '_D'],
  [',', '_T'],
  ['=', '_U'],
  ['{', '_V'],
  ['}', '_W'],
  [':', '_X'],
  ['"', '_Y'],
  ['\\', '_Z'],
];

export const deserializePeerData = (peerData: string, deMinify?: boolean): PeerData => {
  const source = deMinify
    ? minificationTransformations.reduce<string>((reduced, [text, symbol]) => {
        return reduced.replaceAll(symbol, text);
      }, peerData)
    : peerData;
  return JSON.parse(source);
};

export const serializePeerData = (peerData: PeerData, minify?: boolean): string => {
  const source = JSON.stringify(peerData);
  return minify
    ? minificationTransformations.reduce<string>((reduced, [text, symbol]) => {
        return reduced.replaceAll(text, symbol);
      }, source)
    : source;
};
