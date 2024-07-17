import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MessageDTO, MessageUpdateDTO } from '../../core/models/message';
import { BehaviorSubject, Subject, map, merge, reduce, switchMap, tap, pipe, firstValueFrom } from 'rxjs';
import { User } from '../../core/models/user';
import { ChatListItem } from '../../core/models/chat-list-item';
import { Message } from '@stomp/stompjs';

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
    this.indexDb.createObjectStore({
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
        { name: 'messageClientId', keypath: 'messageClientId', options: { unique: false } },
        { name: 'senderId_receiverId', keypath: 'senderId_receiverId', options: { unique: false } }

      ],
    }).then(() => console.log('Chats Store Created...............')).catch(console.log);

   this.indexDb.createObjectStore({
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
    }).then(() => console.log('Users Store Created...............')).catch(console.log);

    this.indexDb.createObjectStore({
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
        },
        {
          name: 'unreadMessages',
          keypath: 'unreadMessages',
          options: { unique: false },
        },
        {
          name:"unread",
          keypath:"unread",
          options:{unique:false}
        }
      ],
    }).then(() => console.log('Chat List Store Created...............')).catch(console.log);
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
    const id = `${message.senderId}_${message.receiverId}`;
    return firstValueFrom(this.indexDb.update(this._chatsStore, {...message ,senderId_receiverId:id}));
  }

  addMessage$(message: MessageDTO) {
    const id = `${message.senderId}_${message.receiverId}`;
    return this.indexDb.update(this._chatsStore, {...message ,senderId_receiverId:id});
  }

  addUserAsync(user: User) {
    return firstValueFrom(this.indexDb.update(this._usersStore, user));
  }

  addUser$(user: User) {
    return this.indexDb.update(this._usersStore, user);
  }

  addChatListItemAsync(chatListItem: ChatListItem) {
    return firstValueFrom(this.indexDb.update(this._chatListStore, chatListItem).pipe(tap(() => this._chatListModifySubject.next(true))));
  }

  addChatListItem$(chatListItem: ChatListItem) {
    return this.indexDb.update(this._chatListStore, chatListItem).pipe(tap(() => this._chatListModifySubject.next(true)));
  }



  getChatListItemByRemoteUserId(remoteUserId: string) {
    return firstValueFrom(this.indexDb.getByIndex<ChatListItem>(this._chatListStore, 'id', remoteUserId));
  }

  getChatListItemByRemoteUserId$(remoteUserId: string) {
    return this.indexDb.getByIndex<ChatListItem>(this._chatListStore, 'id', remoteUserId);
  }

  updateChatListItem$(remoteUserId:string,chatListItemChanges:Partial<ChatListItem>,t?:number){
    // get chat list item and update unread count;
    console.log('Updating Chat List Item for user...............',remoteUserId,"T:",t);
    return this.getChatListItemByRemoteUserId$(remoteUserId).pipe(
      map((chatListItem)=>({...chatListItem,...chatListItemChanges})),
      switchMap((chatListItem)=>this.addChatListItem$(chatListItem))
    )
  }

  getChatList$() {
    return this.indexDb.getAll<ChatListItem>(this._chatListStore);
  }

  get chatListModifySubject$() {
    return this._chatListModifySubject.asObservable();
  }

  isUserIdPresentInChatList(userId:string){
    return this.indexDb.getByIndex<ChatListItem>(this._chatListStore,'id',userId);
  }

  markChatItemAsReadAsync(chatListItem:ChatListItem){
    chatListItem.unread = 0;
    return firstValueFrom(this.indexDb.update(this._chatListStore,chatListItem).pipe(tap(()=>this._chatListModifySubject.next(true))));
  }

  getChatMessages(remoteUserId:string,currentUserId:string){
    const sentByYouId = `${remoteUserId}_${currentUserId}`;
    const sentByMeId = `${currentUserId}_${remoteUserId}`;

    const sentByYouKeyRange = IDBKeyRange.bound(sentByYouId,sentByYouId);
    const sentByMeKeyRange = IDBKeyRange.bound(sentByMeId,sentByMeId);

    const sentByYouMessages = this.indexDb.getAllByIndex<MessageDTO>(this._chatsStore,'senderId_receiverId',sentByYouKeyRange);
    const sentByMeMessages = this.indexDb.getAllByIndex<MessageDTO>(this._chatsStore,'senderId_receiverId',sentByMeKeyRange);

    return merge(sentByYouMessages,sentByMeMessages).pipe(reduce((a,b)=>a.concat(b)),map((messages)=>messages.sort((a:MessageDTO,b:MessageDTO)=>a.timestamp - b.timestamp)));
  }

  getChatMessageById$(messageId:string){}
  getChatMessageByMessageClientId(messageClientId:string){
    return this.indexDb.getByIndex<MessageDTO>(this._chatsStore,'messageClientId',messageClientId);
  }

}
