import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../services/chat.service';
import {
  Observable,
  Subscription,
  debounceTime,
  delay,
  filter,
  map,
  skip,
  switchMap,
  tap,
} from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { MessageDTO } from '../../core/models/message';
import { Message } from '@stomp/stompjs';
import { UsersService } from '../../core/services/users/users.service';
import { AudioService } from '../../shared/services/audio.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
})
export class ChatWindowComponent implements OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeChat$: Observable<ChatListItem | null>;
  chats$!: Observable<MessageDTO[]>;

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
  private isFirstModify = true;
  constructor(
    private chatService: ChatService,
    private userService: UsersService,
    private audioService: AudioService
  ) {
    this.activeChat$ = this.chatService.activeChatModify$().pipe(
      tap((modified) => {
        console.log('Active Chat Modified:', modified);
        if(modified) {
        if (!this.isFirstModify) {
          this.audioService.messageStatusUpdateSound();
        }
        this.isFirstModify = false;
      }
      }),
      switchMap(() => this.chatService.getActiveChat$())
    );
    const newMessageSub = this.chatService
      .onNewMessage$()
      .pipe(
        filter(
          (
            message //filtering messages that are not from the active chat
          ) =>
            [this.activeChat?.id, this.userService.getCurrentUserId()].includes(
              message.senderId
            )
        ),
        tap((message) => {
          console.log('New Message:', message);
          this.allChats = [...this.allChats, message];
        })
      )
      .subscribe();

    const activeChatSub = this.activeChat$
      .pipe(
        filter((activeChat) => Boolean(activeChat)),
        map((activeChat) => activeChat as ChatListItem),
        tap((activeChat) => {
          console.debug('Active Chat:', activeChat);
          this.activeChat = activeChat;
          this.chatService.markChatItemAsRead(this.activeChat);
        }),
        switchMap((activeChat) =>
          this.chatService.getActiveChatMessages$(activeChat).pipe(
            tap((messages) => {
              console.log('Messages:', messages);
              this.allChats = [...messages];
              //  setTimeout(()=> this.scrollToBottom(), 200);
            })
          )
        )
      )
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
