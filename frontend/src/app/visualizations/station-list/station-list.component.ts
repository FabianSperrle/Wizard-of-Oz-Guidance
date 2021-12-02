import {
  AfterViewInit,
  Component, ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Pipe,
  PipeTransform, ViewChild
} from '@angular/core';
import { TrackableVisualizationComponent } from '../trackable-visualization.component';
import {
  Event,
  GuidanceInteractionEvent,
  GuidanceLinkingEvent,
  ProvenanceService,
  TrackingEvent
} from '../../services/provenance.service';
import { Measurement } from '../../services/data/weatherdata.service';
import { UserRoleService } from '../../services/study/user-role.service';
import { OverlaySynchroService } from '../../services/overlay-synchro.service';
import { MatDialog } from '@angular/material/dialog';
import { ChannelService } from '../../services/channel/channel.service';
import { SuggestionLinkServiceService } from '../../services/suggestion-link-service.service';
import { CandidateListService } from '../../services/candidate-list.service';
import { ListScroll, ScrollableListNames, ScrollSynchronizerService } from '../../services/scroll-synchronizer.service';
import { SynchroFixerService } from '../../services/synchro-fixer.service';
import { SuggestionContinentWrapper } from '../world-map/world-map.component';

@Component({
  selector: 'gs-station-list',
  templateUrl: './station-list.component.html',
  styleUrls: ['./station-list.component.scss']
})
export class StationListComponent extends TrackableVisualizationComponent<StationSelectionModel[]> implements AfterViewInit {

  @ViewChild('visible') visibleStationsDiv: ElementRef<HTMLDivElement>;
  @ViewChild('hidden') hiddenStationsDiv: ElementRef<HTMLDivElement>;

  private storedContinentsForSynchro: SuggestionContinentWrapper;

  constructor(channelService: ChannelService,
              overlaySynchro: OverlaySynchroService,
              provenanceService: ProvenanceService<StationSelectionModel[]>,
              userRoleService: UserRoleService,
              suggestionLinkingService: SuggestionLinkServiceService,
              dialog: MatDialog,
              private candidateListService: CandidateListService,
              private scrollSynchronizerService: ScrollSynchronizerService,
              private synchroFixer: SynchroFixerService) {
    super(channelService, overlaySynchro, provenanceService, userRoleService, suggestionLinkingService, dialog);

    this.synchroFixer.storeContinentForSynchro.subscribe(conts => this.storedContinentsForSynchro = conts);

    channelService.messages$.subscribe(message => {
      if (this.isOverlay && message.type === 'scrollSync') {
        const m = message as ListScroll;
        switch (m.list) {
          case 'hidden':
            this.hiddenStationsDiv.nativeElement.scrollTop = m.top;
            break;
          case 'visible':
            this.visibleStationsDiv.nativeElement.scrollTop = m.top;
              break;
        }
      }
    });
  }

  visibleFilter: string;
  invisibleFilter: string;

  get measurements(): Measurement[] {
    return this._measurements;
  }

  @Input() set measurements(value: Measurement[]) {
    this._measurements = value;
    console.warn('setting measurements', this.stations);
    if (!this.stations) {
      this.updateStations();
    }
  }

  @HostListener('scroll', ['$event'])
  onScroll(event, list: ScrollableListNames) {
    if (!this.isOverlay) {
      this.scrollSynchronizerService.scroll$.next(new ListScroll(event.target.scrollTop, list));
    }
  }

  get continents(): SuggestionContinentWrapper {
    return this._continents;
  }

  @Input() set continents(value: SuggestionContinentWrapper) {
    this._continents = value;
    this.updateContinents();
  }

  get continentsPreview(): SuggestionContinentWrapper {
    return this._continentsPreview;
  }

  @Input() set continentsPreview(value: SuggestionContinentWrapper) {
    this.updateContinentsPreview(value);
  }

  @Input() highlightedIDs: Set<string>;

