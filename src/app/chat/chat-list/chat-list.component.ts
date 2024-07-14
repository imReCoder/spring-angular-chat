import { Component } from '@angular/core';
import { UsersService } from '../../core/services/users/users.service';
import { User } from '../../core/models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {

  currentUser$:Observable<User | null>  = this.userService.getCurrentUser();
  constructor(private userService:UsersService) { }

   chats = [
    {
      name:"Ranjit",
      lastMessage:"Hi",
      timestamp:6576576
    }
  ]
}
