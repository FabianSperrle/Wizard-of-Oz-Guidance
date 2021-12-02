import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GuidanceInteractionEvent, GuidanceLinkingEvent, ProvenanceService } from './provenance.service';
import { UserRole } from './study/user-role.service';
import { DimpVisSuggestion } from '../visualizations/suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';

@Injectable({
  providedIn: 'root'
})
export class SuggestionLinkServiceService {

  private allSuggestions$ = new BehaviorSubject<DimpVisSuggestion<any>[]>([]);
  private overlaySuggestions$ = new BehaviorSubject<DimpVisSuggestion<any>[]>([]);

  constructor(private provenanceService: ProvenanceService<any>) { }

  public addSuggestion(sugg: DimpVisSuggestion<any>, overlay: boolean): void {
    const subj = overlay ? this.overlaySuggestions$ : this.allSuggestions$;
    const curr = subj.value;
    curr.push({...sugg});
    console.error(curr);
    subj.next([...curr]);
  }

  getSuggestionsForComponent(component: string, name: string, overlay: boolean): Observable<DimpVisSuggestion<any>[]> {
    const subj = overlay ? this.overlaySuggestions$ : this.allSuggestions$;
    return subj.pipe(map(suggs => suggs.filter(s => s.event.component === component && s.event.name === name)));
  }

  getAllSuggestions(): DimpVisSuggestion<any>[] {
    return this.allSuggestions$.value;
  }

  public removeSuggestions(component: string, filter: (sugg: DimpVisSuggestion<any>) => boolean = (_: DimpVisSuggestion<any>) => true, overlay: boolean, partial: boolean = false): void {
    const subj = overlay ? this.overlaySuggestions$ : this.allSuggestions$;
    const curr = subj.value;
    const suggestionsToRemove = curr.filter(s => filter(s));
    let idsToRemove = suggestionsToRemove.map(s => s.id);
    if (!partial) {
      idsToRemove = idsToRemove.concat(suggestionsToRemove.flatMap(s => s.linkedSuggestions));
    }
    const filtered = curr.filter(sugg => !idsToRemove.includes(sugg.id));
    subj.next([...filtered]);
  }

  public linkSuggestions(id: number, linkedIDs: number[], overlay: boolean) {
    const subj = overlay ? this.overlaySuggestions$ : this.allSuggestions$;
    const curr = subj.value;
    curr.find(s => s.id === id).linkedSuggestions = linkedIDs;
    for (let linkedID of linkedIDs) {
      curr.find(s => s.id === linkedID).linkedSuggestions = [...linkedIDs.filter(s => s !== linkedID), id];
    }
    console.log(curr);
    subj.next([...curr]);
  }

  public copyActionForLinkedSuggestions(ge: GuidanceInteractionEvent<any>, overlay: boolean, role: UserRole) {
    this.provenanceService.log(new GuidanceLinkingEvent(ge.suggestion.linkedSuggestions, ge.interaction), role);
    // const subj = overlay ? this.overlaySuggestions$ : this.allSuggestions$;
    // const curr = subj.value;
    // const suggestion = ge.suggestion;
    // for (let linkedID of suggestion.linkedSuggestions) {
    //   const linkedSugg = curr.find(s => s.id === linkedID);
    // }
  }
}
