import { fakeAsync, tick } from '@angular/core/testing';
import type OpenSeadragon from 'openseadragon';
import { TileLoadDebouncer } from './tile-load-debouncer';

describe('TileLoadDebouncer', () => {
  let addJob: jasmine.Spy;
  let clear: jasmine.Spy;
  let redraw: jasmine.Spy;
  let loader: Pick<OpenSeadragon.ImageLoader, 'addJob' | 'clear'>;
  let gate: TileLoadDebouncer;

  beforeEach(() => {
    addJob = jasmine.createSpy('addJob').and.returnValue(true);
    clear = jasmine.createSpy('clear');
    redraw = jasmine.createSpy('redraw');
    loader = { addJob, clear };
    gate = new TileLoadDebouncer(loader, redraw);
  });
  afterEach(() => gate.destroy());

  it('allows initial downloads, then blocks until 300 ms after the last interaction', fakeAsync(() => {
    const initial = {};
    loader.addJob(initial);
    expect(addJob).toHaveBeenCalledWith(initial);
    gate.pause();
    const abort = jasmine.createSpy('abort');
    loader.addJob({ abort });
    expect(abort).toHaveBeenCalled();
    expect(addJob.calls.count()).toBe(1);
    tick(250);
    gate.pause();
    tick(299);
    expect(redraw).not.toHaveBeenCalled();
    tick(1);
    expect(redraw).toHaveBeenCalledTimes(1);
    loader.addJob({ src: 'final-scale' });
    expect(addJob.calls.mostRecent().args[0].src).toBe('final-scale');
    expect(clear).toHaveBeenCalledTimes(2);
  }));

  it('discards queued work and releases loading flags without generating failures', fakeAsync(() => {
    let loading = true;
    const queuedAbort = jasmine.createSpy('queuedAbort');
    clear.and.callFake(() => queuedAbort());
    gate.pause();
    loader.addJob({ abort: () => loading = false });
    expect(queuedAbort).toHaveBeenCalled();
    expect(loading).toBeFalse();
    tick(300);
    // Obsolete jobs are never replayed; OSD selects fresh jobs on redraw.
    expect(addJob).not.toHaveBeenCalled();
    expect(redraw).toHaveBeenCalledTimes(1);
  }));

  it('resets immediately for a new source or preview fallback', fakeAsync(() => {
    gate.pause();
    gate.reset();
    loader.addJob({ src: 'new-source' });
    expect(addJob).toHaveBeenCalled();
    tick(300);
    expect(redraw).not.toHaveBeenCalled();
  }));

  it('restores the loader and cancels timers on destruction', fakeAsync(() => {
    gate.pause();
    gate.destroy();
    expect(loader.addJob).toBe(addJob);
    tick(300);
    expect(redraw).not.toHaveBeenCalled();
  }));
});
