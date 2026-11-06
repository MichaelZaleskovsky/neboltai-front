import type OpenSeadragon from 'openseadragon';

/** Gate new downloads, leaving OSD's tile selection, rendering and cache intact. */
export class TileLoadDebouncer {
  private paused = false;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly originalAddJob: OpenSeadragon.ImageLoader['addJob'];

  constructor(
    private readonly loader: Pick<OpenSeadragon.ImageLoader, 'addJob' | 'clear'>,
    private readonly redraw: () => void,
    private readonly delay = 300,
  ) {
    this.originalAddJob = loader.addJob;
    loader.addJob = (job) => {
      if (this.paused) {
        // OSD sets tile.loading before addJob; release it so the tile can be
        // selected again after the interaction, without reporting a failure.
        job.abort?.();
        return false;
      }
      return this.originalAddJob.call(loader, job);
    };
  }

  pause(): void {
    this.paused = true;
    clearTimeout(this.timer);
    // Drops queued jobs via their abort callbacks. In-flight requests and
    // already decoded tiles remain available; obsolete work is not replayed.
    this.loader.clear();
    this.timer = setTimeout(() => {
      this.paused = false;
      this.timer = undefined;
      this.redraw();
    }, this.delay);
  }

  reset(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.paused = false;
  }

  destroy(): void {
    this.reset();
    this.loader.addJob = this.originalAddJob;
  }
}
