import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { RoomPlannerService } from './services/room-planner.service';
import { DESIGN_REPOSITORY, LocalStorageDesignRepository } from './services/design-repository.interface';
import { SetupStepComponent } from './components/setup-step/setup-step';
import { PlannerCanvasComponent } from './components/planner-canvas/planner-canvas';
import { ProductPanelComponent } from './components/product-panel/product-panel';
import { SummaryPanelComponent } from './components/summary-panel/summary-panel';

@Component({
  selector: 'app-custom-design',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    SetupStepComponent,
    PlannerCanvasComponent,
    ProductPanelComponent,
    SummaryPanelComponent
  ],
  providers: [
    RoomPlannerService,
    { provide: DESIGN_REPOSITORY, useClass: LocalStorageDesignRepository }
  ],
  templateUrl: './custom-design.html',
  styleUrls: ['./custom-design.css']
})
export class CustomDesignComponent {
  // Trạng thái drawer trên thiết bị di động / máy tính bảng (<1024px)
  mobileDrawer = signal<'none' | 'products' | 'summary'>('none');

  constructor(
    public plannerService: RoomPlannerService,
    private cdr: ChangeDetectorRef
  ) {}

  toggleMobileDrawer(drawer: 'products' | 'summary'): void {
    if (this.mobileDrawer() === drawer) {
      this.mobileDrawer.set('none');
    } else {
      this.mobileDrawer.set(drawer);
    }
  }

  closeMobileDrawer(): void {
    this.mobileDrawer.set('none');
  }
}
