import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.sass']
})
export class VideoChatComponent implements OnInit {

  name;
  connectedUser;
  loginPage = true;
  callPage = false;
  conn = new WebSocket('wss://localhost:6200');
  localVideo = <HTMLVideoElement>document.querySelector('localVideo');
  remoteVideo = <HTMLVideoElement>document.querySelector('remoteVideo');
  yourConn;
  stream;
  form: FormGroup;

  constructor(
    fb: FormBuilder
  ) {
    this.form = fb.group({
      'usernameInput': ['', Validators.required]
    })
  }

  ngOnInit() {
    this.conn.onopen = () => {
      console.log("Connected to the signaling server");
    };

    //when we got a message from a signaling server 
    this.conn.onmessage = (msg) => {
      console.log("Got message", msg.data);
      var data = JSON.parse(msg.data);
      switch (data.type) {
        case "login": {
          this.handleLogin(data.success);
          break;
        }
        //when somebody wants to call us 
        case "offer":
          this.handleOffer(data.offer, data.name);
          break;
        case "answer":
          this.handleAnswer(data.answer);
          break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
          this.handleCandidate(data.candidate);
          break;
        case "leave":
          this.handleLeave();
          break;
        case "error":
          this.handleError(data.type);
          break;
        default:
          break;
      }
    };
    this.conn.onerror = (err) => {
      console.log("Got error", err);
    };
  }

  //connecting to our signaling server 


  //alias for sending JSON encoded messages 
  send(message) {
    //attach the other peer username to our messages 
    if (this.connectedUser) {
      message.name = this.connectedUser;
    }
    this.conn.send(JSON.stringify(message));
  }

  onLogin() {
    this.name = this.form.get('usernameInput').value;
    console.log(this.name);
    if (this.name.length > 0) {
      this.send({
        type: "login",
        name: this.name
      });
    }
  }

  handleError(type) {
    alert(type);
  }

  handleLogin(success) {
    if (success === false) {
      alert("Ooops...try a different username");
    } else {
      this.loginPage = false;
      this.callPage = true;


      //********************** 
      //Starting a peer connection 
      //********************** 

      //getting local video stream 
      navigator.getUserMedia({ video: true, audio: true }, function (myStream) {
        this.stream = myStream;
        //displaying local video stream on the page 
        this.localVideo.src = window.URL.createObjectURL(this.stream);
        //using Google public stun server 
        const configuration = {
          "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
        };
        this.yourConn = new webkitRTCPeerConnection(configuration as any);
        // setup stream listening 
        this.yourConn.addStream(this.stream);
        //when a remote user adds stream to the peer connection, we display it 
        this.yourConn.onaddstream = function (e) {
          this.remoteVideo.src = window.URL.createObjectURL(e.stream);
        };
        // Setup ice handling 
        this.yourConn.onicecandidate = function (event) {
          if (event.candidate) {
            this.send({
              type: "candidate",
              candidate: event.candidate
            });
          }
        };
      }, function (error) {
        console.log(error);
      });
    }
  }

  onCall() {
    const callToUsername = this.form.get('usernameInput').value;
    if (callToUsername.length > 0) {
      this.connectedUser = callToUsername;
      // create an offer
      this.yourConn.createOffer(function (offer) {
        this.send({
          type: "offer",
          offer: offer
        });
        this.yourConn.setLocalDescription(offer);
      }, (error) => {
        alert("Error when creating an offer");
      });
    }
  }

  handleOffer(offer, name) {
    this.connectedUser = name;
    this.yourConn.setRemoteDescription(new RTCSessionDescription(offer));
    //create an answer to an offer 
    this.yourConn.createAnswer((answer) => {
      this.yourConn.setLocalDescription(answer);

      this.send({
        type: "answer",
        answer: answer
      });

    }, (error) => {
      alert("Error when creating an answer");
    });
  };

  //when we got an answer from a remote user 
  handleAnswer(answer) {
    this.yourConn.setRemoteDescription(new RTCSessionDescription(answer));
  }

  //when we got an ice candidate from a remote user 
  handleCandidate(candidate) {
    this.yourConn.addIceCandidate(new RTCIceCandidate(candidate));
  }

  onhang() {
    this.send({
      type: "leave"
    });
    this.handleLeave();
  }
  handleLeave() {
    this.connectedUser = null;
    this.remoteVideo.src = null;
    this.yourConn.close();
    this.yourConn.onicecandidate = null;
    this.yourConn.onaddstream = null;
  }
}

