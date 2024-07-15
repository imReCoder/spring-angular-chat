import { Injectable } from '@angular/core';
import { CompatClient, IMessage, Message, Stomp } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { TokenService } from '../token/token.service';
import {  MessageDTO } from '../../models/message';
import { MessagesDataSharingService } from '../data-sharing/messages-data/messages-data-sharing.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../../../shared/config.service';

@Injectable({
  providedIn: 'root',
})
export class WebsocketsService {
  private serverUrl;
  private stompClient!: CompatClient;

  private onIncomingMessageSubject = new Subject<MessageDTO>();

  constructor(
    private messagesDataSharingService: MessagesDataSharingService,
    private config:ConfigService,

    private tokenService:TokenService
  ) {
    this.serverUrl = `${this.config.backend}/ws-message`;
  }

  initializeWebSocketConnection() {
    try {
      const token = this.tokenService.getToken();
      const ws = new SockJS(`${this.serverUrl}?access_token=Bearer ${token}`);
      this.stompClient = Stomp.over(ws);
      this.joinChat();
    } catch (error: unknown) {
      throw error;
    }
  }

  joinChat() {
    const userId = this.tokenService.getUsreId();

    const sub =  `/topic/messages/${userId}`;
    console.log(`Subscribing to :${sub}`);
    this.stompClient.connect({
       }, () => {
      this.stompClient.subscribe(
       sub,
        (message: IMessage): void => {
          const decoder = new TextDecoder('utf-8');
          const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
          const parsedMessage:MessageDTO = JSON.parse(jsonBody);

          this.onIncomingMessageSubject.next(parsedMessage);
        }
      );
    }, this.errorCallBack);
  }

  sendMessage(message: MessageDTO) {
    message.senderId = this.tokenService.getUsreId();
    console.debug(`Sending message: ${JSON.stringify(message, null, 2)}`);
    try {
      this.stompClient.send(
        '/app/chat', {}, JSON.stringify(message)
      );
    } catch (error: unknown) {
      throw error;
    }
  }

  errorCallBack(error: any) {
    console.log(error)
  }


  onIncomingMessage$(): Observable<MessageDTO> {
    return this.onIncomingMessageSubject.asObservable();
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
    }
  }
}
