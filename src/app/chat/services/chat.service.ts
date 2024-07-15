import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { MessageDTO } from '../../core/models/message';
import { UsersService } from '../../core/services/users/users.service';
import { TokenService } from '../../core/services/token/token.service';
import { ChatDbService } from './chat-db.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  activeChat$ = new BehaviorSubject<ChatListItem | null>(null);
  userId = this.tokenService.getUsreId();
  onNewMessageSubject =new Subject<MessageDTO>();
  constructor(
    private wsService: WebsocketsService,
    private tokenService: TokenService,
    private chatDb: ChatDbService,
    private usersService: UsersService
  ) {
    console.log('ChatService Initialized...............');
    this.wsService.onIncomingMessage$().subscribe((message) => {
      this.onNewMessageSubject.next(message);
      this.chatDb
        .isUserIdPresentInChatList(message.senderId)
        .subscribe(async (isPresent) => {
          console.log('isPresent:', isPresent);

          if (!isPresent) {
            this.usersService
              .getUserById(message.senderId)
              .subscribe(async (user) => {
                await this.chatDb.addUserAsync(user);
                const chatListItem: ChatListItem = {
                  ...user,
                  lastMessage: message.content,
                  lastMessageTimestamp: message.timestamp,
                  unread: 1,
                };
                await this.chatDb.addChatListItemAsync(chatListItem);
              });
          }
          await this.chatDb.updateChatListItem(isPresent.id as string, {
            lastMessage: message.content,
            lastMessageTimestamp: message.timestamp,
            unread: isPresent.unread + 1,
          });
          await this.chatDb.addMessageAsync(message);
        });
      console.log('Incoming Message:', message);
    });
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

  sendMessage(message: MessageDTO) {
    this.wsService.sendMessage(message);
    this.onNewMessageSubject.next(message);
  }

  markChatItemAsRead(chatListItem: ChatListItem) {
    return this.chatDb.markChatItemAsReadAsync(chatListItem);
  }

  getActiveChatMessages$(activeChat:ChatListItem) {
    // activeChat.id will always belongs to remote user
    return this.chatDb.getChatMessages(activeChat.id as string, this.userId);
  }

  onNewMessage$() {
    return this.onNewMessageSubject.asObservable();
  }
}
