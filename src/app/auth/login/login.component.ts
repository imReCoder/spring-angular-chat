import { Component } from '@angular/core';
import { ConfigService } from '../../shared/config.service';
import { Router } from '@angular/router';
import { TokenService } from '../../core/services/token/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(
    private configService: ConfigService,
    private router: Router,
    private tokenService: TokenService
  ) {
    if (tokenService.getToken()) this.router.navigate(['/chat']);
  }

  loginWithGoogle() {
    const redirectUrl = `${this.configService.backend}/auth/google`;
    window.location.href = redirectUrl;
  }
}
