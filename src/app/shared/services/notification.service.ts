import { Injectable } from '@angular/core';


interface NotificationOptions {
  body?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
    this.requestPermission();
  }

  // request permission for notification from the user
  requestPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications are not available in this environment');
      return;
    }

    Notification.requestPermission((status) => {
      console.log('Notification permission status:', status);
    });
  }

  // display the notification
  showNotification(title: string, options: NotificationOptions) {
    options.icon = 'assets/icons/leaf-solid.png';
    console.debug('Show notification');
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }else{
      console.log('Notification not available');
    }
  }
}
