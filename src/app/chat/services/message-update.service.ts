import { Injectable, OnDestroy } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { ChatService } from './chat.service';
import { MessageStatus, MessageUpdateDTO } from '../../core/models/message';

@Injectable({
  providedIn: 'root',
})
export class MessageUpdateService implements OnDestroy {
  private subs = new Subscription();
  constructor(private ws: WebsocketsService, private chatService: ChatService) {
    console.log('MessageUpdateService Initialized...............');
    const messageUpdateSub = this.ws
      .onIncomingMessageUpdate$()
      .pipe(switchMap((message) => this._handleIncomingMessageUpdate(message)))
      .subscribe();

    this.subs.add(messageUpdateSub);
  }

  private _handleIncomingMessageUpdate(messageUpdate: MessageUpdateDTO) {
    if (messageUpdate.status === MessageStatus.SENT) {
      // when we get update for sent , at that point only we are receiving messageId, so we need to update all previous messages with  messageClientId
      // no need to update the previous messages as we will get event for each message, and message will be sent only if user is online and connected to the socket
      return this.chatService.updateMessageStatusByClientId$(messageUpdate);
    } else {
      // we will get the delivered or read update for last message only, so we need to update all previous messages with messageId
      return this.chatService.updateAllPreviousMessagesByMessageId$(
        messageUpdate
      );
    }
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.subs.unsubscribe();
  }
}
