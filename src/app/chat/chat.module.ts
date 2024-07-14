import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { HomeComponent } from './home/home.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { PrimengModule } from '../primeng/primeng.module';
import { SearchUserComponent } from './search-user/search-user.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    HomeComponent,
    ChatListComponent,
    ChatWindowComponent,
    SearchUserComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    PrimengModule,
    SharedModule
  ]
})
export class ChatModule { }
