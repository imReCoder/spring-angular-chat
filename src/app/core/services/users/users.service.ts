import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from '../../models/user';
import { ConfigService } from '../../../shared/config.service';
import { IResponse } from '../../models/response';
import { TokenService } from '../token/token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private httpClient: HttpClient,
    private config:ConfigService,
    private tokenService:TokenService,
    private router:Router
  ) {
    console.debug('UsersService Initialized...............');
    this.getUser().subscribe({
      next: (user:User) => {
        this.currentUser$.next(user);
      },
      error: (error: any) => {
        console.log(`Error: ${error}`);
        this.tokenService.logout();
        this.router.navigate(['/auth']);
      }
    });
  }


  private baseURL: string = this.config.backend + '/users';

  searchUser(key:string): Observable<User[]> {
    const url = `${this.baseURL}/search`;
    return this.httpClient.get<IResponse<User[]>>(url, {
      params: { searchKey: key }
    }).pipe(map(res=>{
      console.log(res);
      return res.data;
    }));
  }

  getUser(): Observable<User> {
    return this.httpClient.get<IResponse<User>>(`${this.baseURL}/get`).pipe(map(res=>res.data));
  }

  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getUserById(id: string): Observable<User> {
    return this.httpClient.get<IResponse<User>>(`${this.baseURL}/get/${id}`).pipe(map(res=>res.data));
  }

  getCurrentUserId(){
    return this.tokenService.getUsreId();
  }
}
