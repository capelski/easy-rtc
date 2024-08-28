import { DefaultMessageType, MessagingHandlers } from '@easy-rtc/core';

export type ReactMessagingHandlers<TMessage = DefaultMessageType> = MessagingHandlers<TMessage> & {
  connectionStateChange?: RTCPeerConnection['onconnectionstatechange'];
  iceCandidateError?: RTCPeerConnection['onicecandidateerror'];
  iceConnectionStateChange?: RTCPeerConnection['oniceconnectionstatechange'];
  iceGatheringStateChange?: RTCPeerConnection['onicegatheringstatechange'];
  negotiationNeeded?: RTCPeerConnection['onnegotiationneeded'];
  signalingStateChange?: RTCPeerConnection['onsignalingstatechange'];
};