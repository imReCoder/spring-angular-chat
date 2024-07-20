import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
@Input() profileImage!:string;
@Input() name!:string;
@Input() isOnline = false;

ngOnChanges(changes: SimpleChanges): void {
  //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
  //Add '${implements OnChanges}' to the class.
  if(changes['isOnline']) {
    this.isOnline = changes['isOnline'].currentValue;
  }
}
}
