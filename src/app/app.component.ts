import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  windowHeight: string = `${window.innerHeight}px`;
  windowWidth: string = `${window.innerWidth}px`;

  ngOnInit() {
    this.onResize(null);
  }

  // hostlistner for dynamic height of the body
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowHeight = `${window.innerHeight - 4}px`;
    this.windowWidth = `${window.innerWidth - 4}px`;
  }
}
