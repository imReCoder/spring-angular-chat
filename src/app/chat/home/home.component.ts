import { Component } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private wsService:WebsocketsService) {
    this.wsService.initializeWebSocketConnection();
    setTimeout(() => {
      this.wsService.sendMessage({
        senderId: '123',
        receiverId: '456',
        content: 'Hello, how are you?'
      });
    },3000)
   }
}
