import { MessageStatus } from './../../core/models/message';
import { Component, Input } from '@angular/core';
import { MessageDTO } from '../../core/models/message';
import { TokenService } from '../../core/services/token/token.service';
import { ConfigService } from '../../shared/config.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.scss',
})
export class ChatBubbleComponent {
  MessageStatus = MessageStatus;
  @Input() message!: MessageDTO;
  @Input() isLast = false;

  userId: string;
  timeFormat:string;
  constructor(
    private tokenService: TokenService,
    public configService: ConfigService
  ) {
    this.timeFormat = configService.chatTimeFormat;
    this.userId = tokenService.getUsreId();
  }
}
