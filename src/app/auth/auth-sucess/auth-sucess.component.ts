import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth-sucess',
  templateUrl: './auth-sucess.component.html',
  styleUrl: './auth-sucess.component.scss'
})
export class AuthSucessComponent {
  constructor(private activeRouter:ActivatedRoute,private authService:AuthService) {
    const token = this.activeRouter.snapshot.queryParams['token'];
    this.authService.authSuccessHandler(token);
  }
}
