import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ChannelService } from '../../services/channel/channel.service';

@Injectable({
  providedIn: 'root'
})
export class SocketGuard implements CanActivate {

  constructor(private channelService: ChannelService,
              private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.channelService.selectedChannel) {
      return true;
    }
    this.router.navigate(['channel']);
    return false;
  }

}
