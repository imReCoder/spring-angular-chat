import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MessageDTO } from '../../core/models/message';
import { BehaviorSubject, Subject, firstValueFrom, map, merge, reduce, switchMap, tap } from 'rxjs';
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
    console.log('Adding Message to DB...............', message);
    const id = `${message.senderId}_${message.receiverId}`;
    return firstValueFrom(this.indexDb.update(this._chatsStore, {...message ,senderId_receiverId:id}));
  }

  addUserAsync(user: User) {
    console.log('Adding User to DB...............', user);
    return firstValueFrom(this.indexDb.update(this._usersStore, user));
  }

  addChatListItemAsync(chatListItem: ChatListItem) {
    console.log('Adding Chat List to DB...............', chatListItem);
    return firstValueFrom(this.indexDb.update(this._chatListStore, chatListItem).pipe(tap(() => this._chatListModifySubject.next(true))));
  }

  addChatListItem(chatListItem: ChatListItem) {
    return this.indexDb.update(this._chatListStore, chatListItem).pipe(tap(() => this._chatListModifySubject.next(true)));
  }



  getChatListItemByRemoteUserId(remoteUserId: string) {
    console.log('Getting Chat List Item from DB...............', remoteUserId);
    return firstValueFrom(this.indexDb.getByIndex<ChatListItem>(this._chatListStore, 'id', remoteUserId));
  }

  updateChatListItem(remoteUserId:string,chatListItemChanges:Partial<ChatListItem>){
    // get chat list item and update unread count;
    console.log('Updating Chat List Item...............',remoteUserId);
    return this.getChatListItemByRemoteUserId(remoteUserId).then((chatListItem)=>{
      chatListItem.unread = chatListItem.unread + 1;
      return this.addChatListItemAsync({...chatListItem,...chatListItemChanges});
    });
  }

  getChatList$() {
    console.log('Getting Chat List from DB...............');
    return this.indexDb.getAll<ChatListItem>(this._chatListStore);
  }

  get chatListModifySubject$() {
    return this._chatListModifySubject.asObservable();
  }

  isUserIdPresentInChatList(userId:string){
    return this.indexDb.getByIndex<ChatListItem>(this._chatListStore,'id',userId);
  }

  markChatItemAsReadAsync(chatListItem:ChatListItem){
    console.log('Marking Chat Item as Read...............',chatListItem.id);
    chatListItem.unread = 0;
    return firstValueFrom(this.indexDb.update(this._chatListStore,chatListItem).pipe(tap(()=>this._chatListModifySubject.next(true))));
  }

  getChatMessages(remoteUserId:string,currentUserId:string){
    const sentByYouId = `${remoteUserId}_${currentUserId}`;
    const sentByMeId = `${currentUserId}_${remoteUserId}`;
    console.log('Getting Chat Messages...............',sentByYouId,sentByMeId);

    const sentByYouKeyRange = IDBKeyRange.bound(sentByYouId,sentByYouId);
    const sentByMeKeyRange = IDBKeyRange.bound(sentByMeId,sentByMeId);

    const sentByYouMessages = this.indexDb.getAllByIndex<MessageDTO>(this._chatsStore,'senderId_receiverId',sentByYouKeyRange).pipe(tap((d)=>console.log("By You ",d)));
    const sentByMeMessages = this.indexDb.getAllByIndex<MessageDTO>(this._chatsStore,'senderId_receiverId',sentByMeKeyRange).pipe(tap((d)=>console.log("By me ",d)));

    return merge(sentByYouMessages,sentByMeMessages).pipe(reduce((a,b)=>a.concat(b)),map((messages)=>messages.sort((a:MessageDTO,b:MessageDTO)=>a.timestamp - b.timestamp)));
  }
}
