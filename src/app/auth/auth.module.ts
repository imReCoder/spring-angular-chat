import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { PrimengModule } from '../primeng/primeng.module';
import { AuthSucessComponent } from './auth-sucess/auth-sucess.component';
import { AuthService } from './auth.service';


@NgModule({
  declarations: [
    LoginComponent,
    AuthSucessComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    PrimengModule
  ],
  providers: [AuthService]
})
export class AuthModule { }
