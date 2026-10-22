import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import type OpenSeadragon from 'openseadragon';
import { OsdViewer } from '../../osd-viewer/osd-viewer';

/**
 * Side-by-side comparison page.
 *
 * Left: the heavy, properly tiled Duomo DZI (true deep-zoom pyramid).
 * Right: a plain single-image source, like the backend preview JPEG.
 * Use this to compare pan/zoom behavior between a tiled and a non-tiled source.
 */
@Component({
  selector: 'app-demo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OsdViewer],
  templateUrl: './demo-page.html',
  styleUrl: './demo-page.scss',
})
export class DemoPage {
  /** Heavy tiled deep-zoom pyramid (~13920 × 10200). */
  protected readonly dziSource: OpenSeadragon.Options['tileSources'] =
    'https://openseadragon.github.io/example-images/duomo/duomo.dzi';

  /** Plain single image (non-tiled), analogous to the backend preview. */
  protected readonly imageSource: OpenSeadragon.Options['tileSources'] = {
    type: 'image',
    url: 'https://openseadragon.github.io/example-images/grand-canyon-landscape-overlooking.jpg',
  };

  private readonly dziViewer = viewChild<OsdViewer>('dzi');
  private readonly imageViewer = viewChild<OsdViewer>('img');

  protected readonly dziError = signal('');
  protected readonly imageError = signal('');
}
