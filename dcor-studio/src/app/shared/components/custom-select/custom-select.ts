import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-select.html',
  styleUrls: ['./custom-select.css']
})
export class CustomSelect implements OnInit {
  @Input() options: Option[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = 'Chọn...';
  @Input() searchable: boolean = false;
  @Input() disabled: boolean = false;
  @Input() dropUp: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  isOpen: boolean = false;
  searchQuery: string = '';
  filteredOptions: Option[] = [];
  selectedOption: Option | undefined;

  constructor(private eRef: ElementRef) {}

  ngOnInit() {
    this.updateSelectedOption();
    this.filterOptions();
  }

  ngOnChanges() {
    this.updateSelectedOption();
    this.filterOptions();
  }

  updateSelectedOption() {
    this.selectedOption = this.options.find(o => o.value === this.value);
  }

  toggleOpen(event: MouseEvent) {
    event.preventDefault();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (!this.isOpen) {
        this.searchQuery = '';
        this.filterOptions();
      }
    }
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.filterOptions();
  }

  filterOptions() {
    if (!this.searchable || !this.searchQuery) {
      this.filteredOptions = this.options;
    } else {
      const lowerQuery = this.searchQuery.toLowerCase();
      this.filteredOptions = this.options.filter(opt => opt.label.toLowerCase().includes(lowerQuery));
    }
  }

  selectOption(optValue: string) {
    this.value = optValue;
    this.valueChange.emit(this.value);
    this.isOpen = false;
    this.searchQuery = '';
    this.updateSelectedOption();
    this.filterOptions();
  }

  @HostListener('document:mousedown', ['$event'])
  clickout(event: Event) {
    if (this.isOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchQuery = '';
      this.filterOptions();
    }
  }
}
