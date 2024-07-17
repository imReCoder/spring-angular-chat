import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AutoScrollDirective } from '../core/directives/auto-scroll.directive';
import { InViewDirective } from '../core/directives/in-view.directive';
import { AudioService } from './services/audio.service';

const commonImports = [];

@NgModule({
  declarations: [NotfoundComponent,AutoScrollDirective,InViewDirective],
  imports: [CommonModule, RouterModule, FormsModule],
  providers: [AudioService],
  exports: [NotfoundComponent, FormsModule, AutoScrollDirective, InViewDirective],
})
export class SharedModule {}
