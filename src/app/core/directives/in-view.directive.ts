
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

@Directive({
  selector: '[inView]'
})
export class InViewDirective implements OnInit, OnDestroy {
  @Output() inView: EventEmitter<boolean> = new EventEmitter();

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createObserver();
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }

  private createObserver() {
    const options = {
      root: null,
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.inView.emit(true);
        } else {
          this.inView.emit(false);
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }
}
