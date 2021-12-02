import { Component, Inject, OnInit } from '@angular/core';
import { D3BrushEvent } from 'd3';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'gs-line-chart-brush-dialog',
  templateUrl: './line-chart-brush-dialog.component.html',
  styleUrls: ['./line-chart-brush-dialog.component.scss']
})
export class LineChartBrushDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<LineChartBrushDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: LineChartBrushDialogData) { }

  ngOnInit(): void {
    this.dialogRef.updatePosition({
      top: `${this.data.event.sourceEvent.y}px`,
      left: `${this.data.event.sourceEvent.x}px`,
    });
  }

  brush(): void {
    this.data.action = 'brush';
    this.dialogRef.close(this.data);
  }

  suggestBrush(): void {
    this.data.action = 'suggest brush';
    this.dialogRef.close(this.data);
  }

}

export interface LineChartBrushDialogData {
  action: 'brush' | 'suggest brush';
  event: D3BrushEvent<any>;
}
