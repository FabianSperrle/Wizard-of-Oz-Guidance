import {
  ComponentType,
  ConnectedPosition,
  FlexibleConnectedPositionStrategyOrigin, GlobalPositionStrategy, NoopScrollStrategy,
  Overlay,
  OverlayPositionBuilder,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable } from '@angular/core';

/**
 * Service to handle the creation and closing for tooltips with custom component
 */
@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  private overlayRef: OverlayRef;
  // tslint:disable-next-line
  private tooltipRef?: ComponentRef<any>;
  // An array containing the preferred positions in order for the tooltip to be displayed

  public appIsOnlyOverlay = false;

  constructor(private overlay: Overlay) {
    this.overlayRef = this.overlay.create();
  }

  /**
   * Opens a tooltip with a given template and position
   * @param tooltipComponent Component to use as the tooltip template
   * @param position an object containing an x and y value to position the tooltip
   * @returns the instance of the created tooltip
   */
  openOverlay<T>(tooltipComponent: ComponentType<T>): T {
    const tooltipPortal = new ComponentPortal(tooltipComponent);
    this.overlayRef = this.overlay.create();
    this.overlayRef.overlayElement.classList.add('userViewOverlay');
    this.tooltipRef = this.overlayRef.attach(tooltipPortal);
    return this.tooltipRef.instance;
  }

  /**
   * Closes the currently opened tooltip
   */
  close(): void {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      this.tooltipRef = undefined;
    }

  }
}
