import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {
   chats = [
    {
      name:"Ranjit",
      lastMessage:"Hi",
      timestamp:6576576
    }
  ]
}
