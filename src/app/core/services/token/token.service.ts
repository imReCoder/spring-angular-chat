import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  private token: string | null = null;

  private validateToken(token: string | null): boolean {
    try{
      if(!token) return false;
      const tokenParts = token.split('.');
      const expiry = JSON.parse(atob(tokenParts[1])).exp;
      const timeLeft = expiry - (Date.now() / 1000);
      console.log(`Token expires in ${timeLeft} seconds`);
      return new Date(expiry * 1000) > new Date();
    }catch(e){
      return false;
    }
  }

  getTokenData(): any {
    const token = this.getToken();
    if(!token) return null;
    const tokenParts = token.split('.');
    return JSON.parse(atob(tokenParts[1]));
  }

  getUsreId(){
    const tokenData = this.getTokenData();
    if(!tokenData) return null;
    return tokenData.sub;
  }
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if(!this.validateToken(token)) return null;
    return token
  }

  logout() {
    localStorage.removeItem('token');
  }
}
