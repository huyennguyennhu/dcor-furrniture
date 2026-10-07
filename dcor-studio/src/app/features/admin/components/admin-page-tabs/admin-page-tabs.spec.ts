import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPageTabs } from './admin-page-tabs';

describe('AdminPageTabs', () => {
  let component: AdminPageTabs;
  let fixture: ComponentFixture<AdminPageTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPageTabs],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPageTabs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
