import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { D3BrushEvent } from 'd3';
import { MatSlider } from '@angular/material/slider';

@Component({
  selector: 'gs-time-slider-brush-dialog',
  templateUrl: './time-slider-brush-dialog.component.html',
  styleUrls: ['./time-slider-brush-dialog.component.scss']
})
export class TimeSliderBrushDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<TimeSliderBrushDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: TimeSliderBrushDialogData) { }

  ngOnInit(): void {
    const matDialogConfig = new MatDialogConfig();
    console.log(this.data, matDialogConfig);
    const position = this.data.slider._elementRef.nativeElement.getBoundingClientRect();
    matDialogConfig.position = {
      top: `${position.top + 40}px`,
      left: `${position.left + 30}px`,
    };
    this.dialogRef.updatePosition(matDialogConfig.position);
  }

  slide(): void {
    this.data.action = 'slide';
    this.dialogRef.close(this.data);
  }

  suggestSlide(): void {
    this.data.action = 'suggest slide';
    this.dialogRef.close(this.data);
  }
}

export interface TimeSliderBrushDialogData {
  action?: 'slide' | 'suggest slide';
  slider: MatSlider;
}
