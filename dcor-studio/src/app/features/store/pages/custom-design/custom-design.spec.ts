import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThietKe } from './thiet-ke';

describe('ThietKe', () => {
  let component: ThietKe;
  let fixture: ComponentFixture<ThietKe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThietKe],
    }).compileComponents();

    fixture = TestBed.createComponent(ThietKe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
