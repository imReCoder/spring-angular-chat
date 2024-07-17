import { Component, Input } from '@angular/core';
import { ChatListItem } from '../../core/models/chat-list-item';
import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-chat-item',
  templateUrl: './chat-item.component.html',
  styleUrl: './chat-item.component.scss'
})
export class ChatItemComponent {
@Input() chatItem!: ChatListItem;
timeFormat : string;
constructor(private configService:ConfigService) {
  this.timeFormat = configService.chatTimeFormat;
}
}
