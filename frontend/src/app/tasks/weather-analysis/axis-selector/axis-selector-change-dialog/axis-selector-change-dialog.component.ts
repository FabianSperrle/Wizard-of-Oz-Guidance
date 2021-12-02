import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LineChartBrushDialogData } from '../../../../visualizations/line-chart/line-chart-brush-dialog/line-chart-brush-dialog.component';
import { D3BrushEvent } from 'd3';

@Component({
  selector: 'gs-axis-selector-change-dialog',
  templateUrl: './axis-selector-change-dialog.component.html',
  styleUrls: ['./axis-selector-change-dialog.component.scss']
})
export class AxisSelectorChangeDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<AxisSelectorChangeDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AxisSelectorChangeDialogData) { }

  ngOnInit(): void {
    // this.dialogRef.updatePosition({
    //   top: `${this.data.event.sourceEvent.y}px`,
    //   left: `${this.data.event.sourceEvent.x}px`,
    // });
  }

  change(): void {
    this.data.action = 'change';
    this.dialogRef.close(this.data);
  }

  suggestChange(): void {
    this.data.action = 'suggest change';
    this.dialogRef.close(this.data);
  }

}

export interface AxisSelectorChangeDialogData {
  action: 'change' | 'suggest change';
  // event: D3BrushEvent<any>
}
