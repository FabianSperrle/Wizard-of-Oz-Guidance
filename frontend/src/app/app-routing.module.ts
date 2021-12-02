import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChannelManagerComponent } from './sockets/channel-manager/channel-manager.component';
import { SocketGuard } from './utils/guards/socket.guard';
import { WeatherAnalysisComponent } from './tasks/weather-analysis/weather-analysis.component';
import { OverlayComponent } from './utils/overlay/overlay.component';
import { TLXComponent } from './tasks/statistics/tlx/tlx.component';

const routes: Routes = [
  {
    path: 'channel',
    component: ChannelManagerComponent
  },
  {
    path: '',
    component: WeatherAnalysisComponent,
    canActivate: [SocketGuard]
  },
  {
    path: 't1',
    component: WeatherAnalysisComponent,
    canActivate: [SocketGuard]
  },
  {
    path: 'tlx',
    component: TLXComponent
  },
  {
    path: 't1user',
    component: OverlayComponent,
    canActivate: [SocketGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
