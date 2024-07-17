import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  iif,
  of,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { MessageDTO } from '../../core/models/message';
import { UsersService } from '../../core/services/users/users.service';
import { TokenService } from '../../core/services/token/token.service';
import { ChatDbService } from './chat-db.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  activeChat$ = new BehaviorSubject<ChatListItem | null>(null);
  userId = this.tokenService.getUsreId();
  onNewMessageSubject = new Subject<MessageDTO>();

  private subs = new Subscription();

  constructor(
    private wsService: WebsocketsService,
    private tokenService: TokenService,
    private chatDb: ChatDbService,
    private usersService: UsersService
  ) {
    console.log('ChatService Initialized...............');
    const newMessageSub = this.wsService
      .onIncomingMessage$()
      .pipe(switchMap((message) => this._handleIncomingMessage(message)))
      .subscribe();
    this.subs.add(newMessageSub);
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

  createMessage(message: string, to: string): MessageDTO {
    return {
      receiverId: to,
      senderId: this.userId,
      content: message,
      timestamp: Date.now(),
    };
  }

  async sendMessage(message: MessageDTO) {
    this.wsService.sendMessage(message);
    this.onNewMessageSubject.next(message);
    await this.chatDb.addMessageAsync(message);
  }

  markChatItemAsRead(chatListItem: ChatListItem) {
    return this.chatDb.markChatItemAsReadAsync(chatListItem);
  }

  getActiveChatMessages$(activeChat: ChatListItem) {
    // activeChat.id will always belongs to remote user
    return this.chatDb.getChatMessages(activeChat.id as string, this.userId);
  }

  onNewMessage$() {
    return this.onNewMessageSubject.asObservable();
  }


  // update chat list item based on the active chat , if its active chat then make unread 0
  updateChatListItem$(
    remoteUserId: string,
    chatListItemChanges: Partial<ChatListItem>
  ) {
    return this.getActiveChat$().pipe(
      tap((activeChat) => console.log('Active Chat:', activeChat)),
      switchMap((activeChat) =>{
        const chatItemUpdate = {
          ...chatListItemChanges,
          unread: activeChat?.id === remoteUserId ? 0 : chatListItemChanges.unread,
        }
        console.log('Chat Item Update:', chatItemUpdate);
        return this.chatDb.updateChatListItem$(remoteUserId, chatItemUpdate);
      }
      )
    );
  }

  private _handleIncomingMessage(message: MessageDTO) {
    return this.chatDb.addMessage$(message).pipe(
      tap(() => this.onNewMessageSubject.next(message)),
      switchMap(() => this.chatDb.isUserIdPresentInChatList(message.senderId)),
      tap((isPresent) => console.log('Is Present:', isPresent)),
      switchMap((isPresent) =>
        iif(
          () => Boolean(isPresent),
          this.updateChatListItem$(isPresent.id as string, {
            lastMessage: message.content,
            lastMessageTimestamp: message.timestamp,
            unread: isPresent.unread + 1,
          }),
          this._handleNewChatListItem(message)
        )
      )
    );
  }

  private _handleNewChatListItem(message: MessageDTO) {
    return this.usersService.getUserById(message.senderId).pipe(
      switchMap((user) =>
        this.chatDb.addUser$(user).pipe(
          switchMap(() => {
            const chatListItem = {
              ...user,
              lastMessage: message.content,
              lastMessageTimestamp: message.timestamp,
              unread: 1,
            };
            return this.chatDb.addChatListItem$(chatListItem);
          })
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
