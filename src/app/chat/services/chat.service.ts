import { NotificationService } from './../../shared/services/notification.service';
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  concatMap,
  filter,
  from,
  iif,
  map,
  mergeMap,
  of,
  pipe,
  switchMap,
  take,
  tap,
  toArray,
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
import { UserStatusService } from './user-status.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  activeChat$ = new BehaviorSubject<ChatListItem | null>(null);
  userId = this.tokenService.getUsreId() as string;
  onNewMessageSubject = new Subject<MessageDTO>();
  public _activeChatModifySubject = new BehaviorSubject<boolean>(false);

  private subs = new Subscription();

  constructor(
    private wsService: WebsocketsService,
    private tokenService: TokenService,
    private chatDb: ChatDbService,
    private usersService: UsersService,
    private chatApi: ChatApiService,
    private userStatusService: UserStatusService,
    private ns: NotificationService
  ) {
    this.getNewMessages();
    this._getMessageStatusChanges();
    const initialUserStatusSub = this.chatDb
      .getChatList$()
      .pipe(
        take(1),
        switchMap((chatList) =>
          this.userStatusService.getInitialUserStatus(chatList)
        )
      )
      .subscribe();

    const socketSub = this.wsService
      .onSocketConnected$()
      .subscribe((isConnected) => {
        this.initUserStatus();
      });

    const newMessageSub = this.wsService
      .onIncomingMessage$()
      .pipe(switchMap((message) => this._handleIncomingMessage(message)))
      .subscribe();

    this.initWebSocket();

    this.subs.add(newMessageSub);
    this.subs.add(socketSub);
    this.subs.add(initialUserStatusSub);
  }

  initWebSocket() {
    return this.wsService.initializeWebSocketConnection();
  }

  getNewMessages() {
    this.chatApi
      .getNewMessages()
      .pipe(
        filter((messages) => messages.length > 0),
        mergeMap((messages) => {
          return from(messages).pipe(
            concatMap((message) => this._handleIncomingMessage(message)),
            toArray(),
            tap(() => {
              this.wsService.sendMessageUpdateDelivered(
                messages[messages.length - 1]
              );
            })
          );
          //
        })
      )
      .subscribe();
  }

  initUserStatus() {
    const userStatusSub = this.chatDb
      .getChatList$()
      .pipe(
        take(1),
        tap((chatListItems) =>
          this.userStatusService.initUserStatusChange(chatListItems)
        )
      )
      .subscribe();
    this.subs.add(userStatusSub);
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

  async markChatItemAsRead(chatListItem: ChatListItem) {
    await this.chatDb.markChatItemAsReadAsync(chatListItem);
    // return this.markChatsAsRead(chatListItem);
  }

  markChatsAsRead(chatListItem: ChatListItem) {
    return this.chatDb.getLastMessageByRemoteUserId$(chatListItem.id).pipe(
      tap((lastMessage) => {
        if (!lastMessage)
          return console.debug('No messages found for chat item');
        if (lastMessage.status === MessageStatus.READ)
          return console.debug('All chats already marks read');
        this.wsService.sendMessageUpdateRead(lastMessage);
        return this.chatDb.updateAllPreviousReceivedMessagesStatusByMessageId$({
          status: MessageStatus.READ,
          messageId: lastMessage.messageId as string,
        });
      })
    );
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
      take(1),
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
    return this.getActiveChat$().pipe(
      take(1),
      switchMap((activeChat) => {
        return this.chatDb.addMessage$(message).pipe(
          tap(() => this.onNewMessageSubject.next(message)),
          switchMap(() =>
            this.chatDb.isUserIdPresentInChatList(message.senderId)
          ),
          switchMap((isPresent) => {
            return isPresent
              ? this.updateChatListItem$(isPresent.id as string, {
                  lastMessage: message.content,
                  lastMessageTimestamp: message.timestamp,
                  unread: isPresent.unread + 1,
                })
              : this._handleNewChatListItem(message);
          }),
          tap((chatItem) => {
            if (activeChat?.id !== message.senderId) {//if sender is not active chat then show notification
              this.ns.showNotification(`${chatItem.name}`, {//show notification
                body: message.content,
                // icon: 'assets/icons/icon-72x72.png',
              });
            }
          }), // show notification
        );
      })
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
        switchMap((message) => this.triggerActiveChatModifyIfRequired(message))
      );
  }

  updateAllPreviousMessagesByMessageId$(messageUpdate: MessageUpdateDTO) {
    return this.chatDb
      .getChatMessageById$(messageUpdate.messageId as string)
      .pipe(
        concatMap((message) =>
          this.chatDb
            .updateAllPreviousSentMessagesStatusByMessageId$(messageUpdate)
            .pipe(
              switchMap(() => this.triggerActiveChatModifyIfRequired(message))
            )
        )
      );
  }

  // if message status of active chat is updated then we need to update the active chat
  triggerActiveChatModifyIfRequired(message: MessageDTO) {
    return this.getActiveChat$().pipe(
      take(1),
      filter((activeChat) => Boolean(activeChat)),
      map((activeChat) => activeChat as ChatListItem),
      tap((activeChat) => {
        if (activeChat?.id == message.receiverId) {
          //active chat is remote id and all status updates will be coming for sent message , and in sent message remote id is receiver id
          this._activeChatModifySubject.next(true);
        }
      })
    );
  }

  activeChatModify$() {
    return this._activeChatModifySubject.asObservable();
  }

  // get the last sent message of all the chat list item and fetch its current status
  private _getMessageStatusChanges() {
    return this.chatDb
      .getChatList$()
      .pipe(
        take(1),
        switchMap((chatListItems) => {
          return from(chatListItems).pipe(
            mergeMap((chatListItem) =>
              this.chatDb.getLastMessageByMeTo$(chatListItem.id as string)
            ),
            filter((message) => message.status !== MessageStatus.READ), //if message is already read then no need to update
            // map it to create array of message ids
            map((message) => message.messageId as string),
            toArray(),
            switchMap((messageIds) => {
              if (messageIds.length === 0) return of([]);
              return this.chatApi.getMessagesLatestStatus$(messageIds).pipe(
                map((messageUpdates) => ({ messageIds, messageUpdates }))
              );
            })
          );
        }),
        map((result) => result as {messageIds:string[],messageUpdates:MessageUpdateDTO[]}),
        map(({messageIds,messageUpdates}) => {
          const updatedMessageIds = messageUpdates?.map((update) => update.messageId);
          const missingMessageIds = messageIds?.filter(id => !updatedMessageIds.includes(id));
          const missingupdates = missingMessageIds?.map(id => ({messageId:id,status:MessageStatus.READ}));
          return {messageUpdates:[...messageUpdates,...missingupdates]};
        }),//
        switchMap((result) => {
          return from(result.messageUpdates).pipe(
            mergeMap((messageUpdate) =>
              this.updateAllPreviousMessagesByMessageId$(messageUpdate)
            )
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
