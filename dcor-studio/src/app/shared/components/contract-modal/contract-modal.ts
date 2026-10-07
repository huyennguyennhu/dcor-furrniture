import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contract-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-modal.html',
  styleUrls: ['./contract-modal.css']
})
export class ContractModalComponent {
  @Input() isOpen = false;
  @Input() requestData: any = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() sign = new EventEmitter<void>();

  currentDate = new Date();
  isConsented = false;

  closeModal() {
    this.isOpen = false;
    this.close.emit();
  }

  handleSign() {
    this.sign.emit();
    this.isOpen = false;
  }
}
