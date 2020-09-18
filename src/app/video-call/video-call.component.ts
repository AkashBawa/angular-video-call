import { Component, OnInit, ViewChild, Renderer2, RendererFactory2, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import * as d3 from 'd3';

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
    this.videoCallService.getVideoRoomId();



  };

  ngAfterViewInit() {
      this.peer = new Peer(undefined, { host: 'localhost', port: 3000, path: "/peerjs", proxied: true });

      this.peer.on('connection', function (conn) {
        conn.on('data', function (data) {
          // Will print 'hi!'
          console.log(data);
        });
      });

      setTimeout(() => {
        this.mypeerId = this.peer.id;
        if(!this.mypeerId) {
          this.mypeerId = 'something went wrong, check internet connection!'
        }
        console.log('My peer ID is: ' + this.mypeerId)
      }, 1000)


      let videoGrid = this.hardwareVideo.nativeElement;

      let myVideo = this.renderer.createElement('video');
      myVideo.muted = true;

      this._navigator = <any>navigator;
      // Answer the call with your own video/audio stream
      this._navigator.getUserMedia = this._navigator.getUserMedia || this._navigator.webkitGetUserMedia || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia;

      this._navigator.getUserMedia({ video: true, audio: false }, (stream: any) => {
        console.log(stream, 'workkkkk')
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

          call.answer(this.myVideoStream);

          let myVideo = this.renderer.createElement('video');

          call.on('stream', (remoteStream: any) => {

            myVideo.srcObject = remoteStream
            myVideo.onloadedmetadata = function (e) {
                myVideo.play();
            };
            videoGrid.appendChild(myVideo);
          }, (err: any) => {
            console.log('failed to get stream ',err)
          })
        })

  };

  connect() {
    console.log('connect', this.authorId)

    var conn = this.peer.connect(this.authorId);

    conn.on('open', () => {
      conn.send('hi')
    });
  }

  videoConnect() {
    let videoGrid = this.hardwareVideo.nativeElement;

    let video = this.renderer.createElement('video');

    var localvar = this.peer;
    var otherId = this.authorId;

    var call = localvar.call(otherId, this.myVideoStream);

    call.on('stream', (remoteStream: any) => {
      video.srcObject = remoteStream
      video.onloadedmetadata = function (e) {
          video.play();
      };
      videoGrid.appendChild(video);
    }, (err: any) => {
      console.log('failed to get stream ',err)
    })

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

    var outside = this;

    if (this.videoCallService.myScreenShare) {
        videoGrid.removeChild(videoGrid.childNodes[0])
        this.myShareScreenStream.getTracks()[0].stop()

    } else {
        this._navigator = <any>navigator;


        let myVideo = this.renderer.createElement('video');
        myVideo.muted = true;

        this._navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        .then(function (stream: any) {

            outside.myShareScreenStream = stream;

            myVideo.srcObject = stream

            myVideo.onloadedmetadata = function (e) {
                myVideo.play();
            };

            videoGrid.insertBefore(myVideo, videoGrid.firstChild);

            var call = localvar.call(otherId, stream);
            console.log('screen share')

            // call.on('ss', (remoteStream: any) => {
            //   console.log('screen share')

            //   myVideo.srcObject = remoteStream
            //   myVideo.onloadedmetadata = function (e) {
            //       myVideo.play();
            //   };
            //   videoGrid.appendChild(myVideo);
            // }, (err: any) => {
            //   console.log('failed to get stream ',err)
            // })
          })
          .catch(function (error: any) {
            console.log("Something went wrong!" +error);
          });
    }

    this.videoCallService.screenShareButton()

  };

  recordScreen() {
    this.videoCallService.recordScreenButton()
  };

  snapShot() {
    this.videoCallService.snapShotButton();

    let videoGrid = <HTMLDivElement> this.hardwareVideo.nativeElement;

    var context = this.canvas.nativeElement.getContext("2d").drawImage(videoGrid, 0, 0, 1024, 768);

    var picture: any = this.canvas.nativeElement.toDataURL("image/png");

    console.log(picture)

    // let canvas = <HTMLCanvasElement> this.canvas.nativeElement; // declare a canvas element in your html

    // var ctx = canvas.getContext("2d");

    // ctx.drawImage(videoGrid, 10, 10);

    // let ctx = canvas.getContext("2d");

    // ctx.drawImage(videoGrid, 0, 0);

    // var img = this.screenshot_img.nativeElement;

    // // let dataUrl = canvas.toDataURL('image/png');
    // // img.src = dataUrl;

    // this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
    // this.downloadLink.nativeElement.download = 'ScreenShot$.png';
    // this.downloadLink.nativeElement.click();

  };

  leaveMeeting() {
    this.videoCallService.leaveMettingButton()
  };

}