  _selectedStations = new Set<string>();
  @Output() selectedStations = new EventEmitter<Set<string>>();

  private _measurements: Measurement[];
  private _continents: SuggestionContinentWrapper;
  private _continentsPreview: SuggestionContinentWrapper;
  stations: StationSelectionModel[];

  private userEventForSynchro: TrackingEvent<StationSelectionModel[]>;

  ngAfterViewInit(): void {
    this.setupUserRole();
    this.updateStations();

    console.log(this.hiddenStationsDiv, this.visibleStationsDiv.nativeElement);
  }

  private updateStations(): void {
    if (!this.measurements) {
      return;
    }

    const stationNameMap = new Map<string, Measurement>();
    this.measurements?.forEach(m => stationNameMap.set(m.station, m));
    console.warn('overwriting stations with new shit!!');
    this.stations = [...stationNameMap.entries()].map(([name, m]) => {
      return {
        station: name,
        selected: true,
        candidate: true,
        continent: m.continent
      };
    });
    this.candidateListService.candidates = this.getRemainingCandidates();
  }

  private updateContinents(): void {
    // if (this.userEventsForSynchro.length === 0) {
    console.error('updating continents (no preview)');
    this.beforeContinentPreview = null;
    this.stations?.forEach(station => station.selected = this.continents.continents.has(station.continent));
    this.emitStations();
    // }
  }

  private beforeContinentPreview: StationSelectionModel[];
  private updateContinentsPreview(continentPreview: SuggestionContinentWrapper): void {
    console.error(continentPreview ? 'starting' : 'ending', 'continent preview');
    if (continentPreview) {
      this.beforeContinentPreview = JSON.parse(JSON.stringify(this.stations));
      this.stations?.forEach(station => station.selected = continentPreview.continents.has(station.continent));
    } else {
      if (this.beforeContinentPreview !== null) {
        this.stations = this.beforeContinentPreview;
      }
    }
    this.emitStations();
  }

  public toggleVisibility(station: StationSelectionModel) {
    station.selected = !station.selected;
    const event: Event = station.selected ? 'add station' : 'remove station';
    this.emitStations();
    this.provenanceService.log(new TrackingEvent<StationSelectionModel[]>(this.getComponent(), this.getName(), event, this.stations), this.userRole);
  }

  public toggleCandidate(station: StationSelectionModel, external = false) {
    station.candidate = !station.candidate;
    const event: Event = station.candidate ? 'star station' : 'remove star';
    if (!external) {
      this.provenanceService.log(new TrackingEvent<StationSelectionModel[]>(this.getComponent(), this.getName(), event, this.stations), this.userRole);
    }
    this.candidateListService.candidates = this.getRemainingCandidates();
  }

  public emitStations(): void {
    this.selectedStations.next(this.stationsToSet());
  }

  private stationsToSet(): Set<string> {
    return new Set(this.stations?.filter(s => s.selected).map(s => s.station));
  }

  private getRemainingCandidates(): string[] {
    return this.stations?.filter(s => s.candidate === true).map(s => s.station).sort();
  }

  getComponent(): string {
    return 'station-list';
  }

  getName(): string {
    return 's1';
  }

  guidanceMake(suggestion): void {
  }

  guidancePreviewEnd(suggestion): void {
  }

  guidancePreviewStart(suggestion): void {
  }

  protected saveUserEventForSynchro(event: TrackingEvent<StationSelectionModel[]>): void {
    this.userEventForSynchro = event;
  }

