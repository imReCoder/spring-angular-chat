// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { Message } from '../../models/message';
// import { HttpClient } from '@angular/common/http';
// import { Contact } from '../../models/contac';
// import { WebsocketsService } from '../websockets/web-sockets.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class MessagesService {

//   constructor(
//     private httpClient: HttpClient,
//     private webSocketService: WebsocketsService
//   ) { }

//   private baseURL: string = 'http://localhost:8080/api/messages'

//   getMessages<T>(chatId: number): Observable<Message[]> {
//     return this.httpClient.get<T>(this.baseURL, {
//       params: { chatId }
//     }) as Observable<Message[]>;
//   }

// }
