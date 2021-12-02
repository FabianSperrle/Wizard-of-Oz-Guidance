import { Component, Input, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MeasurementDimension } from '../../../tasks/weather-analysis/weather-analysis.component';
import { MeasurementDimensionUnitMap } from '../../../services/data/weatherdata.service';

@Component({
  selector: 'gs-station-tooltip',
  template: `
    <div>
      <p> <span>Station:</span> {{ data.station.name }}</p>
      <p><span>Continent:</span> {{ data.station.continent }}</p>
      <p><span>{{ data.xDim }}:</span> {{ data.xVal }}{{xLabel}}</p>
      <p><span>{{ data.yDim }}:</span> {{ data.yVal | number }}{{yLabel}}</p>
    </div>
  `,
  styles: [
    `div {
      background: white;
      border: 1px solid grey;
      padding: 8px;
      border-radius: 4px;
    }
    span {
      min-width: 65px;
      display: inline-block;
    }
    p {
      margin-bottom: 3px
    }
    :host {
      display: block;
    }
    `
  ]
})
export class StationTooltipComponent implements OnInit {

  @Input() data: DimpvisTooltipData;
  xLabel: string;
  yLabel: string;

  constructor(private numberPipe: DecimalPipe) { }

  ngOnInit(): void {
    if (typeof this.data.xVal === 'number') {
      this.data.xVal = this.numberPipe.transform(this.data.xVal);
      this.xLabel = MeasurementDimensionUnitMap.get(this.data.xDim as MeasurementDimension);
    }
    this.yLabel = MeasurementDimensionUnitMap.get(this.data.yDim);
    console.log(MeasurementDimensionUnitMap, this.data.xDim, this.data.yDim);
    console.log(this.xLabel, this.yLabel);
  }

}


export interface DimpvisTooltipData {
  station: {
    name: string,
    continent: string
  };
  xDim: MeasurementDimension | 'Date';
  xVal: number | string;
  yDim: MeasurementDimension;
  yVal: number;
}
