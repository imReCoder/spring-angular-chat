import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(private router:Router) { }

  private token: string | null = null;

  private validateToken(token: string | null): boolean {
    try{
      if(!token) return false;
      const tokenParts = token.split('.');
      const expiry = JSON.parse(atob(tokenParts[1])).exp;
      const timeLeft = expiry - (Date.now() / 1000);
      // console.log(`Token expires in ${timeLeft} seconds`);
      return new Date(expiry * 1000) > new Date();
    }catch(e){
      return false;
    }
  }

  getTokenData(): any {
    const token = this.getToken();
    const tokenParts = token.split('.');
    return JSON.parse(atob(tokenParts[1]));
  }

  getUsreId():string {
    const tokenData = this.getTokenData();
    return tokenData.sub;
  }
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string  {
    const token = localStorage.getItem('token');
   if(!this.validateToken(token)) this.router.navigate(['/auth']);
    return token as string
  }

  logout() {
    localStorage.removeItem('token');
  }
}
