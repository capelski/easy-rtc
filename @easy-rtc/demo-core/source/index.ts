import { MessagingConnection } from '@easy-rtc/core';

export const remoteDataParameterName = 'd';

const peerModeSelection = document.getElementById('peer-mode-selection')!;
const startConnection = document.getElementById('start-connection')!;
const joinerRemoteData = document.getElementById('joiner-remote-data') as HTMLTextAreaElement;
const joinConnection = document.getElementById('join-connection')!;
const waitingPeerData = document.getElementById('waiting-peer-data')!;
const starterPeer = document.getElementById('starter-peer')!;
const starterLocalData = document.getElementById('starter-local-data') as HTMLTextAreaElement;
const copyStarterCode = document.getElementById('copy-starter-code')!;
const copyStarterLink = document.getElementById('copy-starter-link')!;
const verificationCode = document.getElementById('verification-code') as HTMLTextAreaElement;
const completeConnection = document.getElementById('complete-connection')!;
const joinerPeer = document.getElementById('joiner-peer')!;
const joinerLocalData = document.getElementById('joiner-local-data') as HTMLTextAreaElement;
const copyVerificationCode = document.getElementById('copy-verification-code')!;
const messagingArea = document.getElementById('messaging-area')!;
const currentMessage = document.getElementById('current-message') as HTMLTextAreaElement;
const sendMessage = document.getElementById('send-message')!;
const messagingHistory = document.getElementById('messaging-history')!;
const closeConnection = document.getElementById('close-connection')!;
const reset = document.getElementById('reset')!;
const connectionError = document.getElementById('connection-error')!;
const errorReset = document.getElementById('error-reset')!;
const toggleRtcActivity = document.getElementById('toggle-rtc-activity')!;
const rtcActivity = document.getElementById('rtc-activity')!;
const rtcActivityLog = document.getElementById('rtc-activity-log')!;
const connectionState = document.getElementById('connectionState')!;
const iceConnectionState = document.getElementById('iceConnectionState')!;
const iceGatheringState = document.getElementById('iceGatheringState')!;
const sctpState = document.getElementById('sctpState')!;
const signalingState = document.getElementById('signalingState')!;

const addMessage = (text: string) => {
  const paragraph = document.createElement('p');
  paragraph.innerText = text;
  messagingHistory.append(paragraph);
};

const messaging = new MessagingConnection({ minification: true });

const updateConnectionState = () => {
  connectionState.textContent = messaging.rtcConnection.connectionState;
  iceConnectionState.textContent = messaging.rtcConnection.iceConnectionState;
  iceGatheringState.textContent = messaging.rtcConnection.iceGatheringState;
  sctpState.textContent = messaging.rtcConnection.sctp?.state || '-';
  signalingState.textContent = messaging.rtcConnection.signalingState;
};

messaging.on.connectionReady = () => {
  starterPeer.style.display = 'none';
  joinerPeer.style.display = 'none';
  messagingArea.style.display = 'block';
  updateConnectionState();
};

messaging.on.messageReceived = (message) => {
  addMessage(`They: ${message}`);
};

messaging.on.connectionClosed = () => {
  currentMessage.setAttribute('disabled', 'true');
  sendMessage.setAttribute('disabled', 'true');
  closeConnection.setAttribute('disabled', 'true');
  reset.removeAttribute('disabled');
  updateConnectionState();
};

const updateRtcActivityLog = (text: string) => {
  const div = document.createElement('div');
  div.innerText = text;
  rtcActivityLog.prepend(div);
};

const logConnectionState = (message: string) => (event: any) => {
  updateConnectionState();
  updateRtcActivityLog(
    `${message} - connectionState: ${messaging.rtcConnection.connectionState} / iceConnectionState: ${messaging.rtcConnection.iceConnectionState} / iceGatheringState: ${messaging.rtcConnection.iceGatheringState} / state: ${messaging.rtcConnection.sctp?.state} / signalingState: ${messaging.rtcConnection.signalingState}`,
  );
};

messaging.on.connectionStateChange = logConnectionState('Connection state change');

messaging.on.iceCandidate = (candidate) => {
  updateRtcActivityLog(
    `ICE candidate - protocol: ${candidate.protocol} / type: ${candidate.type} / address: ${candidate.address} / relatedAddress: ${candidate.relatedAddress}`,
  );
};

