import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketMessage } from 'rxjs/internal/observable/dom/WebSocketSubject';

@Injectable({
  providedIn: 'root'
})
export class WebSocketServiceService {

  constructor() { }

  private subject: WebSocketSubject<any>;

  public connect(url: string): WebSocketSubject<any> {
    if (!this.subject) {
      this.subject = this.create(url);
    }
    return this.subject;
  }

  private create(url: string): WebSocketSubject<any> {
    this.subject = webSocket(url);
    return this.subject;
  }
}
