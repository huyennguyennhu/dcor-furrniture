import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  forwardRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, ChevronDown, ChevronRight, Search, Check } from 'lucide-angular';

export interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  image?: string;
  children?: DropdownOption[];
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './custom-dropdown.html',
  styleUrls: ['./custom-dropdown.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDropdownComponent),
      multi: true
    }
  ]
})
export class CustomDropdownComponent implements ControlValueAccessor, OnInit, OnDestroy {
  readonly icons = { ChevronDown, ChevronRight, Search, Check };

  @Input() options: Array<string | DropdownOption> = [];
  @Input() placeholder = '-- Chọn --';
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Tìm kiếm...';
  @Input() emptyText = 'Không tìm thấy lựa chọn phù hợp';
  @Input() pageSize = 20;
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() active = false;
  @Input() compact = false;

  @Output() selectionChange = new EventEmitter<any>();

  value: any = '';
  isOpen = false;
  dropUp = false;
  searchQuery = '';
  displayLimit = 20;
  expandedParents = new Set<any>();

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  get normalizedOptions(): DropdownOption[] {
    return (this.options || []).map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }

  get filteredOptions(): DropdownOption[] {
    const list = this.normalizedOptions;
    if (!this.searchable) return list;
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return list;
    const result: DropdownOption[] = [];
    for (const o of list) {
      const parentMatch = (o.label || '').toLowerCase().includes(q);
      if (o.children && o.children.length > 0) {
        const matchingChildren = o.children.filter(c => (c.label || '').toLowerCase().includes(q));
        if (parentMatch || matchingChildren.length > 0) {
          result.push({
            ...o,
            children: parentMatch ? o.children : matchingChildren
          });
        }
      } else if (parentMatch) {
        result.push(o);
      }
    }
    return result;
  }

  get visibleOptions(): DropdownOption[] {
    const list = this.filteredOptions;
    if (!this.searchable && list.length <= this.pageSize) {
      return list;
    }
    return list.slice(0, this.displayLimit);
  }

  get selectedLabel(): string {
    for (const o of this.normalizedOptions) {
      if (o.value === this.value) return o.label;
      if (o.children) {
        const child = o.children.find(c => c.value === this.value);
        if (child) return `${o.label} > ${child.label}`;
      }
    }
    return '';
  }

  isParentExpanded(opt: DropdownOption): boolean {
    if (this.searchable && (this.searchQuery || '').trim()) {
      return !!(opt.children && opt.children.length > 0);
    }
    return this.expandedParents.has(opt.value);
  }

  toggleExpand(opt: DropdownOption, event: Event): void {
    event.stopPropagation();
    if (this.expandedParents.has(opt.value)) {
      this.expandedParents.delete(opt.value);
    } else {
      this.expandedParents.add(opt.value);
    }
    this.cdr.markForCheck();
  }

  toggle(event: Event, triggerEl: HTMLElement): void {
    event.stopPropagation();
    if (this.disabled) return;

    if (this.isOpen) {
      this.isOpen = false;
      this.onTouched();
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = this.searchable ? 275 : Math.min(230, this.normalizedOptions.length * 38 + 16);
    this.dropUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    this.searchQuery = '';
    this.displayLimit = this.pageSize;
    this.isOpen = true;
    this.cdr.markForCheck();
  }

  selectOption(opt: DropdownOption, event: Event): void {
    event.stopPropagation();
    if (opt.disabled) return;
    this.value = opt.value;
    this.isOpen = false;
    this.onChange(this.value);
    this.onTouched();
    this.selectionChange.emit(this.value);
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.displayLimit = this.pageSize;
  }

  onListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      if (this.displayLimit < this.filteredOptions.length) {
        this.displayLimit += this.pageSize;
      }
    }
  }

  loadMore(event: Event): void {
    event.stopPropagation();
    this.displayLimit += this.pageSize;
  }

  private handleDocumentClickCapture = (event: Event): void => {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
      this.onTouched();
      this.cdr.markForCheck();
    }
  };

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.handleDocumentClickCapture, true);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.handleDocumentClickCapture, true);
    }
  }

  writeValue(obj: any): void {
    this.value = obj ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}