  processEvent(message: TrackingEvent<StationSelectionModel[]>, isSynchroUpdate: boolean): void {
    if (!isSynchroUpdate) {
      this.saveUserEventForSynchro(message);

      if (this.userRole === 'wizard' && !isSynchroUpdate) {
        return;
      }
      // in the overlay we can simply override the values, we want to sync stars anyway
      this.stations = message.value;
      this.synchroFixer.mapRemoveContinentEmitter.next(true);
      this.storedContinentsForSynchro = null;
      this.emitStations();
    } else {
      // prevent leaking user stars to the wizard and distorting their results.
      const stationMap = new Map<string, StationSelectionModel>();
      message.value.forEach(sm => stationMap.set(sm.station, sm));

      this.stations.forEach(localStationModel => {
        const incomingValues = stationMap.get(localStationModel.station);
        localStationModel.selected = incomingValues.selected;
      });
      this.emitStations();
    }
  }

  synchronize(): void {
    if (this.storedContinentsForSynchro) {
      console.log('station list has stored continent update');
      this.continents = this.storedContinentsForSynchro;
      this.updateContinents()
    } else {
      console.log('station list has NO stored continent update');
    }
    if (this.userEventForSynchro) {
      this.processEvent(this.userEventForSynchro, true);
      this.emitStations();
    }
  }

  showAll(): void {
    this.stations.forEach(s => s.selected = true);
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'show all', this.stations), this.userRole);
  }

  hideAll(): void {
    this.stations.forEach(s => s.selected = false);
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'hide all', this.stations), this.userRole);
  }

  starAll(): void {
    this.stations.forEach(s => s.candidate = true);
    this.candidateListService.candidates = this.getRemainingCandidates();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'star all', this.stations), this.userRole);
  }

  starNone(): void {
    this.stations.forEach(s => s.candidate = false);
    this.candidateListService.candidates = this.getRemainingCandidates();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'star none', this.stations), this.userRole);
  }

  makeStarsVisible(): void {
    this.stations.forEach(s => {if (s.candidate) { s.selected = true; }});
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'star->visible', this.stations), this.userRole);
  }

  starVisibles(): void {
    this.stations.forEach(s => {if (s.selected) { s.candidate = true; }});
    this.candidateListService.candidates = this.getRemainingCandidates();
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'visible -> star', this.stations), this.userRole);
  }

  invisibleNoStar(): void {
    this.stations.forEach(s => {if (!s.selected) { s.candidate = false; }});
    this.candidateListService.candidates = this.getRemainingCandidates();
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'invisible -> no star', this.stations), this.userRole);
  }

  noStarInvisible(): void {
    this.stations.forEach(s => {if (!s.candidate) { s.selected = false; }});
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'no star -> invisible', this.stations), this.userRole);
  }

  hideHighlighted(): void {
    this.stations.forEach(s => {if (this.highlightedIDs.has(s.station)) { s.selected = false; }});
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'highlighted -> invisible', this.stations), this.userRole);
  }

  hideNotHighlighted(): void {
    this.stations.forEach(s => {if (!this.highlightedIDs.has(s.station)) { s.selected = false; }});
    this.emitStations();
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'not highlighted -> invisible', this.stations), this.userRole);
  }

  resetToDefault(): void {
    // nothing to reset
  }
}

export interface StationSelectionModel  {
  station: string;
  continent: string;
  selected: boolean;
  candidate: boolean;
}

@Pipe({
  name: 'stationfilter',
  pure: false
})
export class StationFilterPipe implements PipeTransform {
  transform(items: StationSelectionModel[], filters: [{prop: string, val: boolean}]): any {
    if (!items || !filters) {
      return items;
    }
    // filters items array, items which match and return true will be
    // kept, false will be filtered out
    for (let filter of filters) {
      items = items.filter(item => item[filter.prop] === filter.val);
    }
    return items;
  }
}

@Pipe({
  name: 'namefilter',
  pure: false
})
export class NameFilterPipe implements PipeTransform {
  transform(items: StationSelectionModel[], name: string): any {
    if (!items || !name) {
      return items;
    }
    // filters items array, items which match and return true will be
    // kept, false will be filtered out
    name = name.toLowerCase();
    return items.filter(item => item.station.toLowerCase().includes(name));
  }
}
