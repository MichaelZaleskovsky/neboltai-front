import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type OpenSeadragon from 'openseadragon';
import { CropTileSourceConfig, buildCropTileSource } from './crop-tile-source';
import { TileLoadDebouncer } from './tile-load-debouncer';

@Component({
  selector: 'app-osd-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="osd-host"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .osd-host {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class OsdViewer {
  /** The tile source to display. A DZI/IIIF URL string or an OpenSeadragon tile-source object. */
  readonly tileSources = input<OpenSeadragon.Options['tileSources']>();

  /**
   * Optional crop-endpoint config. When set, the viewer builds a custom tiled
   * deep-zoom source backed by the server crop endpoint and uses it instead of
   * `tileSources`.
   */
  readonly cropSource = input<CropTileSourceConfig | null>(null);

  /** Optional overrides merged into the OpenSeadragon options. */
  readonly options = input<Partial<OpenSeadragon.Options>>({});

  /** Show OpenSeadragon's built-in control buttons. Off by default so the host page can supply its own. */
  readonly showControls = input(false);

  /**
   * Optional external element to render the navigator (overview) minimap into.
   * When provided, the navigator is placed in this element instead of floating
   * inside the viewer.
   */
  readonly navigatorElement = input<HTMLElement | null>(null);

  /** Emits the viewer instance once it has been created (browser only). */
  readonly ready = output<OpenSeadragon.Viewer>();

  /** Emits when a tile source fails to load. */
  readonly loadError = output<string>();

  /** Emits the current zoom percentage whenever it changes. */
  readonly zoomChange = output<number>();

  /** Emits the maximum zoom percentage once the image has opened. */
  readonly maxZoomChange = output<number>();

  /**
   * Current zoom level as a percentage of the fit-to-view (home) zoom.
   * 100% = whole image fitted; 200% = twice that, etc. Read-only signal.
   */
  readonly zoomPercent = signal(100);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private viewer?: OpenSeadragon.Viewer;
  private tileLoading?: TileLoadDebouncer;
  private removeWheelListener?: () => void;
  private osd?: typeof OpenSeadragon;
  private readonly zone = inject(NgZone);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Create the viewer once, in the browser only. Never during SSR/prerender.
    afterNextRender(async () => {
      const { default: OpenSeadragon } = await import('openseadragon');
      this.osd = OpenSeadragon;

      const externalNavigator = this.navigatorElement();

      this.viewer = OpenSeadragon({
        element: this.host().nativeElement,
        prefixUrl: '/openseadragon/images/',
        tileSources: this.resolveSource(),
        showNavigationControl: this.showControls(),
        showNavigator: true,
        // Render the navigator into an external element if one was supplied,
        // otherwise float it in the top-right corner of the viewer.
        ...(externalNavigator
          ? { navigatorId: this.ensureId(externalNavigator) }
          : { navigatorPosition: 'TOP_RIGHT' }),
        // Keep the navigator thumbnail at the image's aspect ratio so it fills
        // its container without dead/letterboxed space.
        navigatorMaintainSizeRatio: true,
        gestureSettingsMouse: { clickToZoom: false },
        // Fit the whole image into the viewport on open. Since the viewer box
        // matches the image aspect ratio, this fills it with no crop or bars.
        homeFillsViewer: false,
        // Keep the image within bounds: these prevent dragging the image edges
        // inside the viewport, so you can't pan it into empty black space.
        constrainDuringPan: true,
        visibilityRatio: 1,
        // Don't allow zooming out past the fit-to-view (home) level. Using
        // minZoomLevel coupling via the constraint below instead of
        // minZoomImageRatio, which would otherwise collapse the zoom range for
        // single (non-tiled) images whose fit zoom is already below 1:1.
        defaultZoomLevel: 0,
        // Allow zooming in well beyond the image's native pixels so single
        // preview images can still be enlarged (they just get soft past 100%).
        maxZoomPixelRatio: 8,
        imageLoaderLimit: 2,
        maxImageCacheCount: 256,
        loadDestinationTilesOnAnimation: true,
        tileRetryMax: 2,
        tileRetryDelay: 1500,
        ...this.options(),
      });

      // The navigator otherwise owns a separate loader and can exceed the
      // viewer's concurrency limit. Share the same queue before images open.
      if (this.viewer.navigator) {
        this.viewer.navigator.imageLoader = this.viewer.imageLoader;
      }
      this.tileLoading = new TileLoadDebouncer(this.viewer.imageLoader, () => {
        this.viewer?.forceRedraw();
        this.viewer?.navigator?.forceRedraw();
      });
      const pauseLoading = () => this.tileLoading?.pause();
      const host = this.host().nativeElement;
      host.addEventListener('wheel', pauseLoading, { capture: true, passive: true });
      this.removeWheelListener = () => host.removeEventListener('wheel', pauseLoading, true);
      this.viewer.addHandler('pan', pauseLoading);

      // A source-level failure is reported, but never replaces an already
      // loaded image. Tile failures are handled by OSD's bounded retry queue;
      // cached lower-resolution tiles remain available for rendering.
      this.viewer.addHandler('open-failed', () => {
        this.zone.run(() => this.loadError.emit('PRODUCT.IMAGE_LOAD_ERROR'));
      });

      // Once the image is loaded, fit the entire image into view immediately.
      this.viewer.addHandler('open', () => {
        this.zone.run(() => {
          this.viewer?.viewport.goHome(true);
          this.updateZoomPercent();
          this.maxZoomChange.emit(this.maxZoomPercent());
        });
      });

      // Clamp the minimum zoom to the fit-to-view (home) level so the image
      // can't be zoomed out smaller than fully fitted, then update the readout.
      // Run inside the Angular zone so the zoom signal change (which OSD fires
      // outside Angular) triggers change detection and updates bound controls.
      this.viewer.addHandler('zoom', () => {
        this.tileLoading?.pause();
        this.zone.run(() => {
          const vp = this.viewer?.viewport;
          if (vp) {
            const home = vp.getHomeZoom();
            if (home && vp.getZoom(false) < home) {
              vp.zoomTo(home, undefined, true);
            }
          }
          this.updateZoomPercent();
        });
      });

      this.ready.emit(this.viewer);
    });

    // React to source changes (e.g. navigating between products) by swapping
    // the open image without recreating the viewer.
    effect(() => {
      // Track both inputs so either change re-runs this.
      this.tileSources();
      this.cropSource();
      const source = this.resolveSource();
      if (this.viewer && source != null) {
        this.tileLoading?.reset();
        this.viewer.open(source as OpenSeadragon.TileSourceSpecifier);
      }
    });

    destroyRef.onDestroy(() => {
      this.removeWheelListener?.();
      this.tileLoading?.destroy();
      this.viewer?.destroy();
      this.viewer = undefined;
    });
  }

  // Imperative controls the host page can call via a template reference.

  zoomIn(factor = 1.4): void {
    const vp = this.viewer?.viewport;
    if (!vp) return;
    vp.zoomBy(factor);
    vp.applyConstraints();
  }

  zoomOut(factor = 1.4): void {
    const vp = this.viewer?.viewport;
    if (!vp) return;
    vp.zoomBy(1 / factor);
    vp.applyConstraints();
  }

  home(): void {
    this.viewer?.viewport.goHome();
  }

  /** Set the zoom to a percentage of the fit-to-view (home) zoom. */
  setZoomPercent(percent: number): void {
    const vp = this.viewer?.viewport;
    if (!vp) return;
    const home = vp.getHomeZoom();
    if (!home) return;
    vp.zoomTo((percent / 100) * home);
    vp.applyConstraints();
  }

  /** The maximum zoom as a percentage of home, for slider bounds. */
  maxZoomPercent(): number {
    const vp = this.viewer?.viewport;
    if (!vp) return 100;
    const home = vp.getHomeZoom();
    const max = vp.getMaxZoom();
    if (!home || !max) return 100;
    return Math.round((max / home) * 100);
  }

  /**
   * The effective tile source: a custom crop-backed tiled source when a
   * cropSource is provided, otherwise the plain `tileSources` input.
   */
  private resolveSource(): OpenSeadragon.Options['tileSources'] | undefined {
    const crop = this.cropSource();
    if (crop && this.osd) {
      return buildCropTileSource(this.osd, crop) as OpenSeadragon.Options['tileSources'];
    }
    return this.tileSources();
  }

  /** Ensure the element has an id (OSD's navigatorId needs one) and return it. */
  private ensureId(el: HTMLElement): string {
    if (!el.id) {
      el.id = `osd-nav-${Math.random().toString(36).slice(2)}`;
    }
    return el.id;
  }

  /** Recompute the zoom percentage relative to the fit-to-view (home) zoom. */
  private updateZoomPercent(): void {
    const vp = this.viewer?.viewport;
    if (!vp) return;
    const home = vp.getHomeZoom();
    if (!home) return;
    const percent = Math.round((vp.getZoom(true) / home) * 100);
    this.zoomPercent.set(percent);
    this.zoomChange.emit(percent);
  }

  toggleFullScreen(): void {
    if (!this.viewer) return;
    this.viewer.setFullScreen(!this.viewer.isFullPage());
  }
}
