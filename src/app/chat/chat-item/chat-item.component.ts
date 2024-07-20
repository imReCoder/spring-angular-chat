import { Component, Input } from '@angular/core';
import { ChatListItem } from '../../core/models/chat-list-item';
import { ConfigService } from '../../shared/config.service';
import { UserStatusService } from '../services/user-status.service';

@Component({
  selector: 'app-chat-item',
  templateUrl: './chat-item.component.html',
  styleUrl: './chat-item.component.scss',
})
export class ChatItemComponent {
  @Input() chatItem!: ChatListItem;

  timeFormat: string;
  constructor(
    private configService: ConfigService,
    private userStatusService: UserStatusService
  ) {
    this.timeFormat = configService.chatTimeFormat;
  }

  getUserStatus(userId: string) {
    return this.userStatusService.getUserStatus(userId);
  }
}
