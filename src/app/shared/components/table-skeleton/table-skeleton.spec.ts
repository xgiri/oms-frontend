import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSkeletonComponent } from './table-skeleton.component';

describe('TableSkeletonComponent', () => {
  let component: TableSkeletonComponent;
  let fixture: ComponentFixture<TableSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSkeletonComponent);
    fixture.componentRef.setInput('columns', 4);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
