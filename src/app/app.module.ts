import { NgModule } from '@angular/core';
import { BrowserModule, } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TokenInterceptor } from './core/interceptors/token/token.interceptor';
import { UsersService } from './core/services/users/users.service';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ChatDbService } from './chat/services/chat-db.service';
import { InViewDirective } from './core/directives/in-view.directive';
import { AutoScrollDirective } from './core/directives/auto-scroll.directive';


const dbConfig: DBConfig  = {
  name: 'SpringChatDb',
  version: 1,
  objectStoresMeta: [

  ]
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxIndexedDBModule.forRoot(dbConfig)
  ],
  providers: [
    {
      provide:HTTP_INTERCEPTORS,
      useClass:TokenInterceptor,
      multi:true
    },
    UsersService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
