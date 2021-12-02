import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { D3BrushEvent } from 'd3';
import { BrushDialogData } from '../brush-dialog/brush-dialog.component';

@Component({
  selector: 'gs-user-dimpvis-brush-dialog',
  templateUrl: './user-dimpvis-brush-dialog.component.html',
  styleUrls: ['./user-dimpvis-brush-dialog.component.scss']
})
export class UserDimpvisBrushDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<UserDimpvisBrushDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: BrushDialogData) { }

  ngOnInit(): void {
    console.log(this.data.event);
    this.dialogRef.updatePosition({
      top: `${this.data.event.sourceEvent.y}px`,
      left: `${this.data.event.sourceEvent.x}px`,
    });
  }

  zoom(): void {
    this.data.action = 'zoom';
    this.dialogRef.close(this.data);
  }

  highlight(): void {
    this.data.action = 'highlight';
    this.dialogRef.close(this.data);
  }
}
