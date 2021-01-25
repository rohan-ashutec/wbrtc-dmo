import { Component, OnInit, ViewChild, ViewContainerRef, ElementRef } from '@angular/core';

@Component({
  selector: 'app-two-way',
  templateUrl: './two-way.component.html',
  styleUrls: ['./two-way.component.scss','./two-way.component.sass']
})
export class TwoWayComponent implements OnInit {
  @ViewChild('startButton') startButton: ElementRef;
  @ViewChild('callButton') callButton: ElementRef;
  @ViewChild('hangupButton') hangupButton: ElementRef;
  @ViewChild('sdpSemantics') sdpSemantics: ElementRef;
  // @ViewChild('localVideo') localVideo: ElementRef;
  // @ViewChild('remoteVideo') remoteVideo: ElementRef;
  // @ViewChild('localAudio') localAudio: ElementRef;
  localVideo = <HTMLVideoElement>document.querySelector('localVideo');
  remoteVideo = <HTMLVideoElement>document.querySelector('remoteVideo');
  localAudio = <HTMLAudioElement>document.querySelector('localAudio');
  startTime;
  localStream;
  pc1;
  pc2;
  offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  constructor() { }
  ngOnInit() {
  }
  getName(pc) {
    return (pc === this.pc1) ? 'pc1' : 'pc2';
  }

  getOtherPc(pc) {
    return (pc === this.pc1) ? this.pc2 : this.pc1;
  }

  async start() {
    console.log('Requesting local stream');
    console.log(navigator);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Received local stream', stream);
      this.localVideo.srcObject = stream;
      this.localAudio.srcObject = stream;
      this.localStream = stream;
      console.log(stream);
      this.localAudio.play();
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  getSelectedSdpSemantics() {
    const sdpSemanticsSelect = this.sdpSemantics;
    const option = sdpSemanticsSelect.nativeElement.options[sdpSemanticsSelect.nativeElement.selectedIndex];
    return option.value === '' ? {} : { sdpSemantics: option.value };
  }

  async call() {
    console.log('Starting call');
    // startTime = window.performance.now();
    const videoTracks = this.localStream.getVideoTracks();
    const audioTracks = this.localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    const configuration = this.getSelectedSdpSemantics();
    console.log('RTCPeerConnection configuration:', configuration);
    // this.pc1 = new RTCPeerConnection(configuration);
    // console.log('Created local peer connection object pc1');
    // this.pc1.addEventListener('icecandidate', e => this.onIceCandidate(this.pc1, e));
    // this.pc2 = new RTCPeerConnection(configuration);
    // console.log('Created remote peer connection object pc2');
    // this.pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
    // this.pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
    // this.pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
    // this.pc2.addEventListener('track', gotRemoteStream);

    this.localStream.getTracks().forEach(track => this.pc1.addTrack(track, this.localStream));
    console.log('Added local stream to pc1');

    try {
      console.log('pc1 createOffer start');
      const offer = await this.pc1.createOffer(this.offerOptions);
      await this.onCreateOfferSuccess(offer);
    } catch (e) {
      this.onCreateSessionDescriptionError(e);
    }
  }

  onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  async onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    try {
      await this.pc1.setLocalDescription(desc);
      this.onSetLocalSuccess(this.pc1);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }

    console.log('pc2 setRemoteDescription start');
    try {
      await this.pc2.setRemoteDescription(desc);
      this.onSetRemoteSuccess(this.pc2);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }

    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await this.pc2.createAnswer();
      await this.onCreateAnswerSuccess(answer);
    } catch (e) {
      this.onCreateSessionDescriptionError(e);
    }
  }

  onSetLocalSuccess(pc) {
    console.log(`${this.getName(pc)} setLocalDescription complete`);
  }

  onSetRemoteSuccess(pc) {
    console.log(`${this.getName(pc)} setRemoteDescription complete`);
  }

  onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  gotRemoteStream(e) {
    if (this.remoteVideo.srcObject !== e.streams[0]) {
      this.remoteVideo.srcObject = e.streams[0];
      console.log('pc2 received remote stream');
    }
  }

  async onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc2:\n${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    try {
      await this.pc2.setLocalDescription(desc);
      this.onSetLocalSuccess(this.pc2);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }
    console.log('pc1 setRemoteDescription start');
    try {
      await this.pc1.setRemoteDescription(desc);
      this.onSetRemoteSuccess(this.pc1);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }
  }

  async onIceCandidate(pc, event) {
    try {
      await (this.getOtherPc(pc).addIceCandidate(event.candidate));
      this.onAddIceCandidateSuccess(pc);
    } catch (e) {
      this.onAddIceCandidateError(pc, e);
    }
    console.log(`${this.getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  onAddIceCandidateSuccess(pc) {
    console.log(`${this.getName(pc)} addIceCandidate success`);
  }

  onAddIceCandidateError(pc, error) {
    console.log(`${this.getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
  }

  onIceStateChange(pc, event) {
    if (pc) {
      console.log(`${this.getName(pc)} ICE state: ${pc.iceConnectionState}`);
      console.log('ICE state change event: ', event);
    }
  }

  hangup() {
    console.log('Ending call');
    this.pc1.close();
    this.pc2.close();
    this.pc1 = null;
    this.pc2 = null;
  }


}
