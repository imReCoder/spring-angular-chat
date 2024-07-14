import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { UsersService } from '../../core/services/users/users.service';
import { User } from '../../core/models/user';
import { Observable, mergeMap, switchMap } from 'rxjs';
import { ChatDbService } from '../services/chat-db.service';
import { ChatListItem } from '../../core/models/chat-list-item';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements AfterViewInit {
  currentUser$: Observable<User | null>;
  chatList$: Observable<ChatListItem[]>;

  constructor(
    private userService: UsersService,
    private chatDb: ChatDbService,
    private _cdr: ChangeDetectorRef,
    private chatService:ChatService
  ) {
    this.currentUser$ = this.userService.getCurrentUser$();
    this.chatList$ = chatDb.chatListModifySubject$.pipe(
      switchMap(() => chatDb.getChatList$())
    );
  }

  ngAfterViewInit() {}

  activateChat(chat: ChatListItem) {
    this.chatService.setActiveChat(chat);
  }
}
