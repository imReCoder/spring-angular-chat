import { Injectable } from '@angular/core';
import { TokenService } from '../core/services/token/token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private tokenService:TokenService,private router:Router) {
   }

  authSuccessHandler(token:string){
    if(!token) return this.router.navigate(['/auth/login']);
    this.tokenService.setToken(token);
    return this.router.navigate(['/chat']);
  }
}
