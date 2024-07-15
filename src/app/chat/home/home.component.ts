import { Component } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { UsersService } from '../../core/services/users/users.service';
import { DialogService } from 'primeng/dynamicdialog';
import { SearchUserComponent } from '../search-user/search-user.component';
import { ChatDbService } from '../services/chat-db.service';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(
    private userService: UsersService,
    private dialogService: DialogService,
    private chatDbService: ChatDbService,
    private chatService:ChatService
  ) {
      // this.chatService.sendMessage({
      //     senderId: '102',
      //     receiverId: '123',
      //     content: 'Hello',
      //     timestamp: Date.now(),
      // })
  }

  newChatDialog() {
    console.log('New Chat');
    this.dialogService
      .open(SearchUserComponent, {
        width: '60%',
        height: '80%',
      })
      .onClose.subscribe((user) => {
        console.log('Selected User:', user);
        this.chatDbService.addChatListItemAsync({
          id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          lastMessage: '',
          lastMessageTimestamp: Date.now(),
          unread: 0,
        });
      });
  }
}
