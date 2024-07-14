import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { MessageDTO } from '../../core/models/message';
import { UsersService } from '../../core/services/users/users.service';
import { TokenService } from '../../core/services/token/token.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  activeChat$ = new BehaviorSubject<ChatListItem | null>(null);
  userId = this.tokenService.getUsreId();
  constructor(private wsService: WebsocketsService,private tokenService:TokenService) {
    console.log('ChatService Initialized...............');
    this.initWebSocket();
  }

  initWebSocket() {
    this.wsService.initializeWebSocketConnection();
  }

  setActiveChat(chat: ChatListItem): void {
    this.activeChat$.next(chat);
  }

  getActiveChat$() {
    return this.activeChat$.asObservable();
  }

  createMessage(message: string,to:string):MessageDTO {
    return {
      receiverId: to,
      senderId: this.userId,
      content: message,
      timestamp: Date.now(),
    };
  }

  sendMessage(message: MessageDTO) {
    this.wsService.sendMessage(message);
  }
}
