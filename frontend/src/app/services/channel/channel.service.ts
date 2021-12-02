import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { WebSocketServiceService } from '../web-socket-service.service';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Channel } from '../../sockets/channel-manager/channel-manager.component';
import { IEvent, TrackingEvent } from '../provenance.service';
import { UserRoleService } from '../study/user-role.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  public messages$: Subject<IEvent<any>> = new Subject<IEvent<any>>();
  private socket$?: Subject<IEvent<any>>;
  public selectedChannel?: Channel = undefined;
  private subscription?: Subscription;

  private apiPrefix = 'channels';

  private readonly _userID: string;

  constructor(private wsService: WebSocketServiceService, private http: HttpClient,
              private userRoleService: UserRoleService,
              private snackBar: MatSnackBar) {
    this._userID = uuid();
  }

  public connect(channel: Channel): Subject<IEvent<any>> {
    if (this.subscription) {
      this.disconnect();
    }

    this.selectedChannel = channel;
    const socket = this.wsService.connect(`${environment.backendWS}/${this.apiPrefix}/${this.selectedChannel.name}/${this._userID}`);
    this.switchSocket(socket);

    return this.messages$;
  }

  public getAvailableChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${environment.backend}/${this.apiPrefix}/`);
  }

  public registerChannel(name: string): Observable<Channel[]> {
    return this.http.post<Channel[]>(`${environment.backend}/${this.apiPrefix}/create/`, { name});
  }

  public deleteChannel(channel: Channel): Observable<Channel[]> {
    return this.http.post<Channel[]>(`${environment.backend}/${this.apiPrefix}/delete/`, channel);
  }

  private switchSocket(newSocket: Subject<IEvent<any>>): void {
    this.subscription?.unsubscribe();
    this.socket$ = newSocket;
    this.subscription = this.socket$.subscribe(next => this.messages$.next(next));
  }

  public disconnect(): void {
    this.subscription?.unsubscribe();
    this.socket$ = undefined;
    this.subscription = undefined;
    this.selectedChannel = undefined;
    this.userRoleService.role.next(undefined);

    // this.snackBar.open('Successfully disconnected.', 'OK');
    alert('Disconnected.')
  }

  public send(message: IEvent<any>): void {
    this.socket$?.next(message);
  }

  public get userID(): string {
    return this._userID;
  }
}
