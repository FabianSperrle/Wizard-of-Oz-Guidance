import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { MatDialogRef } from '@angular/material/dialog';
import { Event, GuidanceInteractionEvent, TrackingEvent } from '../../services/provenance.service';
import { TrackableVisualizationComponent } from '../trackable-visualization.component';
import {
  TimeSliderBrushDialogComponent,
  TimeSliderBrushDialogData
} from './brush-dialog/time-slider-brush-dialog/time-slider-brush-dialog.component';
import { DimpVisSuggestion } from '../suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';

@Component({
  selector: 'gs-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.scss']
})
export class TimesliderComponent extends TrackableVisualizationComponent<number> implements OnInit {

  @Input() minYear: Date;
  @Input() maxYear: Date;
  @ViewChild('slider', {static: false}) public sliderRef: MatSlider;

  userValue: Date;
  valueBeforePreview: Date;

  minMonth = 0;
  currMonth = 0;
  maxMonth = 0;

  @Input() currYear: Date;
  @Output() currYearChange = new EventEmitter<Date>();

  ngOnInit(): void {
    super.ngOnInit();
    this.userValue = this.currYear;

    this.minMonth = this.dateToMonthValueForSlider(this.minYear);
    this.maxMonth = this.dateToMonthValueForSlider(this.maxYear);
    this.currMonth = this.minMonth;
  }

  private dateToMonthValueForSlider(date: Date): number {
    return date.getFullYear() * 12 + date.getMonth();
  }

  getComponent(): string {
    return 'slider';
  }

  getName(): string {
    return 's1';
  }

  updateYear(event: MatSliderChange): void {
    if (event.value) {
      this.currYearChange.emit(this.sliderValueToDate(event.value));
    }
  }

  slideComplete(event: MatSliderChange): void {
    console.log(event);
    const newValue = this.sliderValueToDate(event.value);

    if (this.userRole === 'user') {
      this.provenanceService.log(
        new TrackingEvent(this.getComponent(), this.getName(), 'timeslide', newValue), this.userRole);
    } else if (this.userRole === 'wizard') {
      const dialogRef: MatDialogRef<TimeSliderBrushDialogComponent, TimeSliderBrushDialogData> = this.dialog.open(
        TimeSliderBrushDialogComponent, {
        hasBackdrop: true,
        disableClose: false,
        width: '180px',
        data: {action: undefined, slider: this.sliderRef},
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log(result);
        const slideEvent = new TrackingEvent(this.getComponent(), this.getName(), 'timeslide', newValue);
        switch (result?.action) {
          case 'slide':
            this.provenanceService.log(slideEvent, this.userRole);
            // if (event.value) {
            //   this.currYearChange.emit(event.value);
            // }
            break;
          case 'suggest slide':
            this.provenanceService.log(slideEvent, this.userRole);
            const sugg = new DimpVisSuggestion('Slide', this.getSuggestionDescription(newValue), slideEvent);
            const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
            this.provenanceService.log(guidanceEvent, this.userRole);
            break;
        }
      });
    }
  }

  resetToDefault(): void {
    // nothing to reset
  }

  private sliderValueToDate(val: number): Date {
    const year = Math.floor(val / 12);
    const month = val % 12;

    // https://stackoverflow.com/questions/222309/calculate-last-day-of-month
    return new Date(year, month + 1, 0, 0, 0, 0);
  }

  synchronize(): void {
    this.setCurrYear(this.userValue);
  }


  protected trackingEventManipulator(e: TrackingEvent<Date>): TrackingEvent<Date> {
    e.value = new Date(e.value);
    return e;
  }

  protected saveUserEventForSynchro(event: TrackingEvent<number>): void {
    this.userValue = new Date(event.value);
  }

  processEvent(message: TrackingEvent<number>): void {
    // this.trackingEventManipulator(message);
    // before potentially exiting, save last user event for later synchro
    this.saveUserEventForSynchro(message);

    if (this.userRole === 'wizard') {
      return;
    }

    switch (message.event) {
      case 'timeslide':
        console.log('got timeslide event', message, message.event);
        this.setCurrYear(new Date(message.value));
    }
  }

  guidanceMake(suggestion): void {
  }

  guidancePreviewEnd(suggestion: DimpVisSuggestion<number>): void {
    this.setCurrYear(this.valueBeforePreview);
  }

  guidancePreviewStart(suggestion: DimpVisSuggestion<number>): void {
    console.log('starting preview');
    this.valueBeforePreview = this.currYear;
    this.setCurrYear(new Date(suggestion.event.value));
  }

  setCurrYear(newVal: Date): void {
    console.log('setting new slider date to', newVal);
    this.currYear = newVal;
    this.currYearChange.emit(newVal);
    this.currMonth = this.dateToMonthValueForSlider(this.currYear);
  }

  handleNewSuggestion(event: Event): void {
    const date = this.sliderValueToDate(this.sliderRef.value);
    const slideEvent = new TrackingEvent(this.getComponent(), this.getName(), 'timeslide', date);
    const sugg = new DimpVisSuggestion('Slide', this.getSuggestionDescription(date), slideEvent);
    const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
    this.provenanceService.log(guidanceEvent, this.userRole);
  }

  getSuggestionDescription(date: Date) {
    return `Move to ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
  }
}
