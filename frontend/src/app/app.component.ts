import { Component } from '@angular/core';
import { ChannelService } from './services/channel/channel.service';
import { UserRoleService } from './services/study/user-role.service';
import { TooltipService } from './services/tooltip.service';
import { MatDialog } from '@angular/material/dialog';
import { OverlayComponent } from './utils/overlay/overlay.component';
import { OverlayService } from './services/overlay.service';
import { MouseTrackerService } from './services/mouse-tracker.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'GuidanceStudy';

  constructor(public userRoleService: UserRoleService,
              public channelService: ChannelService,
              private overlayService: OverlayService,
              private mouseTracker: MouseTrackerService,
              private router: Router) {
    this.userRoleService.role.subscribe(role => {
      if (role === 'wizard' && !this.overlayService.appIsOnlyOverlay) {
        this.overlayService.openOverlay(OverlayComponent);
      } else {
        this.overlayService.close();
      }
    });
  }

  disconnect(): void {
    this.channelService.disconnect();
    this.router.navigate(['/channel']);
  }

}
