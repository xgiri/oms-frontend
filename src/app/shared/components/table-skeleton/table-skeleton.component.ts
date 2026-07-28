import { Component, input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
})
export class TableSkeletonComponent {
  readonly columns = input.required<number>();
  readonly rows = input(5);

  readonly rowRange = Array.from({ length: 20 }, (_, i) => i); // generous upper bound, sliced per-instance
}
