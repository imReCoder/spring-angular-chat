import { Component, EventEmitter, Optional } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { User } from '../../core/models/user';
import { UsersService } from '../../core/services/users/users.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-search-user',
  templateUrl: './search-user.component.html',
  styleUrl: './search-user.component.scss',
})
export class SearchUserComponent {
  searchResultUsers$: Observable<User[]> = of([]);
  searchKey$ = new Subject<string>();
  keyword = '';

  isLoading = false;


  constructor(private userService: UsersService,@Optional() private dialogRef:DynamicDialogRef ) {
    this.searchResultUsers$ = this.searchKey$.pipe(
      debounceTime(500), // wait for 1 second pause in events
      distinctUntilChanged(), // ignore new term if same as previous term
      // tap(() => this.isLoading = true),
      switchMap((key) =>
        this.userService.searchUser(key).pipe(
          map(users=>users.filter(user=>user.id !== this.userService.getCurrentUserId())),
          tap(() => {
            this.isLoading = false;
          })
        )
      ) // switch to new search observable
    );
  }

  onSearchKeyChange() {
    this.isLoading = true;
    this.searchKey$.next(this.keyword);
  }

  selectUser(user:User){
    if(user.id === this.userService.getCurrentUserId()){
      return alert('You cannot chat with yourself');
    }
    this.dialogRef.close(user);
  }
}
