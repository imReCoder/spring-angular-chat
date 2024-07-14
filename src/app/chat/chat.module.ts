import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { HomeComponent } from './home/home.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { PrimengModule } from '../primeng/primeng.module';
import { SearchUserComponent } from './search-user/search-user.component';
import { SharedModule } from '../shared/shared.module';
import { ChatDbService } from './services/chat-db.service';
import { ChatItemComponent } from './chat-item/chat-item.component';
import { UserAvatarComponent } from './user-avatar/user-avatar.component';
import { ChatService } from './services/chat.service';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';


@NgModule({
  declarations: [
    HomeComponent,
    ChatListComponent,
    ChatWindowComponent,
    SearchUserComponent,
    ChatItemComponent,
    UserAvatarComponent,
    ChatBubbleComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    PrimengModule,
    SharedModule
  ],
  providers: [
    ChatDbService,
    ChatService
  ]
})
export class ChatModule { }
