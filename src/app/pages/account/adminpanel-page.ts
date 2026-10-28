import { ChangeDetectionStrategy, Component, inject, signal, viewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ArtworksApi } from '../../services/artworks-api';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-adminpanel-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './adminpanel-page.html',
  styleUrl: './adminpanel-page.scss',
})
export class AdminPanelPage {
  private readonly api = inject(ArtworksApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authors = rxResource({ stream: () => this.api.authors(), defaultValue: [] });
  protected readonly medias = rxResource({ stream: () => this.api.medias(), defaultValue: [] });
  protected readonly mediaTypes = rxResource({ stream: () => this.api.mediaTypes(), defaultValue: [] });
  protected readonly pending = signal<Record<string, boolean>>({});
  protected readonly messages = signal<Record<string, string>>({});
  protected readonly errors = signal<Record<string, boolean>>({});
  protected author = { name: '', familyName: '', secondName: '', description: '' };
  protected media = { name: '', typeId: null as number | null };
  protected mediaType = { name: '' };
  protected readonly fileError = signal('');
  protected readonly selectedFileName = signal('');
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploadedImage = signal<{ imageId: string; width: number; height: number } | null>(null);
  protected readonly imageBusy = signal('');
  protected readonly imageMessage = signal('');
  protected readonly imageFailure = signal('');
  protected imageMetadata = { name: '', authorId: null as number | null, mediaId: null as number | null, year: null as number | null, description: '' };
  private readonly imageFileInput = viewChild<ElementRef<HTMLInputElement>>('imageFile');

  protected imageValid(): boolean {
    return !!this.imageMetadata.name.trim() && this.imageMetadata.authorId !== null &&
      (this.imageMetadata.year === null || Number.isInteger(this.imageMetadata.year));
  }

  protected previewUrl(): string {
    const image = this.uploadedImage();
    return image ? this.api.previewUrl(image.imageId) : '';
  }

  protected loadImage(): void {
    const file = this.selectedFile();
    if (!file || !this.imageValid() || this.imageBusy() || this.uploadedImage()) return;
    this.imageBusy.set('File uploading...');
    this.imageFailure.set('');
    this.imageMessage.set('');
    this.api.uploadImage(file).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.imageBusy.set(''))).subscribe({
      next: image => this.uploadedImage.set(image),
      error: error => this.showImageError(error),
    });
  }

  protected finishUploading(): void {
    const image = this.uploadedImage();
    if (!image || !this.imageValid() || this.imageBusy()) return;
    this.imageBusy.set('Saving metadata...');
    this.imageFailure.set('');
    this.api.saveImageMetadata({ ...image, imageName: this.imageMetadata.name.trim(),
      fileName: this.selectedFileName(), authorId: this.imageMetadata.authorId!,
      mediaId: this.imageMetadata.mediaId, year: this.imageMetadata.year,
      description: this.imageMetadata.description.trim(),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.imageBusy.set(''))).subscribe({
      next: () => { this.resetImage(); this.imageMessage.set('Image and metadata saved successfully.'); },
      error: error => this.showImageError(error),
    });
  }

  protected cancelUploading(): void {
    const image = this.uploadedImage();
    if (!image || this.imageBusy()) return;
    this.imageBusy.set('Deleting image...');
    this.imageFailure.set('');
    this.api.deleteImage(image.imageId).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.imageBusy.set(''))).subscribe({
      next: () => { this.resetImage(); this.imageMessage.set('Upload cancelled.'); },
      error: error => this.showImageError(error),
    });
  }

  private showImageError(error: HttpErrorResponse): void {
    const detail = typeof error.error === 'object' ? error.error?.message : '';
    this.imageFailure.set(detail || (error.status ? `Request failed (HTTP ${error.status}). Please try again.` : 'Unable to reach the server. Please try again.'));
  }

  private resetImage(): void {
    this.uploadedImage.set(null);
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.fileError.set('');
    this.imageMetadata = { name: '', authorId: null, mediaId: null, year: null, description: '' };
    const input = this.imageFileInput();
    if (input) input.nativeElement.value = '';
  }

  protected saveAuthor(form: NgForm): void {
    if (!this.valid(form, 'author')) return;
    const { name, familyName, secondName, description } = this.author;
    this.save('author', this.api.addAuthor({
      name: name.trim(), familyName: familyName.trim(),
      ...(secondName.trim() ? { secondName: secondName.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    }), () => { form.resetForm({ name: '', familyName: '', secondName: '', description: '' }); this.authors.reload(); });
  }

  protected saveMedia(form: NgForm): void {
    if (!this.valid(form, 'media') || this.media.typeId === null) return;
    this.save('media', this.api.addMedia({ name: this.media.name.trim(), typeId: this.media.typeId }),
      () => { form.resetForm({ name: '', typeId: null }); this.medias.reload(); });
  }

  protected saveMediaType(form: NgForm): void {
    if (!this.valid(form, 'type')) return;
    this.save('type', this.api.addMediaType({ type: this.mediaType.name.trim() }),
      () => { form.resetForm({ name: '' }); this.mediaTypes.reload(); });
  }

  protected selectFile(event: Event): void {
    if (this.imageBusy() || this.uploadedImage()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const valid = !file || /\.(tiff?|jpe?g)$/i.test(file.name);
    this.fileError.set(valid ? '' : 'Please select a TIFF or JPEG file.');
    this.selectedFileName.set(valid ? file?.name ?? '' : '');
    this.selectedFile.set(valid ? file ?? null : null);
    this.imageMessage.set('');
    this.imageFailure.set('');
    if (!valid) input.value = '';
  }

  private valid(form: NgForm, section: string): boolean {
    form.control.markAllAsTouched();
    return form.valid === true && !this.pending()[section];
  }

  private save(section: string, request: Observable<string>, onSuccess: () => void): void {
    this.pending.update(value => ({ ...value, [section]: true }));
    this.messages.update(value => ({ ...value, [section]: '' }));
    this.errors.update(value => ({ ...value, [section]: false }));
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.pending.update(value => ({ ...value, [section]: false }));
    })).subscribe({
      next: () => {
        this.messages.update(value => ({ ...value, [section]: 'Saved successfully.' }));
        onSuccess();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.update(value => ({ ...value, [section]: true }));
        this.messages.update(value => ({ ...value, [section]: error.status
          ? `Save failed (HTTP ${error.status}). Please try again.`
          : 'Unable to reach the server. Please try again.' }));
      },
    });
  }
}