messaging.rtcConnection.onicecandidateerror = (event) => {
  updateRtcActivityLog(
    `ICE candidate error - errorCode: ${event.errorCode} / errorText: ${event.errorText} / address: ${event.address}`,
  );
};

messaging.rtcConnection.oniceconnectionstatechange = logConnectionState(
  'ICE Connection state change',
);

messaging.rtcConnection.onicegatheringstatechange = logConnectionState(
  'ICE Gathering state change',
);

messaging.rtcConnection.onnegotiationneeded = logConnectionState('Negotiation needed');

messaging.rtcConnection.onsignalingstatechange = logConnectionState('Signaling state change');

startConnection.onclick = async () => {
  peerModeSelection.style.display = 'none';
  waitingPeerData.style.display = 'block';
  try {
    await messaging.startConnection();
    starterPeer.style.display = 'block';
    starterLocalData.value = messaging.localPeerData!;
  } catch {
    connectionError.style.display = 'block';
  }
  waitingPeerData.style.display = 'none';
};

copyStarterCode.onclick = () => {
  navigator.clipboard.writeText(messaging.localPeerData!);
};

copyStarterLink.onclick = () => {
  const url = new URL(window.location.href);
  url.searchParams.append(remoteDataParameterName, messaging.localPeerData!);
  navigator.clipboard.writeText(url.toString());
};

joinerRemoteData.onkeyup = () => {
  if (joinerRemoteData.value) {
    joinConnection.removeAttribute('disabled');
  } else {
    joinConnection.setAttribute('disabled', 'true');
  }
};

joinConnection.onclick = async () => {
  const remotePeerData = joinerRemoteData.value;
  peerModeSelection.style.display = 'none';
  waitingPeerData.style.display = 'block';
  try {
    await messaging.joinConnection(remotePeerData);
    joinerPeer.style.display = 'block';
    joinerLocalData.value = messaging.localPeerData!;
  } catch {
    connectionError.style.display = 'block';
  }
  waitingPeerData.style.display = 'none';
};

copyVerificationCode.onclick = () => {
  navigator.clipboard.writeText(messaging.localPeerData!);
};

verificationCode.onkeyup = () => {
  if (verificationCode.value) {
    completeConnection.removeAttribute('disabled');
  } else {
    completeConnection.setAttribute('disabled', 'true');
  }
};

completeConnection.onclick = () => {
  messaging.completeConnection(verificationCode.value);
};

currentMessage.onkeyup = () => {
  if (currentMessage.value) {
    sendMessage.removeAttribute('disabled');
  } else {
    sendMessage.setAttribute('disabled', 'true');
  }
};

sendMessage.onclick = () => {
  const message = currentMessage.value;
  addMessage(`You: ${message}`);
  messaging.sendMessage(message);
  currentMessage.value = '';
  sendMessage.setAttribute('disabled', 'true');
};

closeConnection.onclick = () => {
  messaging.closeConnection();
};

reset.onclick = errorReset.onclick = () => {
  messagingHistory.innerHTML = '';
  messagingArea.style.display = 'none';
  peerModeSelection.style.display = 'block';
  starterLocalData.value = '';
  verificationCode.value = '';
  joinerLocalData.value = '';
  joinerRemoteData.value = '';
  joinConnection.setAttribute('disabled', 'true');
  completeConnection.setAttribute('disabled', 'true');
  currentMessage.removeAttribute('disabled');
  closeConnection.removeAttribute('disabled');
  reset.setAttribute('disabled', 'true');
  rtcActivityLog.innerHTML = '';
  messaging.reset();
};

toggleRtcActivity.onclick = () => {
  const isDisplayed = rtcActivity.style.display === 'block';
  rtcActivity.style.display = isDisplayed ? 'none' : 'block';
  toggleRtcActivity.textContent = `${isDisplayed ? 'Show' : 'Hide'} RTC activity`;
};

document.addEventListener('DOMContentLoaded', function () {
  const params = new URL(document.location.toString()).searchParams;
  const data = params.get(remoteDataParameterName);
  if (data) {
    joinerRemoteData.value = data;
    joinConnection.removeAttribute('disabled');
    window.history.pushState({}, '', window.location.origin + window.location.pathname);
  }
});
