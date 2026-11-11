import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IconComponent } from '../../../../../shared/components/icon/icon';
import { StatCard } from '../../../../../shared/components/stat-card/stat-card';
import { Modal } from '../../../../../shared/components/modal/modal';
import { AdminAuthService } from '../../../../../core/services/admin-auth.service';

import {
  BotScript,
  BotActionType,
  QuickReplyOption,
  ScriptTestResult,
} from '../models/chat-admin.model';
import { ChatAdminService } from '../services/chat-admin.service';

@Component({
  selector: 'app-chat-scripts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, StatCard, Modal],
  templateUrl: './chat-scripts.html',
  styleUrls: ['./chat-scripts.css'],
})
export class ChatScriptsComponent implements OnInit {
  public adminAuth = inject(AdminAuthService);
  public chatAdminService = inject(ChatAdminService);

  public hasPermission = computed(() => {
    return this.adminAuth.hasPermission('chat', 'view');
  });

  // Danh sách kịch bản
  public scripts = signal<BotScript[]>([]);
  public isLoadingScripts = signal<boolean>(false);
  public scriptSearch = signal<string>('');

  // Lọc theo từ khóa
  public filteredScripts = computed(() => {
    const q = this.scriptSearch().trim().toLowerCase();
    const list = this.scripts();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.intent.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.patterns.some((p) => p.toLowerCase().includes(q))
    );
  });

  // Chỉ số thẻ KPI
  public activeScriptsCount = computed(() => this.scripts().filter((s) => s.isActive).length);
  public actionScriptsCount = computed(() => this.scripts().filter((s) => s.actionType !== 'NONE').length);
  public highPriorityCount = computed(() => this.scripts().filter((s) => s.priority >= 10).length);

  // Thử nghiệm kịch bản (Live test)
  public testText = signal<string>('');
  public isTestingScript = signal<boolean>(false);
  public testResult = signal<ScriptTestResult | null>(null);

  // Modal Tạo / Sửa
  public isScriptModalOpen = signal<boolean>(false);
  public editingScriptId = signal<string | null>(null);
  public scriptIntent = signal<string>('');
  public scriptName = signal<string>('');
  public scriptPatterns = signal<string[]>([]);
  public patternChipInput = signal<string>('');
  public scriptAnswer = signal<string>('');
  public scriptActionType = signal<BotActionType>('NONE');
  public scriptPriority = signal<number>(0);
  public scriptIsActive = signal<boolean>(true);
  public scriptFormError = signal<string | null>(null);
  public isSavingScript = signal<boolean>(false);

  // Modal Xóa
  public isDeleteScriptModalOpen = signal<boolean>(false);
  public scriptToDelete = signal<BotScript | null>(null);
  public isDeletingScript = signal<boolean>(false);

  ngOnInit(): void {
    this.loadScripts();
  }

  public loadScripts(): void {
    this.isLoadingScripts.set(true);
    this.chatAdminService.getScripts().subscribe({
      next: (res) => {
        this.scripts.set(res.scripts || []);
        this.isLoadingScripts.set(false);
      },
      error: () => {
        this.isLoadingScripts.set(false);
      },
    });
  }

  public runScriptTest(): void {
    const text = this.testText().trim();
    if (!text) return;

    this.isTestingScript.set(true);
    this.chatAdminService.testScript(text).subscribe({
      next: (res) => {
        this.testResult.set(res);
        this.isTestingScript.set(false);
      },
      error: (err) => {
        this.isTestingScript.set(false);
        alert(err?.error?.message || 'Không thể kiểm tra kịch bản.');
      },
    });
  }

  public toggleScriptActive(script: BotScript): void {
    const nextState = !script.isActive;
    this.chatAdminService.updateScript(script.id, { isActive: nextState }).subscribe({
      next: (res) => {
        this.scripts.update((list) =>
          list.map((s) => (s.id === script.id ? { ...s, isActive: res.script.isActive } : s))
        );
      },
      error: (err) => {
        alert(err?.error?.message || 'Không thể cập nhật trạng thái kịch bản.');
      },
    });
  }

  public openCreateScriptModal(): void {
    this.editingScriptId.set(null);
    this.scriptIntent.set('');
    this.scriptName.set('');
    this.scriptPatterns.set([]);
    this.patternChipInput.set('');
    this.scriptAnswer.set('');
    this.scriptActionType.set('NONE');
    this.scriptPriority.set(0);
    this.scriptIsActive.set(true);
    this.scriptFormError.set(null);
    this.isScriptModalOpen.set(true);
  }

  public openEditScriptModal(script: BotScript): void {
    this.editingScriptId.set(script.id);
    this.scriptIntent.set(script.intent);
    this.scriptName.set(script.name);
    this.scriptPatterns.set([...script.patterns]);
    this.patternChipInput.set('');
    this.scriptAnswer.set(script.answer);
    this.scriptActionType.set(script.actionType);
    this.scriptPriority.set(script.priority);
    this.scriptIsActive.set(script.isActive);
    this.scriptFormError.set(null);
    this.isScriptModalOpen.set(true);
  }

  public closeScriptModal(): void {
    this.isScriptModalOpen.set(false);
  }

  public onPatternInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const val = this.patternChipInput().trim().replace(/,/g, '');
      if (val && !this.scriptPatterns().includes(val)) {
        this.scriptPatterns.update((list) => [...list, val]);
      }
      this.patternChipInput.set('');
    }
  }

  public removePatternChip(index: number): void {
    this.scriptPatterns.update((list) => list.filter((_, i) => i !== index));
  }

  public saveScript(): void {
    const intent = this.scriptIntent().trim().toUpperCase();
    const name = this.scriptName().trim();
    const patterns = this.scriptPatterns().filter(Boolean);
    const answer = this.scriptAnswer().trim();

    if (!intent || !name || patterns.length === 0 || !answer) {
      this.scriptFormError.set('Vui lòng điền đầy đủ Mã intent, Tên kịch bản, ít nhất 1 câu mẫu và câu trả lời.');
      return;
    }

    this.isSavingScript.set(true);
    this.scriptFormError.set(null);

    const payload: Partial<BotScript> = {
      intent,
      name,
      patterns,
      answer,
      actionType: this.scriptActionType(),
      priority: Number(this.scriptPriority()) || 0,
      isActive: this.scriptIsActive(),
    };

    const editId = this.editingScriptId();
    if (editId) {
      this.chatAdminService.updateScript(editId, payload).subscribe({
        next: (res) => {
          this.isSavingScript.set(false);
          this.isScriptModalOpen.set(false);
          this.scripts.update((list) =>
            list.map((s) => (s.id === editId ? res.script : s))
          );
        },
        error: (err) => {
          this.isSavingScript.set(false);
          this.scriptFormError.set(err?.error?.message || 'Không thể cập nhật kịch bản.');
        },
      });
    } else {
      this.chatAdminService.createScript(payload).subscribe({
        next: (res) => {
          this.isSavingScript.set(false);
          this.isScriptModalOpen.set(false);
          this.scripts.update((list) => [res.script, ...list]);
        },
        error: (err) => {
          this.isSavingScript.set(false);
          this.scriptFormError.set(err?.error?.message || 'Không thể tạo kịch bản.');
        },
      });
    }
  }

  public openDeleteScriptModal(script: BotScript): void {
    this.scriptToDelete.set(script);
    this.isDeleteScriptModalOpen.set(true);
  }

  public closeDeleteScriptModal(): void {
    this.isDeleteScriptModalOpen.set(false);
    this.scriptToDelete.set(null);
  }

  public confirmDeleteScript(): void {
    const s = this.scriptToDelete();
    if (!s) return;

    this.isDeletingScript.set(true);
    this.chatAdminService.deleteScript(s.id).subscribe({
      next: () => {
        this.isDeletingScript.set(false);
        this.isDeleteScriptModalOpen.set(false);
        this.scripts.update((list) => list.filter((item) => item.id !== s.id));
      },
      error: (err) => {
        this.isDeletingScript.set(false);
        alert(err?.error?.message || 'Không thể xóa kịch bản.');
      },
    });
  }
}

