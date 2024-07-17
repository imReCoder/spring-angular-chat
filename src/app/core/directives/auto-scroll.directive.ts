import { AfterViewChecked, AfterViewInit, Directive, ElementRef, HostListener, Input, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appAutoScroll]'
})
export class AutoScrollDirective  {
  @Input() set messages(_: any[]) {
    console.debug('Auto scroll enabled:', this.autoScrollEnabled);
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }
  private autoScrollEnabled = true;

  constructor(private el: ElementRef) {
  }

  ngAfterViewChecked() {
    // Additional checks can be added here if needed
    // this.scrollToBottom()

  }

  @HostListener('scroll')
  onScroll() {
    const { scrollTop, scrollHeight, clientHeight } = this.el.nativeElement;
    this.autoScrollEnabled = scrollHeight - clientHeight <= scrollTop + 10;
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
      this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight;
      },0)
    } catch (err) { }
  }
}
