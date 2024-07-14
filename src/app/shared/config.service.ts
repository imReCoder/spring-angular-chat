import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  backend: string;
  constructor() {
    this.backend = environment.backend;
  }
}
