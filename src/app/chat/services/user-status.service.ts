import { Injectable } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { ChatListItem } from '../../core/models/chat-list-item';
import { Subscription, tap } from 'rxjs';
import { UsersService } from '../../core/services/users/users.service';

@Injectable({
  providedIn: 'root',
})
export class UserStatusService {
  private initialized = false;
  private readonly userStatuses = new Map<string, string>();
  private readonly userStatusSubscriptions = new Map<string, any>();

  private subs = new Subscription();
  constructor(private ws: WebsocketsService,private userService:UsersService) {}

  initUserStatusChange(chatListItem: ChatListItem[]) {
    if (this.initialized) {
      return;
    }
    chatListItem.forEach((chatItem) => {
      this.subscribeUserStatus(chatItem.id);
    });

    const sub = this.userStatusChange$()
      .pipe(
        tap((status) => {
          this.userStatuses.set(status.userId, status.status);
        })
      )
      .subscribe();
    this.subs.add(sub);
    this.initialized = true;
  }

  userStatusChange$() {
    return this.ws.getUserStatus$().pipe(
      tap((status) => {
        console.log('status', status);
        this.userStatuses.set(status.userId, status.status);
      })
    );
  }

  subscribeUserStatus(userId: string) {
    if (this.userStatusSubscriptions.has(userId)) {
      return console.log('Already subscribed');
    }
    const sub = this.ws.subcribeUserStatus(userId);
    this.userStatusSubscriptions.set(userId, sub);
  }

  unSubscribeUserStatus(userId: string) {
    if (this.userStatusSubscriptions.has(userId)) {
      this.userStatusSubscriptions.get(userId).unsubscribe();
      this.userStatusSubscriptions.delete(userId);
    }
  }

  getUserStatus(userId: string) {
    return Boolean(this.userStatuses.get(userId));
  }

  getInitialUserStatus(chatListItems: ChatListItem[]) {
    const ids = chatListItems.map((u) => u.id);
    return this.userService.getUsersStatus(ids).pipe(
      tap((status) => {
        console.log('status res', status);
        status.forEach((s) => {
          this.userStatuses.set(s.userId, s.status);
          console.debug(`User ${s.userId} is ${s.status}`);
        });
      })
    );
  }
}
