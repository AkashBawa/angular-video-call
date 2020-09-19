import { Component, OnInit, ViewChild, Renderer2, RendererFactory2, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import * as d3 from 'd3';
declare var $: any 

import html2canvas from 'html2canvas';

import { VideoCallService } from '../service/video-call.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit {

  roomId: any;
  peer: any;
  authorId: any;
  mypeerId: any;

  _navigator = <any>navigator;
  localStream: any;
  myVideoStream: any;
  myShareScreenStream: any;
  call: any;

  timer: any;
  recordedBlobs: Array<any> = [];
  mediaRecorder: any;

  private svg: d3.Selection<Element, any, any, any>
  private canvasNode: HTMLCanvasElement

  @ViewChild('hardwareVideo') hardwareVideo: any;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('downloadLink') downloadLink: ElementRef;
  @ViewChild('screenshot_img') screenshot_img: ElementRef;


  constructor(
    public videoCallService: VideoCallService,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private renderer: Renderer2,
    private root: ElementRef,

  ) { }

  ngOnInit(): void {
    // this.playAudio()
    // this.videoCallService.getVideoRoomId();
  };

  showCallingBox : boolean = false;
  call : any;
  remoteConnection : any;
  ngAfterViewInit() {
      
      this.peer = new Peer();

      this.peer.on('open',(myId)=>{
        console.log("my id is : ", myId)
      })

      this.peer.on('connection', function (conn) {

        console.log("connection", conn)
        this.remoteConnection = conn;

        conn.on('data', function (data) {
          console.log(data);
        });

        conn.on('open', function(data){
          console.log("connection is open now")
        })
      });
    
      let videoGrid = this.hardwareVideo.nativeElement;

      let myVideo = this.renderer.createElement('video');
      myVideo.muted = true;

      this._navigator = <any>navigator;

      this._navigator.getUserMedia = this._navigator.getUserMedia || this._navigator.webkitGetUserMedia || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia;

      this._navigator.getUserMedia({ video: true, audio: true }, (stream: any) => {
        // console.log(stream, 'workkkkk')
          this.myVideoStream = stream;
          myVideo.srcObject = stream

          myVideo.onloadedmetadata = function (e) {
            myVideo.play();
          };

          videoGrid.appendChild(myVideo);
      }, (err: any) => {
          console.log('failed to get stream ',err)
      })

      this.peer.on('call', (call: any) => {

        console.log("call in  ngAfterViewInit")
        this.call = call;
        this.showCallingBox = true;
        this.showModal();
        this.playAudio();
      })
      

      this.peer.on('close', function (closed : any){
        console.log("closed executed  ")
      });

      this.peer.on('disconnectes', function (disconnecd: any){
        console.log("disconnected executed ")
      });
    
      
      this.peer.on('error', function (err : any){
        console.log("error executed  ")
      });
  };

  audio = new Audio();
  playAudio(){
    this.audio.src = '../../assets/audio/https___www.tones7.com_media_old_telephone.mp3'
    this.audio.load();
    this.audio.play();
  }

  pauseAudio(){
    this.audio.pause()
  }

  acceptCall(){

    this.showCallingBox = false;
    $('#closeCallModal').click();
    this.pauseAudio();
    let videoGrid = this.hardwareVideo.nativeElement;

    console.log("accept call");
    this.call.answer(this.myVideoStream);

    let myVideo = this.renderer.createElement('video');
    
    this.call.on('stream', (remoteStream: any) => {

      console.log("stream in  ngAfterViewInit")
      myVideo.srcObject = remoteStream
      myVideo.onloadedmetadata = function (e) {
          myVideo.play();
      };
      videoGrid.appendChild(myVideo);
    }, (err: any) => {
      console.log('failed to get stream ',err)
    });
  }

  rejectCall(){
    $('#closeCallModal').click();
    this.showCallingBox = false;
    this.pauseAudio();
    this.call.close()
  }

  showModal(){
     $('#modalopen').click();
  }

  connect() {
    // console.log('connect', this.authorId)

    var conn = this.peer.connect(this.authorId);

    conn.on('open', () => {
      this.videoConnect();
    });
    conn.on('close', function(){
      console.log("connection is closed")
    });
    conn.on('error', function(err){
      console.log("error in connect")
    })
  }

  videoConnect() {

    let videoGrid = this.hardwareVideo.nativeElement;

    let video = this.renderer.createElement('video');

    var localvar = this.peer;
    var otherId = this.authorId;

    var call = localvar.call(otherId, this.myVideoStream);

    // localvar.stop(otherId, "message")

    call.on('stream', (remoteStream: any) => {
      video.srcObject = remoteStream
      video.onloadedmetadata = function (e) {
          video.play();
      };
      videoGrid.appendChild(video);
    }, (err: any) => {
      console.log('failed to get stream ',err)
    });

    call.on('close', function(close){
      console.log("connection close", close)
    })

    call.on('error',(err)=>{
      console.log("error in videoconnect", err)
    })
  }

  videoDisconnect (){
    this.peer.disconnected();
  }

  videoReconnect (){
    this.peer.reconnect();
  }

  videoDistroy (){
    this.peer.destroy();        // disconnect from peer server and
  } 

  playStop() {
    const enabled = this.myVideoStream.getVideoTracks()[0].enabled;
    console.log(enabled)
    if(enabled) {
        this.myVideoStream.getVideoTracks()[0].enabled = false;
        this.videoCallService.videoOnOffButton('videoOff')
      } else {
        this.videoCallService.videoOnOffButton('videoOn')
        this.myVideoStream.getVideoTracks()[0].enabled = true;
    }
  };

  muteUnmute() {
    const enabled = this.myVideoStream.getAudioTracks()[0].enabled;
    console.log(enabled)
    if(enabled) {
        this.myVideoStream.getAudioTracks()[0].enabled = false;
        this.videoCallService.micMuteUnmuteButton('mute')

    } else {
        this.videoCallService.micMuteUnmuteButton('unmute')
        this.myVideoStream.getAudioTracks()[0].enabled = true;
    }
  };

  screen_share() {
    let videoGrid = this.hardwareVideo.nativeElement;

    var localvar = this.peer;
    var otherId = this.authorId;

    var _this = this;

    if (this.videoCallService.myScreenShare) {
        videoGrid.removeChild(videoGrid.childNodes[0])
        this.myShareScreenStream.getTracks()[0].stop()

    } else {
        this._navigator = <any>navigator;


        let myVideo = this.renderer.createElement('video');
        myVideo.muted = true;

        this._navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        .then(function (stream: any) {

            _this.myShareScreenStream = stream;

            myVideo.srcObject = stream

            myVideo.onloadedmetadata = function (e) {
                myVideo.play();
            };

            videoGrid.insertBefore(myVideo, videoGrid.firstChild);

            var call = localvar.call(otherId, stream);
            console.log('screen share')

            call.on('ss', (remoteStream: any) => {
              console.log('screen share')

              myVideo.srcObject = remoteStream
              myVideo.onloadedmetadata = function (e) {
                  myVideo.play();
              };
              videoGrid.appendChild(myVideo);
            }, (err: any) => {
              console.log('failed to get stream ',err)
            })
          })
          .catch(function (error: any) {
            console.log("Something went wrong!" +error);
          });
    }

    this.videoCallService.screenShareButton()

  };

  recordScreen() {

    if(this.videoCallService.startRecording) {
      clearInterval(this.timer)
      document.getElementById("status").style.display="none"
      console.log("stop recording up")
      this.mediaRecorder.stop();
      console.log("stop recording down")
      document.getElementById("status").innerHTML = "Stopping...."
      // let recordedBlo = new Blob(recordedBlobs, { type: 'video/webm' });
      // my_camera.src = window.URL.createObjectURL(recordedBlo);
      // download_link.href = my_camera.src;
      // download_link.download = 'RecordedVideo.webm';

      document.getElementById("download_link").style.display = "inline"
    } else {
        var time: number = 0;
        this.timer  = setInterval(()=>{
          time++
          document.getElementById("status").innerHTML = Math.floor(time/60) +":"+ time%60 + " Recording..."
        },1000)
        document.getElementById("status").style.display="inline"
        document.getElementById("status").innerHTML = "Recording..."
        this.recordedBlobs = [];
        let options = {mimeType: 'video/webm;codecs=vp9,opus'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = {mimeType: 'video/webm;codecs=vp8,opus'};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`);
            options = {mimeType: 'video/webm'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              console.error(`${options.mimeType} is not supported`);
              options = {mimeType: ''};
            }
          }
        }
    let videoGrid = this.hardwareVideo.nativeElement;
        console.log(videoGrid.childNodes[0])
        try {
          this.mediaRecorder = new MediaRecorder(videoGrid.childNodes[0].srcObject, options);
        } catch (e) {
          console.error('Exception while creating MediaRecorder:', e);
          return;
        }

        console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);

        this.mediaRecorder.onstop = (event) => {
          console.log('Recorder stopped: ', event);
          console.log('Recorded Blobs: ', this.recordedBlobs);
        };
        this.mediaRecorder.ondataavailable = handleDataAvailable;

        var outSide = this;

        function handleDataAvailable(event) {
          console.log(event.data,'video event')
          if (event.data && event.data.size > 0) {
            console.log("inside handle data")
            outSide.recordedBlobs.push(event.data);
            document.getElementById("status").innerHTML = ""
          }
        }

        this.mediaRecorder.start();
        console.log('MediaRecorder started', this.mediaRecorder);

    }

  this.videoCallService.recordScreenButton()

  };

  download() {
    const blob = new Blob(this.recordedBlobs, {type: 'video/webm'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    this.myVideoStream.src =  url
    a.style.display = 'none';
    a.href = url;
    a.download = 'ScreenRecoder$.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      document.getElementById("download_link").style.display = "none"
    }, 100);

  }

  snapShot() {
    this.videoCallService.snapShotButton();

    let video = <HTMLVideoElement> this.hardwareVideo.nativeElement.childNodes[0];

    this.canvas.nativeElement.getContext("2d").drawImage(video, 0, 0, 1024, 768);

    this.downloadLink.nativeElement.href = this.canvas.nativeElement.toDataURL('image/png');
    this.downloadLink.nativeElement.download = 'ScreenShot$.png';
    this.downloadLink.nativeElement.click();

    // html2canvas(video).then(canvas => {
    //   this.canvas.nativeElement.src = canvas.toDataURL();
    //   this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
    //   this.downloadLink.nativeElement.download = 'ScreenShot$.png';
    //   this.downloadLink.nativeElement.click();
    // });

  };

  leaveMeeting() {
    this.videoCallService.leaveMettingButton()
  };

}
