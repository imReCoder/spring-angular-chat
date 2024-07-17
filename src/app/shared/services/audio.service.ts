import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  messageUpdateAudio = new Audio();
  constructor() {
    this.messageUpdateAudio.src = 'assets/sounds/status-update.mp3';
    this.messageUpdateAudio.load();
    this.messageUpdateAudio.loop = false;
  }

  messageStatusUpdateSound(){
    this.messageUpdateAudio.currentTime = 0;
      this.messageUpdateAudio.play();
  }
}
