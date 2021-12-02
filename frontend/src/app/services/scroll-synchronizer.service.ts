import { Injectable } from '@angular/core';
import { auditTime, throttleTime } from 'rxjs/operators';
import { TRACKING_DELAY } from './mouse-tracker.service';
import { Subject } from 'rxjs';
import { IEvent, ProvenanceService } from './provenance.service';
import { UserRoleService } from './study/user-role.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollSynchronizerService {
  public scroll$ = new Subject<ListScroll>();

  constructor(private provenanceService: ProvenanceService<any>,
              private userRoleService: UserRoleService) {
    this.scroll$
      // .pipe(throttleTime(TRACKING_DELAY * 5))
      .subscribe(e => {
        this.provenanceService.log(e, userRoleService.role.value);
      });
  }
}


export class ListScroll extends IEvent<null> {
  top: number;
  list: ScrollableListNames;
  type = 'scrollSync';

  constructor(top: number, list: ScrollableListNames) {
    super();
    this.top = top;
    this.list = list;
    this.time = +new Date();
  }
}

export type ScrollableListNames = 'visible' | 'hidden' | 'window';
