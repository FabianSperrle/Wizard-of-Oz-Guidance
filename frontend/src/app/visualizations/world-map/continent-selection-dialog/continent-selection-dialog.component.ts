import { Component, Inject, OnInit } from '@angular/core';
import { TrackingEvent } from '../../../services/provenance.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'gs-continent-selection-dialog',
  templateUrl: './continent-selection-dialog.component.html',
  styleUrls: ['./continent-selection-dialog.component.scss']
})
export class ContinentSelectionDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<ContinentSelectionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) private data: ContinentSelectionDialogData) { }

  ngOnInit(): void {
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

export interface ContinentSelectionDialogData {
  action?: 'change' | 'suggest change';
}
