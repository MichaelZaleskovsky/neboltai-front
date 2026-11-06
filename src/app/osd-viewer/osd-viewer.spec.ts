import { TestBed } from '@angular/core/testing';
import OpenSeadragon from 'openseadragon';
import { OsdViewer } from './osd-viewer';

describe('OsdViewer tile recovery', () => {
  it('keeps the source open and recovers after a tile download fails', (done) => {
    TestBed.configureTestingModule({ imports: [OsdViewer] });
    const fixture = TestBed.createComponent(OsdViewer);
    fixture.nativeElement.style.width = '256px';
    fixture.nativeElement.style.height = '256px';
    document.body.appendChild(fixture.nativeElement);
    const source = new OpenSeadragon.TileSource({
      width: 256, height: 256, tileSize: 256, minLevel: 0, maxLevel: 0,
    });
    source.getTileUrl = () => 'test-tile';
    let attempts = 0;
    type DownloadContext = { fail(message: string): void; finish(data: CanvasRenderingContext2D, request: null, type: string): void };
    source.downloadTileStart = ((job: DownloadContext) => {
      attempts++;
      if (attempts === 1) {
        setTimeout(() => job.fail('Simulated HTTP 500'), 0);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        canvas.getContext('2d')!.fillRect(0, 0, 256, 256);
        setTimeout(() => job.finish(canvas.getContext('2d')!, null, 'context2d'), 0);
      }
    }) as unknown as typeof source.downloadTileStart;
    fixture.componentRef.setInput('tileSources', source);
    fixture.componentRef.setInput('options', { showNavigator: false, drawer: 'canvas', tileRetryDelay: 20 });
    let opens = 0;
    let failures = 0;
    fixture.componentInstance.ready.subscribe(viewer => {
      viewer.addHandler('open', () => opens++);
      viewer.addHandler('tile-load-failed', () => failures++);
      viewer.addOnceHandler('tile-loaded', () => {
        try {
          expect(failures).toBe(1);
          expect(attempts).toBe(2);
          expect(opens).toBe(1);
          expect(viewer.world.getItemAt(0).source).toBe(source);
          fixture.destroy();
          done();
        } catch (error) {
          fixture.destroy();
          done.fail(error as Error);
        }
      });
    });
    fixture.detectChanges();
  });
});
