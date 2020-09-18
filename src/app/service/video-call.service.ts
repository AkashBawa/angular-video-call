import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {

  API_URL = 'http://localhost:3000';

  myMicMute: boolean = false;
  myVideoOff: boolean = false;

  myScreenShare: boolean = false;
  startRecording: boolean = false;

  constructor(private http: HttpClient) { }

  getVideoRoomId() {
    this.http.get( this.API_URL +'/video/roomId' ).subscribe( (result) => {
      console.log(result)
    })
  };

  micMuteUnmuteButton(selector: any) {
    if(selector == 'mute') {
        this.myMicMute = true;
    } else if (selector == 'unmute') {
        this.myMicMute = false;
    } else {
        this.myMicMute = !this.myMicMute;
    }
  };

  videoOnOffButton(selector: any) {
    if(selector == 'videoOff') {
        this.myVideoOff = true;
    } else if (selector == 'videoOn') {
        this.myVideoOff = false;
    } else {
        this.myVideoOff = !this.myVideoOff;
    }
  };

  screenShareButton() {
    this.myScreenShare = !this.myScreenShare;
  };

  recordScreenButton() {
    this.startRecording = !this.startRecording;
  };

  snapShotButton() {
    console.log('ss taken')
  };

  leaveMettingButton() {
    console.log('exit meeting')
  };

}
