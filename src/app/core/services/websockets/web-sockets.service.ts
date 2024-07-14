import { Injectable } from '@angular/core';
import { CompatClient, IMessage, Stomp } from '@stomp/stompjs';
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
    const tokenData = this.tokenService.getTokenData();
    console.log(tokenData);
    const userEmail = tokenData.sub;
    this.stompClient.connect({
       }, () => {
      this.stompClient.subscribe(
        `/user/${userEmail}/queue/messages`,
        (message: IMessage): void => {
          const decoder = new TextDecoder('utf-8');
          const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
          const parsedMessage = JSON.parse(jsonBody);
          console.log(parsedMessage);
          this.messagesDataSharingService.emitIncomingMessage(parsedMessage);
        }
      );
    }, this.errorCallBack);
  }

  sendMessage(message: MessageDTO) {
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

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
    }
  }
}
