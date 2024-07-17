import { Injectable, OnDestroy } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class MessageUpdateService implements OnDestroy{

  private subs = new Subscription();
  constructor(private ws:WebsocketsService,private chatService:ChatService) {
    console.log('MessageUpdateService Initialized...............');
    const messageUpdateSub = this.ws.onIncomingMessageUpdate$().pipe(
      switchMap((message) => this.chatService.updateMessageStatus$(message))
    ).subscribe();
    this.subs.add(messageUpdateSub);
   };

   ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.subs.unsubscribe();
   }
}
