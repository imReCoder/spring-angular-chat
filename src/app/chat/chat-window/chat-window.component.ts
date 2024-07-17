import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Observable, Subscription, debounceTime, delay, filter, map, switchMap, tap } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { MessageDTO } from '../../core/models/message';
import { Message } from '@stomp/stompjs';
import { UsersService } from '../../core/services/users/users.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
})
export class ChatWindowComponent implements OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeChat$: Observable<ChatListItem | null>;
  chats$!: Observable<MessageDTO[]>;
  message: MessageDTO = {
    receiverId: '123',
    senderId: '102',
    content: 'Hello',
    timestamp: Date.now(),
  };

  inputMessage = '';

  private subs = new Subscription();

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  activeChat: ChatListItem | null = null;
  allChats: MessageDTO[] = [];

  constructor(
    private chatService: ChatService,
    private userService: UsersService
  ) {
    this.activeChat$ = this.chatService.getActiveChat$();
    const newMessageSub = this.chatService
      .onNewMessage$()
      .pipe(
        filter((message) => //filtering messages that are not from the active chat
          [this.activeChat?.id, this.userService.getCurrentUserId()].includes(
            message.senderId
          )
        ),
        tap(message=>{
          console.log('New Message:', message);
          this.allChats = [...this.allChats, message];
        }),
        debounceTime(100),//wait for 100ms before marking the chat as read
        tap(() =>  this.chatService.markChatItemAsRead(this.activeChat as ChatListItem))
      )
      .subscribe();

    const activeChatSub = this.activeChat$
      .pipe(filter((activeChat) => Boolean(activeChat)),
      map(activeChat=> activeChat as ChatListItem),
      tap(activeChat=>{
        console.debug('Active Chat:', activeChat);
        this.activeChat = activeChat;
        this.chatService.markChatItemAsRead(this.activeChat);
      }),
      switchMap((activeChat) => this.chatService
      .getActiveChatMessages$(activeChat).pipe(
        tap(messages=>{
          console.log('Messages:', messages);
          this.allChats = [...messages];
          //  setTimeout(()=> this.scrollToBottom(), 200);
        })
      )))
      .subscribe();

    this.subs.add(activeChatSub);
    this.subs.add(newMessageSub);
  }

  sendMessage() {
    if (!this.activeChat) return console.error('No Active Chat');
    if (!this.inputMessage?.length) return console.error('No Message');
    console.log('Sending Message:', this.inputMessage);
    const message = this.chatService.createMessage(
      this.inputMessage,
      this.activeChat.id as string
    );
    console.log('Message:', message);
    this.chatService.sendMessage(message);
    this.inputMessage = '';
  }

  onInView(message: MessageDTO) {
    // console.log('In View:', message);
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    console.log('Destroying Chat Window');
    this.subs.unsubscribe();
  }
}
