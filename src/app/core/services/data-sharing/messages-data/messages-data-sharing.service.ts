import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MessageDTO } from '../../../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessagesDataSharingService {

  constructor() { }

  handleIncomingMessageSubject: Subject<MessageDTO> = new Subject<MessageDTO>();
  handleIncomingMessageObservable: Observable<MessageDTO> = this.handleIncomingMessageSubject.asObservable();

  emitIncomingMessage(message: MessageDTO) {
    this.handleIncomingMessageSubject.next(message);
  }
}
