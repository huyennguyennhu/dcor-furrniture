import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrls: ['./modal.css']
})
export class Modal implements OnChanges, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() width: string = '500px';
  @Input() hasFooter: boolean = false;
  
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'unset';
  }

  onClose(): void {
    this.close.emit();
  }
}
