import { Injectable } from '@angular/core';
import { ConfigService } from '../../shared/config.service';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { MessageDTO, MessageUpdateDTO } from '../../core/models/message';
import { IResponse } from '../../core/models/response';

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  baseUrl:string;
  constructor(private configService:ConfigService,private http:HttpClient) {
    this.baseUrl = `${this.configService.backend}/messages`;
   }

   getNewMessages(){
    return this.http.get<IResponse<MessageDTO[]>>(`${this.baseUrl}/undelivered`).pipe(map((res)=>res.data));
   }

   getMessagesLatestStatus$(messageIds:string[]){
      return this.http.post<IResponse<MessageUpdateDTO[]>>(`${this.baseUrl}/latest-status`,{messageIds}).pipe(map((res)=>res.data));
   }
}