import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KhamPha } from './kham-pha';

describe('KhamPha', () => {
  let component: KhamPha;
  let fixture: ComponentFixture<KhamPha>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KhamPha],
    }).compileComponents();

    fixture = TestBed.createComponent(KhamPha);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
