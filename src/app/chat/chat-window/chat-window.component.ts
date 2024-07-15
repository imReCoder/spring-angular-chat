import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Observable, delay, switchMap, tap } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { MessageDTO } from '../../core/models/message';
import { Message } from '@stomp/stompjs';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeChat$:Observable<ChatListItem | null>;
  chats$!:Observable<MessageDTO[]> ;
  message:MessageDTO = {
    receiverId: '123',
    senderId: '102',
    content: 'Hello',
    timestamp: Date.now(),
  };

  inputMessage='';

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if(event.key === 'Enter') {
      this.sendMessage();
    }
  }

  activeChat: ChatListItem | null = null;
  allChats:MessageDTO[] = [];
  constructor(private chatService:ChatService) {
    this.activeChat$ = this.chatService.getActiveChat$();
    this.chatService.onNewMessage$().subscribe((message) => {
      // if(message.senderId === this.activeChat?.id) {
        console.log('New Message:', message);
       this.allChats = [...this.allChats, message];
       setTimeout(() => {
       this.chatService.markChatItemAsRead(this.activeChat as ChatListItem);
      //  this.scrollToBottom();
       },100)
      // }
    })
    this.activeChat$.subscribe((chat) => {
      if(!chat) return
      console.log('Active Chat:', chat);
      this.activeChat = chat;
      this.chatService.markChatItemAsRead(chat as ChatListItem);
      this.chatService.getActiveChatMessages$(chat).subscribe((messages) => {
        this.allChats = [...messages];
      //  setTimeout(()=> this.scrollToBottom(), 200);
      })
    });

    // mark chat item as read

  }


  sendMessage() {
    if(!this.activeChat) return console.error('No Active Chat');
    if(!this.inputMessage?.length) return console.error('No Message');
    console.log('Sending Message:', this.inputMessage);
   const message = this.chatService.createMessage(this.inputMessage, this.activeChat.id as string);
    console.log('Message:', message);
    this.chatService.sendMessage(message);
    this.inputMessage = '';
  }

  onInView(message:MessageDTO) {
    // console.log('In View:', message);
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
