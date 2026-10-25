import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import type OpenSeadragon from 'openseadragon';
import { TranslocoPipe } from '@jsverse/transloco';
import { ArtworksApi } from '../../services/artworks-api';
import { OsdViewer } from '../../osd-viewer/osd-viewer';
import { CropTileSourceConfig } from '../../osd-viewer/crop-tile-source';

@Component({
  selector: 'app-product-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, OsdViewer, TranslocoPipe],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  private readonly api = inject(ArtworksApi);

  /** Bound from the route param `:id` via withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly itemResource = rxResource({
    params: () => ({ id: Number(this.id()) }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly item = computed(() => this.itemResource.value());

  /** Human-readable error message, shown on the page when loading fails. */
  protected readonly errorMessage = computed(() => {
    const err = this.itemResource.error();
    return err instanceof Error ? err.message : String(err ?? '');
  });

  /**
   * Plain tile source for demo items (DZI / single image). Null for backend
   * artworks, which use the crop-backed deep-zoom source below instead.
   */
  protected readonly tileSource = computed<OpenSeadragon.Options['tileSources'] | null>(() => {
    const current = this.item();
    if (!current) return null;
    // Demo items carry an explicit source.
    if (current.tileSourceOverride != null) {
      return current.tileSourceOverride as OpenSeadragon.Options['tileSources'];
    }
    // Backend artwork without usable dimensions: fall back to the single
    // preview image so something still renders (no deep zoom in that case).
    if (!current.width || !current.height) {
      return { type: 'image', url: current.previewUrl };
    }
    return null;
  });

  /**
   * Crop-backed deep-zoom source for real backend artworks. OpenSeadragon
   * requests tiles as crops of the original image, so only the visible region
   * at each zoom level is fetched — true progressive deep zoom.
   */
  protected readonly cropSource = computed<CropTileSourceConfig | null>(() => {
    const current = this.item();
    if (!current || current.tileSourceOverride != null) return null;
    if (!current.width || !current.height) return null;
    return {
      width: current.width,
      height: current.height,
      cropUrl: (region) => this.api.cropUrl(current.imageId, region),
    };
  });

  private readonly viewer = viewChild(OsdViewer);

  /** Container element where the viewer's navigator (overview) is rendered. */
  protected readonly navigatorEl = viewChild<ElementRef<HTMLDivElement>>('navigator');

  /** Live zoom level, driven by the viewer's zoomChange output. */
  protected readonly zoomPercent = signal(100);

  /** Upper bound for the zoom slider, driven by the viewer's maxZoomChange output. */
  protected readonly maxZoomPercent = signal(100);

  protected onZoomChange(percent: number): void {
    this.zoomPercent.set(percent);
  }

  protected onMaxZoomChange(percent: number): void {
    this.maxZoomPercent.set(percent);
  }

  protected onSliderInput(value: string): void {
    this.viewer()?.setZoomPercent(Number(value));
  }

  protected readonly imageError = signal('');

  protected onImageError(message: string): void {
    this.imageError.set(message);
  }

  protected zoomIn(): void {
    this.viewer()?.zoomIn();
  }

  protected zoomOut(): void {
    this.viewer()?.zoomOut();
  }

  protected fullScreen(): void {
    this.viewer()?.toggleFullScreen();
  }
}
