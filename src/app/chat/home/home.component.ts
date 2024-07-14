import { Component } from '@angular/core';
import { WebsocketsService } from '../../core/services/websockets/web-sockets.service';
import { UsersService } from '../../core/services/users/users.service';
import { DialogService } from 'primeng/dynamicdialog';
import { SearchUserComponent } from '../search-user/search-user.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private wsService:WebsocketsService,private userService:UsersService,private dialogService:DialogService) {

   }

   newChat(){
      console.log('New Chat');
      this.dialogService.open(SearchUserComponent, {
        width:'60%',

      });
   }
}
