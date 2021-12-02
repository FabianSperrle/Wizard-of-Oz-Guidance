import { Component, HostListener, Input, OnInit } from '@angular/core';
import { GapminderService, GenericScatterData } from '../../services/data/gapminder.service';
import { UserRoleService } from '../../services/study/user-role.service';
import { extent } from 'd3';
import { Measurement, WeatherdataService } from '../../services/data/weatherdata.service';
import { MatSelectChange } from '@angular/material/select';
import { defaultContinents, SuggestionContinentWrapper } from '../../visualizations/world-map/world-map.component';
import { ListScroll, ScrollableListNames, ScrollSynchronizerService } from '../../services/scroll-synchronizer.service';
import { ChannelService } from '../../services/channel/channel.service';
import { StudyConditionService } from '../../services/study-condition.service';

@Component({
  selector: 'gs-weather-analysis',
  templateUrl: './weather-analysis.component.html',
  styleUrls: ['./weather-analysis.component.scss']
})
export class WeatherAnalysisComponent implements OnInit {

  constructor(private dataService: WeatherdataService,
              public userRoleService: UserRoleService,
              public studyCondtionService: StudyConditionService,
              public channelService: ChannelService,
              public scrollSynchronizerService: ScrollSynchronizerService) { }

  data: Measurement[];
  date: Date;
  minDate: Date;
  maxDate: Date;
  @Input() isOverlay = false;

  dimensions: MeasurementDimension[] = ['humidity' , 'pressure' , 'avg_temp' , 'min_temp' , 'max_temp' , 'wind_direction' , 'wind_speed' , 'rainy_days' , 'foggy_days' , 'snowy_days' , 'stormy_days' , 'cloudy_days'];
  colorDimensions: MeasurementColorDimension[] = ['humidity' , 'pressure' , 'avg_temp' , 'min_temp' , 'max_temp' , 'wind_direction' , 'wind_speed' , 'rainy_days' , 'foggy_days' , 'snowy_days' , 'stormy_days' , 'cloudy_days', 'continent'];

  xAxisDimension: MeasurementDimension = 'avg_temp';
  yAxisDimension: MeasurementDimension = 'wind_speed';
  colorDimension: MeasurementColorDimension = 'pressure';
  yAxisDimensionLineChart: MeasurementDimension = 'avg_temp';

  selectedContinents: SuggestionContinentWrapper = { continents: new Set(defaultContinents), action: 'update continents'};
  selectedContinentsPreview: SuggestionContinentWrapper = {continents: new Set(defaultContinents), action: 'update continents'};
  selectedStations: Set<string>;

  highlightedIDs: Set<string> = new Set<string>();

  // @HostListener('window:scroll', ['$event'])
  // onScroll(event) {
  //   console.log('you scrolled the window!', event, window.document.body.scrollTop);
  //   this.scrollSynchronizerService.scroll$.next(new ListScroll(window.scrollY, 'window'));
  // }

  ngOnInit(): void {
    this.dataService.getAllMeasurements().subscribe(data => {
      this.data = data;

      this.selectedStations = new Set(data.map(m => m.station));

      const [minYear, maxYear] = extent(this.data, d => d.date);

      console.log(minYear, maxYear);

      this.date = minYear;
      this.minDate = minYear;
      this.maxDate = maxYear;
    });

    if (this.isOverlay === undefined) {
      this.isOverlay = false;
    }
  }
}


export type MeasurementDimension = 'humidity' | 'pressure' | 'avg_temp' | 'min_temp' | 'max_temp' | 'wind_direction' | 'wind_speed' | 'rainy_days' | 'foggy_days' | 'snowy_days' | 'stormy_days' | 'cloudy_days'
export type MeasurementColorDimension = MeasurementDimension | 'continent';
