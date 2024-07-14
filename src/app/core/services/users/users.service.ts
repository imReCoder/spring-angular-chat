import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from '../../models/user';
import { ConfigService } from '../../../shared/config.service';
import { IResponse } from '../../models/response';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private httpClient: HttpClient,
    private config:ConfigService
  ) {
    console.debug('UsersService Initialized...............');
    this.getUser().subscribe({
      next: (user:User) => {
        this.currentUser$.next(user);
      },
      error: (error: any) => {
        console.error(`Error: ${error}`);
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
}
