import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  backend: string;
  chatTimeFormat: string;
  constructor() {
    this.backend = environment.backend;
    this.chatTimeFormat = "MMMM dd, YYYY HH:MM"
  }
}
