import { Injectable } from '@angular/core';
import { CompatClient, IMessage, Message, Stomp } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { TokenService } from '../token/token.service';
import {  MessageDTO, MessageStatus, MessageUpdateDTO } from '../../models/message';
import { MessagesDataSharingService } from '../data-sharing/messages-data/messages-data-sharing.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../../../shared/config.service';

@Injectable({
  providedIn: 'root',
})
export class WebsocketsService {
  private serverUrl;
  private stompClient!: CompatClient;
  private userId:string;

  private onIncomingMessageSubject = new Subject<MessageDTO>();
  private onIncomingMessageUpdateSubject = new Subject<MessageUpdateDTO>();
  constructor(
    private config:ConfigService,

    private tokenService:TokenService
  ) {
    this.serverUrl = `${this.config.backend}/ws-message`;
    this.userId = this.tokenService.getUsreId();
  }

  initializeWebSocketConnection() {
    try {
      const token = this.tokenService.getToken();
      const ws = new SockJS(`${this.serverUrl}?access_token=Bearer ${token}`);
      this.stompClient = Stomp.over(ws);
      return this.connectSocket();
    } catch (error: unknown) {
      throw error;
    }
  }

  connectSocket() {
   return this.stompClient.connect({
       }, ()=>this.subscribeEndpoints(), this.errorCallBack);
  }

  subscribeEndpoints(){
    // subscribe to the user's messages
    const messageEndpoint =  `/topic/message.receiver/${this.userId}`;
    this.stompClient.subscribe(
      messageEndpoint,
       (message: IMessage): void => {
         const decoder = new TextDecoder('utf-8');
         const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
         const parsedMessage:MessageDTO = JSON.parse(jsonBody);
         console.debug(`Received message: ${JSON.stringify(parsedMessage, null, 2)}`);
         this.onIncomingMessageSubject.next(parsedMessage);
         this.sendMessageUpdateDelivered(parsedMessage);
       }
     );

    //  subscribe to message updates
    const messageUpdateSentEndpoint =  `/topic/message.updates.sent/${this.userId}`;
    this.stompClient.subscribe(
      messageUpdateSentEndpoint,
        (message: IMessage): void => {
          const decoder = new TextDecoder('utf-8');
          const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
          const parsedMessage:MessageUpdateDTO = JSON.parse(jsonBody);
          console.debug(`Received sent message Updates: ${JSON.stringify(parsedMessage, null, 2)}`);
          this.onIncomingMessageUpdateSubject.next(parsedMessage);
        }
      );

       const messageUpdateDeliveredEndpoint =  `/topic/message.updates.delivered/${this.userId}`;
        this.stompClient.subscribe(
          messageUpdateDeliveredEndpoint,
            (message: IMessage): void => {
              const decoder = new TextDecoder('utf-8');
              const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
              const parsedMessage:MessageUpdateDTO = JSON.parse(jsonBody);
              console.debug(`Received delivered message Updates: ${JSON.stringify(parsedMessage, null, 2)}`);
              this.onIncomingMessageUpdateSubject.next(parsedMessage);
            }
          );

          const messageUpdateReadEndpoint =  `/topic/message.updates.read/${this.userId}`;
          this.stompClient.subscribe(
            messageUpdateReadEndpoint,
              (message: IMessage): void => {
                const decoder = new TextDecoder('utf-8');
                const jsonBody = decoder.decode(new Uint8Array(message.binaryBody));
                const parsedMessage:MessageUpdateDTO = JSON.parse(jsonBody);
                console.debug(`Received read message Updates: ${JSON.stringify(parsedMessage, null, 2)}`);
                this.onIncomingMessageUpdateSubject.next(parsedMessage);
              }
            );

  }

  sendMessage(message: MessageDTO) {
    message.senderId = this.tokenService.getUsreId();
    console.debug(`Sending message: ${JSON.stringify(message, null, 2)}`);
    try {
      this.stompClient.send(
        '/app/chat/message.send', {}, JSON.stringify(message)
      );
    } catch (error: unknown) {
      throw error;
    }
  }


  sendMessageUpdateDelivered(message:MessageDTO){
    const messageUpdate:MessageUpdateDTO = {
      status: MessageStatus.DELIVERED,
      messageId: message.messageId as string
    };
    console.debug(`Sending message delivered update: ${JSON.stringify(messageUpdate, null, 2)}`);
    try {
      this.stompClient.send(
        '/app/chat/message.updates.delivered', {}, JSON.stringify(messageUpdate)
      );
    } catch (error: unknown) {
      throw error;
    }

  }


  sendMessageUpdateRead(message:MessageDTO){
    const messageUpdate:MessageUpdateDTO = {
      status: MessageStatus.READ,
      messageId: message.messageId as string
    };
    console.debug(`Sending message update: ${JSON.stringify(messageUpdate, null, 2)}`);
    try {
      this.stompClient.send(
        '/app/chat/message.updates.read', {}, JSON.stringify(messageUpdate)
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

  onIncomingMessageUpdate$(): Observable<MessageUpdateDTO> {
    return this.onIncomingMessageUpdateSubject.asObservable();
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
    }
  }
}
