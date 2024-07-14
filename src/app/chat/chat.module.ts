import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { HomeComponent } from './home/home.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { PrimengModule } from '../primeng/primeng.module';


@NgModule({
  declarations: [
    HomeComponent,
    ChatListComponent,
    ChatWindowComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    PrimengModule
  ]
})
export class ChatModule { }
