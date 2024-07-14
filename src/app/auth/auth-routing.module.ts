import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthSucessComponent } from './auth-sucess/auth-sucess.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path:'google',
    component:AuthSucessComponent
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
