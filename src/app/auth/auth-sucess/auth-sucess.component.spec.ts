import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthSucessComponent } from './auth-sucess.component';

describe('AuthSucessComponent', () => {
  let component: AuthSucessComponent;
  let fixture: ComponentFixture<AuthSucessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthSucessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthSucessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
