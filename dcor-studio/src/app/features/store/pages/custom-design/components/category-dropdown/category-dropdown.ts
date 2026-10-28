import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../../shared/components/icon/icon';

export interface CategoryDropdownOption {
  id: string;
  name: string;
  slug: string;
  level: number;
  isParent: boolean;
  parentId?: string | null;
}

@Component({
  selector: 'app-category-dropdown',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="custom-dropdown-container" #dropdownRef (keydown)="onContainerKeydown($event)">
      <button
        #triggerBtn
        type="button"
        class="dropdown-trigger-btn"
        [class.is-open]="isOpen()"
        [attr.aria-expanded]="isOpen()"
        aria-haspopup="listbox"
        [attr.aria-controls]="listboxId"
        [attr.aria-label]="'Danh mục: ' + selectedLabel"
        (click)="toggleOpen($event)">
        <span class="dropdown-selected-label" [title]="selectedLabel">
          {{ selectedLabel }}
        </span>
        <app-icon 
          name="ChevronDown" 
          size="14" 
          class="dropdown-chevron-icon" 
          [class.rotated]="isOpen()">
        </app-icon>
      </button>

      <!-- Danh sách Dropdown Listbox -->
      <div
        *ngIf="isOpen()"
        [id]="listboxId"
        role="listbox"
        tabindex="-1"
        class="dropdown-listbox-panel"
        [attr.aria-activedescendant]="activeOptionId">
        <ul class="dropdown-options-list">
          @for (opt of options; track opt.id; let idx = $index) {
            <li
              [id]="listboxId + '-opt-' + opt.id"
              role="option"
              [attr.aria-selected]="opt.id === selectedId"
              class="dropdown-option-item"
              [class.level-0]="opt.level === 0"
              [class.level-1]="opt.level === 1"
              [class.is-parent-header]="opt.isParent"
              [class.is-selected]="opt.id === selectedId"
              [class.is-highlighted]="idx === highlightedIndex()"
              (click)="selectOption(opt)"
              (mouseenter)="highlightedIndex.set(idx)">
              <div class="option-content">
                <span class="option-prefix" *ngIf="opt.level === 1">↳</span>
                <span class="option-name">{{ opt.name }}</span>
                <app-icon *ngIf="opt.id === selectedId" name="Check" size="13" class="check-icon"></app-icon>
              </div>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./category-dropdown.css']
})
export class CategoryDropdownComponent {
  @Input() options: CategoryDropdownOption[] = [];
  @Input() selectedId: string = 'all';
  @Output() categoryChange = new EventEmitter<string>();

  @ViewChild('dropdownRef') dropdownRef?: ElementRef<HTMLDivElement>;
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  isOpen = signal<boolean>(false);
  highlightedIndex = signal<number>(-1);
  readonly listboxId = 'category-listbox-' + Math.random().toString(36).substring(2, 8);

  get selectedLabel(): string {
    const found = this.options.find(o => o.id === this.selectedId);
    return found ? found.name : 'Tất cả danh mục';
  }

  get activeOptionId(): string | null {
    const idx = this.highlightedIndex();
    if (idx >= 0 && idx < this.options.length) {
      return this.listboxId + '-opt-' + this.options[idx].id;
    }
    return null;
  }

  toggleOpen(e?: MouseEvent): void {
    if (e) e.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen.set(true);
    const selIdx = this.options.findIndex(o => o.id === this.selectedId);
    this.highlightedIndex.set(selIdx >= 0 ? selIdx : 0);
  }

  close(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  selectOption(opt: CategoryDropdownOption): void {
    this.selectedId = opt.id;
    this.categoryChange.emit(opt.id);
    this.close();
    this.triggerBtn?.nativeElement.focus();
  }

  onContainerKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHighlight(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (idx >= 0 && idx < this.options.length) {
        this.selectOption(this.options[idx]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerBtn?.nativeElement.focus();
    }
  }

  private navigateHighlight(direction: number): void {
    if (this.options.length === 0) return;
    let next = this.highlightedIndex() + direction;
    if (next < 0) next = this.options.length - 1;
    if (next >= this.options.length) next = 0;
    this.highlightedIndex.set(next);

    setTimeout(() => {
      const activeEl = this.dropdownRef?.nativeElement.querySelector('.dropdown-option-item.is-highlighted') as HTMLElement | null;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }, 10);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (this.isOpen() && this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
