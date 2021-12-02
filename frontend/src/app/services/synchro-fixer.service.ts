import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SuggestionContinentWrapper } from '../visualizations/world-map/world-map.component';

@Injectable({
  providedIn: 'root'
})
export class SynchroFixerService {

  public lineChartRemoveHighlight = new Subject();
  public dimpvisRemoveHighlight = new Subject();
  public dimpvisRemoveZoomX = new Subject();
  public dimpvisRemoveZoomY = new Subject();
  public mapRemoveContinentEmitter = new Subject();
  public storeContinentForSynchro = new Subject<SuggestionContinentWrapper>();

  constructor() { }
}
