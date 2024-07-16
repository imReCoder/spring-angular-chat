import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Observable, Subscription, delay, filter, switchMap, tap } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { MessageDTO } from '../../core/models/message';
import { Message } from '@stomp/stompjs';
import { UsersService } from '../../core/services/users/users.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements OnDestroy {
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

  private subs = new Subscription();

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if(event.key === 'Enter') {
      this.sendMessage();
    }
  }

  activeChat: ChatListItem | null = null;
  allChats:MessageDTO[] = [];

  constructor(private chatService:ChatService,private userService:UsersService) {
    this.activeChat$ = this.chatService.getActiveChat$();
    const newMessageSub = this.chatService.onNewMessage$().pipe(filter((message)=>[this.activeChat?.id,this.userService.getCurrentUserId()].includes(message.senderId))).subscribe((message) => {
        console.log('New Message:', message);
       this.allChats = [...this.allChats, message];
       setTimeout(() => {
       this.chatService.markChatItemAsRead(this.activeChat as ChatListItem);
      //  this.scrollToBottom();
       },100)
    })
   const activeChatSub =  this.activeChat$.subscribe((chat) => {
      if(!chat) return
      console.log('Active Chat:', chat);
      this.activeChat = chat;
      this.chatService.markChatItemAsRead(chat as ChatListItem);
      this.chatService.getActiveChatMessages$(chat).subscribe((messages) => {
        console.log('Messages:', messages);
        this.allChats = [...messages];
      //  setTimeout(()=> this.scrollToBottom(), 200);
      })
    });

   this.subs.add(activeChatSub);
    this.subs.add(newMessageSub);
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

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    console.log('Destroying Chat Window');
    this.subs.unsubscribe();
  }
}
