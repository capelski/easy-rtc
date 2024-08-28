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

const logConnectionState = (message: string) => (event: any) => {
  updateConnectionState();

  console.log(message, event);
  console.log('   connectionState:', messaging.rtcConnection.connectionState);
  console.log('   iceConnectionState:', messaging.rtcConnection.iceConnectionState);
  console.log('   iceGatheringState:', messaging.rtcConnection.iceGatheringState);
  console.log('   sctp?.state:', messaging.rtcConnection.sctp?.state);
  console.log('   signalingState:', messaging.rtcConnection.signalingState);
};

messaging.on.connectionStateChange = logConnectionState('Connection state change');

messaging.on.iceCandidate = (event) => {
  console.log('ICE candidate', event);
  console.log('   protocol:', event.candidate?.protocol);
  console.log('   type:', event.candidate?.type);
  console.log('   address:', event.candidate?.address);
  console.log('   relatedAddress:', event.candidate?.relatedAddress);
};

messaging.rtcConnection.onicecandidateerror = logConnectionState('ICE Candidate error');

messaging.rtcConnection.oniceconnectionstatechange = logConnectionState(
  'ICE Connection state change',
);

messaging.on.iceGatheringStateChange = logConnectionState('ICE gathering state change');

messaging.rtcConnection.onnegotiationneeded = logConnectionState('Negotiation needed');

messaging.rtcConnection.onsignalingstatechange = logConnectionState('Signaling state change');

startConnection.onclick = async () => {
  peerModeSelection.style.display = 'none';
  waitingPeerData.style.display = 'block';
  await messaging.startConnection();
  waitingPeerData.style.display = 'none';
  starterPeer.style.display = 'block';
  starterLocalData.value = messaging.localPeerData!;
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
  await messaging.joinConnection(remotePeerData);
  waitingPeerData.style.display = 'none';
  joinerPeer.style.display = 'block';
  joinerLocalData.value = messaging.localPeerData!;
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

reset.onclick = () => {
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
  messaging.reset();
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
