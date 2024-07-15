import { Component, Input } from '@angular/core';
import { MessageDTO } from '../../core/models/message';
import { TokenService } from '../../core/services/token/token.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.scss'
})
export class ChatBubbleComponent {
  @Input() message!:MessageDTO;
  @Input() isLast = false;

  userId:string;

  constructor(private tokenService:TokenService) {
    this.userId = tokenService.getUsreId();
  }
}
