(()=>{"use strict";var e={908:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var o=Object.getOwnPropertyDescriptor(t,n);o&&!("get"in o?!t.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,o)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),o=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||i(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),o(n(465),t),o(n(528),t)},465:function(e,t,n){var i=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(o,a){function s(e){try{c(i.next(e))}catch(e){a(e)}}function r(e){try{c(i.throw(e))}catch(e){a(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,r)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.MessagingConnection=void 0;const o=n(528),a=n(624);t.MessagingConnection=class{get localPeerData(){return this._localPeerData}get peerMode(){return this._peerMode}get isActive(){return!!this.dataChannel}constructor(e,t){this.handlers=e,this.rtcConnection=void 0,this.localIceCandidates=[],this.reset(e,t)}closeConnection(){this.rtcConnection.close()}completeConnection(e){const t=(0,a.deserializePeerData)(e,this.minification);this.rtcConnection.setRemoteDescription(t.session)}joinConnection(e){return i(this,void 0,void 0,(function*(){this._peerMode=o.PeerMode.joiner;const t=(0,a.deserializePeerData)(e,this.minification);yield this.rtcConnection.setRemoteDescription(t.session);for(const e of t.candidates)yield this.rtcConnection.addIceCandidate(e);const n=new Promise((e=>{this.peerDataResolver=e}));return this.session=yield this.rtcConnection.createAnswer(),yield this.rtcConnection.setLocalDescription(this.session),n}))}reset(e,t){e&&(this.handlers=this.handlers),t&&(this.minification=null==t?void 0:t.minification),this.localIceCandidates=[],this.session=void 0,this.peerDataReadyTimeout=void 0,this.peerDataResolver=void 0,this._peerMode=void 0,this._localPeerData=void 0,this.rtcConnection=new RTCPeerConnection,this.rtcConnection.onicecandidate=e=>{e.candidate&&(this.localIceCandidates.push(e.candidate),this.peerDataReadyTimeout&&clearTimeout(this.peerDataReadyTimeout),this.peerDataReadyTimeout=window.setTimeout((()=>{this._localPeerData=(0,a.serializePeerData)({candidates:this.localIceCandidates,session:this.session},this.minification),this.peerDataResolver(this._localPeerData)}),300))},this.rtcConnection.ondatachannel=e=>{const t=e.channel;this.setDataChannelHandlers(t)}}sendMessage(e){return!!this.dataChannel&&(this.dataChannel.send(e),!0)}startConnection(){return i(this,void 0,void 0,(function*(){this._peerMode=o.PeerMode.starter;const e=this.rtcConnection.createDataChannel("data-channel");this.setDataChannelHandlers(e);const t=new Promise((e=>{this.peerDataResolver=e}));return this.session=yield this.rtcConnection.createOffer(),yield this.rtcConnection.setLocalDescription(this.session),t}))}setDataChannelHandlers(e){e.onopen=()=>{var t,n;this.dataChannel=e,null===(n=(t=this.handlers).onConnectionReady)||void 0===n||n.call(t,this)},e.onmessage=e=>{this.handlers.onMessageReceived(e.data,this)},e.onclose=()=>{var e,t;this.dataChannel=void 0,null===(t=(e=this.handlers).onConnectionClosed)||void 0===t||t.call(e,this)}}}},528:(e,t)=>{var n;Object.defineProperty(t,"__esModule",{value:!0}),t.PeerMode=void 0,function(e){e.joiner="joiner",e.starter="starter"}(n||(t.PeerMode=n={}))},624:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.serializePeerData=t.deserializePeerData=void 0;const n=[["\\r\\na=extmap-allow-mixed","_a"],["\\r\\na=fingerprint","_b"],["\\r\\na=ice-options","_c"],["\\r\\na=max-message-size","_d"],["\\r\\na=msid-semantic","_e"],["\\r\\na=sctp-port","_f"],["\\r\\na=setup","_g"],["\\r\\nm=application","_h"],["\\r\\na=ice-ufrag","_i"],["candidate","_j"],["network-cost","_k"],["network-id","_l"],["sdpMLineIndex","_m"],["typ host generation","_n"],["typ host tcptype active generation","_o"],["usernameFragment","_p"],["webrtc-datachannel","_q"],['"type":"offer"',"_r"],["\\r\\na=group","_s"],["sdpMid","_t"],["\\r\\na=mid","_u"],["UDP/DTLS/SCTP","_v"],["\\r\\na=ice-pwd","_w"],[":actpass","_x"],["ufrag","_y"],["BUNDLE","_z"],["trickle","_A"],["IN IP4","_B"],["sha-256","_C"],[" udp ","_D"],[",","_T"],["=","_U"],["{","_V"],["}","_W"],[":","_X"],['"',"_Y"],["\\","_Z"]];t.deserializePeerData=(e,t)=>{const i=t?n.reduce(((e,[t,n])=>e.replaceAll(n,t)),e):e;return JSON.parse(i)},t.serializePeerData=(e,t)=>{const i=JSON.stringify(e);return t?n.reduce(((e,[t,n])=>e.replaceAll(t,n)),i):i}},784:function(e,t,n){var i=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(o,a){function s(e){try{c(i.next(e))}catch(e){a(e)}}function r(e){try{c(i.throw(e))}catch(e){a(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,r)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.remoteDataParameterName=void 0;const o=n(908);t.remoteDataParameterName="d";const a=document.getElementById("peer-mode-selection"),s=document.getElementById("start-connection"),r=document.getElementById("joiner-remote-data"),c=document.getElementById("join-connection"),d=document.getElementById("waiting-peer-data"),l=document.getElementById("starter-peer"),u=document.getElementById("starter-local-data"),h=document.getElementById("copy-starter-code"),m=document.getElementById("copy-starter-link"),p=document.getElementById("verification-code"),y=document.getElementById("complete-connection"),v=document.getElementById("joiner-peer"),_=document.getElementById("joiner-local-data"),g=document.getElementById("copy-verification-code"),f=document.getElementById("messaging-area"),b=document.getElementById("current-message"),C=document.getElementById("send-message"),D=document.getElementById("messaging-history"),P=document.getElementById("close-connection"),w=document.getElementById("reset"),I=e=>{const t=document.createElement("p");t.innerText=e,D.append(t)},M=new o.MessagingConnection({onConnectionReady:()=>{l.style.display="none",v.style.display="none",f.style.display="block"},onMessageReceived:e=>{I(`They: ${e}`)},onConnectionClosed:()=>{b.setAttribute("disabled","true"),C.setAttribute("disabled","true"),P.setAttribute("disabled","true"),w.removeAttribute("disabled")}},{minification:!0});s.onclick=()=>i(void 0,void 0,void 0,(function*(){a.style.display="none",d.style.display="block",yield M.startConnection(),d.style.display="none",l.style.display="block",u.value=M.localPeerData})),h.onclick=()=>{navigator.clipboard.writeText(M.localPeerData)},m.onclick=()=>{const e=new URL(window.location.href);e.searchParams.append(t.remoteDataParameterName,M.localPeerData),navigator.clipboard.writeText(e.toString())},r.onkeyup=()=>{r.value?c.removeAttribute("disabled"):c.setAttribute("disabled","true")},c.onclick=()=>i(void 0,void 0,void 0,(function*(){const e=r.value;a.style.display="none",d.style.display="block",yield M.joinConnection(e),d.style.display="none",v.style.display="block",_.value=M.localPeerData})),g.onclick=()=>{navigator.clipboard.writeText(M.localPeerData)},p.onkeyup=()=>{p.value?y.removeAttribute("disabled"):y.setAttribute("disabled","true")},y.onclick=()=>{M.completeConnection(p.value)},b.onkeyup=()=>{b.value?C.removeAttribute("disabled"):C.setAttribute("disabled","true")},C.onclick=()=>{const e=b.value;I(`You: ${e}`),M.sendMessage(e),b.value="",C.setAttribute("disabled","true")},P.onclick=()=>{M.closeConnection()},w.onclick=()=>{D.innerHTML="",f.style.display="none",a.style.display="block",u.value="",p.value="",_.value="",r.value="",c.setAttribute("disabled","true"),y.setAttribute("disabled","true"),b.removeAttribute("disabled"),P.removeAttribute("disabled"),w.setAttribute("disabled","true"),M.reset()},document.addEventListener("DOMContentLoaded",(function(){const e=new URL(document.location.toString()).searchParams.get(t.remoteDataParameterName);e&&(r.value=e,c.removeAttribute("disabled"),window.history.pushState({},"",window.location.origin+window.location.pathname))}))}},t={};!function n(i){var o=t[i];if(void 0!==o)return o.exports;var a=t[i]={exports:{}};return e[i].call(a.exports,a,a.exports,n),a.exports}(784)})();