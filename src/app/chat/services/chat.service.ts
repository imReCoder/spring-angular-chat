import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  filter,
  iif,
  map,
  mergeMap,
  of,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import {
  MessageDTO,
  MessageStatus,
  MessageUpdateDTO,
} from '../../core/models/message';
import { UsersService } from '../../core/services/users/users.service';
import { TokenService } from '../../core/services/token/token.service';
import { ChatDbService } from './chat-db.service';
import { ChatApiService } from './chat-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  activeChat$ = new BehaviorSubject<ChatListItem | null>(null);
  userId = this.tokenService.getUsreId();
  onNewMessageSubject = new Subject<MessageDTO>();
  public _activeChatModifySubject = new BehaviorSubject<boolean>(false);

  private subs = new Subscription();

  constructor(
    private wsService: WebsocketsService,
    private tokenService: TokenService,
    private chatDb: ChatDbService,
    private usersService: UsersService,
    private chatApi: ChatApiService
  ) {
    console.log('ChatService Initialized...............');
    const newMessageSub = this.wsService
      .onIncomingMessage$()
      .pipe(switchMap((message) => this._handleIncomingMessage(message)))
      .subscribe();
    this.subs.add(newMessageSub);
    this.initWebSocket();
    setTimeout(() => this.getNewMessages(),1000);
  }



  getNewMessages() {
    this.chatApi
      .getNewMessages()
      .pipe(
        filter((messages) => messages.length > 0),
        tap((messages) => {
          console.log('New Messages:', messages);
          messages.forEach((message) => {
            this._handleIncomingMessage(message).subscribe();
          });
          this.wsService.sendMessageUpdateDelivered(
            messages[messages.length - 1]
          );
        })
      )
      .subscribe();
  }

  initWebSocket() {
    return this.wsService.initializeWebSocketConnection();
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
      messageClientId: `${this.userId}_${to}_${Date.now()}`,
      status: MessageStatus.QUEUED,
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
      switchMap((activeChat) => {
        const chatItemUpdate = {
          ...chatListItemChanges,
          unread:
            activeChat?.id === remoteUserId ? 0 : chatListItemChanges.unread,
        };
        return this.chatDb.updateChatListItem$(remoteUserId, chatItemUpdate);
      })
    );
  }


  private _handleIncomingMessage(message: MessageDTO) {
    return this.chatDb.addMessage$(message).pipe(
      tap(() => this.onNewMessageSubject.next(message)),
      switchMap(() => this.chatDb.isUserIdPresentInChatList(message.senderId)),
      switchMap((isPresent) =>
        isPresent
          ? this.updateChatListItem$(isPresent.id as string, {
              lastMessage: message.content,
              lastMessageTimestamp: message.timestamp,
              unread: isPresent.unread + 1,
            })
          : this._handleNewChatListItem(message)
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

  updateMessageStatusByClientId$(messageUpdate: MessageUpdateDTO) {
    return this.chatDb
      .getChatMessageByMessageClientId(messageUpdate.messageClientId as string)
      .pipe(
        mergeMap((message) =>
          this.chatDb.addMessage$({
            ...message,
            status: messageUpdate.status,
            messageId: messageUpdate.messageId ?? message.messageId,
          })
        ),
        switchMap((message) =>this.triggerActiveChatModifyIfRequired(message))
      );
  }


  updateAllPreviousMessagesByMessageId$(messageUpdate: MessageUpdateDTO) {
    return this.chatDb.getChatMessageById$(messageUpdate.messageId as string).pipe(
      switchMap((message) =>
        this.chatDb.updateAllPreviousMessagesByMessageId$(messageUpdate).pipe(
          switchMap(() => this.triggerActiveChatModifyIfRequired(message))
        )
      )
    );
  }

  triggerActiveChatModifyIfRequired(message:MessageDTO){
    return   this.getActiveChat$().pipe(
      filter((activeChat) => Boolean(activeChat)),
      map((activeChat) => activeChat as ChatListItem),
      tap((activeChat) => {
        if (activeChat?.id == message.receiverId) {
          //active chat is remote id and all status updates will be coming for sent message , and in sent message remote id is receiver id
          this._activeChatModifySubject.next(true);
        }
      })
    )
  }

  activeChatModify$() {
    return this._activeChatModifySubject.asObservable();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
