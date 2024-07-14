import { Component } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Observable, tap } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { MessageDTO } from '../../core/models/message';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent {
  activeChat$:Observable<ChatListItem | null>;
  message:MessageDTO = {
    receiverId: '123',
    senderId: '102',
    content: 'Hello',
    timestamp: Date.now(),
  };

  inputMessage='';

  activeChat: ChatListItem | null = null;
  constructor(private chatService:ChatService) {
    this.activeChat$ = this.chatService.getActiveChat$();

    this.activeChat$.subscribe((chat) => {
      console.log('Active Chat:', chat);
      this.activeChat = chat;
    })
  }

  sendMessage() {
    if(!this.activeChat) return console.error('No Active Chat');
    console.log('Sending Message:', this.inputMessage);
   const message = this.chatService.createMessage(this.inputMessage, this.activeChat.id as string);
    console.log('Message:', message);
    this.inputMessage = '';
  }
}
