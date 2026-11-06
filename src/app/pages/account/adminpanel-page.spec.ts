import { TestBed } from '@angular/core/testing';
import { WritableSignal } from '@angular/core';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { AdminPanelPage } from './adminpanel-page';
import { ArtworksApi } from '../../services/artworks-api';

describe('AdminPanelPage upload dialog', () => {
  it('opens modally while busy, blocks dismissal, and closes after the request', async () => {
    TestBed.configureTestingModule({
      imports: [AdminPanelPage],
      providers: [
        { provide: ArtworksApi, useValue: { authors: () => of([]), medias: () => of([]), mediaTypes: () => of([]) } },
        provideTransloco({ config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: class implements TranslocoLoader { getTranslation() { return of({}); } } }),
      ],
    });
    const fixture = TestBed.createComponent(AdminPanelPage);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    const state = fixture.componentInstance as unknown as { imageBusy: WritableSignal<string> };
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBeFalse();
    state.imageBusy.set('Your file is uploading. Please be patient, as this may take a while.');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.open).toBeTrue();
    expect(dialog.matches(':modal')).toBeTrue();
    expect(dialog.textContent).toContain('Your file is uploading.');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBeTrue();
    state.imageBusy.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.open).toBeFalse();
    fixture.destroy();
  });
});
