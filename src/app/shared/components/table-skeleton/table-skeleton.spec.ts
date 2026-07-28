import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSkeleton } from './table-skeleton';

describe('TableSkeleton', () => {
  let component: TableSkeleton;
  let fixture: ComponentFixture<TableSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
