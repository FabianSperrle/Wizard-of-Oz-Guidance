import { Component } from '@angular/core';
import { MeasurementDimension } from '../weather-analysis.component';
import { GenericAxisSelectorComponent } from '../generic-axis-selector/generic-axis-selector.component';

@Component({
  selector: 'gs-axis-selector',
  templateUrl: './axis-selector.component.html',
  styleUrls: ['./axis-selector.component.scss']
})
export class AxisSelectorComponent extends GenericAxisSelectorComponent<MeasurementDimension> {

}
