import { Component } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { UsersService } from '../../core/services/users/users.service';
import { DialogService } from 'primeng/dynamicdialog';
import { SearchUserComponent } from '../search-user/search-user.component';
import { ChatDbService } from '../services/chat-db.service';
import { ChatService } from '../services/chat.service';
import { Subscription, map, switchMap, tap } from 'rxjs';
import { ChatListItem } from '../../core/models/chat-list-item';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {

  private subs = new Subscription();
  constructor(
    private userService: UsersService,
    private dialogService: DialogService,
    private chatDbService: ChatDbService,
    private chatService: ChatService
  ) {}

  newChatDialog() {
    this.dialogService
      .open(SearchUserComponent, {
        width: '60%',
        height: '80%',
      })
      .onClose.subscribe((user) => {
       const chatListItemSub =  this.chatDbService
          .addChatListItem({
            ...user,
            lastMessage: '',
            lastMessageTimestamp: Date.now(),
            unread: 0,
          })
          .pipe(
            tap((activeChat) => {
              this.chatService.setActiveChat(activeChat);
            })
          ).subscribe();
          this.subs.add(chatListItemSub);
      });
  }

  ngOnDestroy(): void {
      this.subs.unsubscribe();
  }
}
