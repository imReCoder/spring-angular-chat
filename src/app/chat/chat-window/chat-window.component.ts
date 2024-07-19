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
        if (modified) {
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
          this.allChats = [...this.allChats, message];
        }),
        switchMap((message) => this.markAllChatAsRead(message))
      )
      .subscribe();

    const activeChatSub = this.activeChat$
      .pipe(
        filter((activeChat) => Boolean(activeChat)),
        map((activeChat) => activeChat as ChatListItem),
        tap(async (activeChat) => {
          console.debug('Active Chat:', activeChat);
          this.activeChat = activeChat;
          await this.chatService.markChatItemAsRead(this.activeChat);
        }),
        switchMap((activeChat) =>
          this.chatService
            .getActiveChatMessages$(activeChat)
            .pipe(
              tap((messages) => {
                this.allChats = [...messages];
                //  setTimeout(()=> this.scrollToBottom(), 200);
              }),
              switchMap((messages) => {
                const lastMessage = messages[messages.length - 1];
                return this.markAllChatAsRead(lastMessage);
              })
            )

        )
      )
      .subscribe();

    this.subs.add(activeChatSub);
    this.subs.add(newMessageSub);
  }

  markAllChatAsRead(lastMessage: MessageDTO) {
    console.log(
      'Last Message:',
      lastMessage,
      this.userService.getCurrentUserId()
    );
    if (lastMessage?.senderId !== this.userService.getCurrentUserId()) {
      console.log('Marking as Read:', this.activeChat);
      return this.chatService.markChatsAsRead(this.activeChat as ChatListItem);
    }
    console.log('Last message is not present or is from current user');
    return [];
  }

  sendMessage() {
    if (!this.activeChat) return console.error('No Active Chat');
    if (!this.inputMessage?.length) return console.error('No Message');
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
    this.subs.unsubscribe();
  }
}
