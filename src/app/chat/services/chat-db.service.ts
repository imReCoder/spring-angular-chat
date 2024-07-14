import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MessageDTO } from '../../core/models/message';
import { BehaviorSubject, Subject, firstValueFrom, tap } from 'rxjs';
import { User } from '../../core/models/user';
import { ChatListItem } from '../../core/models/chat-list-item';

@Injectable({
  providedIn: 'root',
})
export class ChatDbService {
  public static readonly _chatsStore = 'chats';
  public static readonly _usersStore = 'users';
  public static readonly _chatListStore = 'chatList';

  public _chatListModifySubject = new BehaviorSubject<boolean>(true);

  constructor(private indexDb: NgxIndexedDBService) {
    console.log('ChatDbService Initialized...............', this._chatsStore);
    indexDb.createObjectStore({
      store: this._chatsStore,
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'senderId', keypath: 'senderId', options: { unique: false } },
        {
          name: 'receiverId',
          keypath: 'receiverId',
          options: { unique: false },
        },
        { name: 'content', keypath: 'message', options: { unique: false } },
        { name: 'timestamp', keypath: 'timestamp', options: { unique: false } },
      ],
    });

    indexDb.createObjectStore({
      store: this._usersStore,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'email', keypath: 'email', options: { unique: false } },
        {
          name: 'profileImage',
          keypath: 'profileImage',
          options: { unique: false },
        },
        { name: 'id', keypath: 'id', options: { unique: true } },
      ],
    });

    indexDb.createObjectStore({
      store: this._chatListStore,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'email', keypath: 'email', options: { unique: false } },
        {
          name: 'profileImage',
          keypath: 'profileImage',
          options: { unique: false },
        },
        { name: 'id', keypath: 'id', options: { unique: true } },
        {
          name: 'lastMessage',
          keypath: 'lastMessage',
          options: { unique: false },
        },
        {
          name: 'lastMessageTimestamp',
          keypath: 'lastMessageTimestamp',
          options: { unique: false },
        }
      ],
    });
  }

  get _chatsStore() {
    return ChatDbService._chatsStore;
  }

  get _usersStore() {
    return ChatDbService._usersStore;
  }

  get _chatListStore() {
    return ChatDbService._chatListStore;
  }

  addMessageAsync(message: MessageDTO) {
    console.log('Adding Message to DB...............', message);
    return firstValueFrom(this.indexDb.update(this._chatsStore, message));
  }

  addUserAsync(user: User) {
    console.log('Adding User to DB...............', user);
    return firstValueFrom(this.indexDb.update(this._usersStore, user));
  }

  addChatListItemAsync(chatListItem: ChatListItem) {
    console.log('Adding Chat List to DB...............', chatListItem);
    return firstValueFrom(this.indexDb.update(this._chatListStore, chatListItem).pipe(tap(() => this._chatListModifySubject.next(true))));
  }

  getChatList$() {
    console.log('Getting Chat List from DB...............');
    return this.indexDb.getAll<ChatListItem>(this._chatListStore);
  }

  get chatListModifySubject$() {
    return this._chatListModifySubject.asObservable();
  }
}
