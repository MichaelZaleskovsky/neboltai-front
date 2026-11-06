import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ArtworksApi } from './artworks-api';
import { API_BASE_URL } from './api-config';

describe('ArtworksApi administration', () => {
  let api: ArtworksApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'https://backend.example' },
    ] });
    api = TestBed.inject(ArtworksApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the file as multipart without manually setting Content-Type', () => {
    const file = new File(['image'], 'test.tiff', { type: 'image/tiff' });
    api.uploadImage(file).subscribe(image => expect(image.imageId).toBe('image-1'));
    const request = http.expectOne('https://backend.example/api/artworks/addImage');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush({ imageId: 'image-1', width: 100, height: 200 });
  });

  it('saves image metadata with numeric reference IDs and nullable fields', () => {
    const metadata = { imageId: 'image-1', imageName: 'Test', fileName: 'test.tiff',
      width: 100, height: 200, authorId: 1, mediaId: null, year: null, description: '' };
    api.saveImageMetadata(metadata).subscribe();
    const request = http.expectOne('https://backend.example/api/artworks/addMediaData');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(metadata);
    request.flush('');
  });

  it('deletes the uploaded image when cancelled', () => {
    api.deleteImage('image-1').subscribe();
    const request = http.expectOne('https://backend.example/api/artworks/deleteImage/image-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('loads the catalog using the configured base URL and ignores backend preview hosts', () => {
    api.search().subscribe(result => {
      expect(result.items[0].previewUrl).toBe('https://backend.example/api/artworks/preview/image-1');
    });
    const request = http.expectOne(req => req.url === 'https://backend.example/api/artworks/search');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [{ id: 1, imageId: 'image-1', imageName: 'Example',
      previewUrl: 'https://obsolete.example/old-preview' }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('loads reference lists using the configured base URL', () => {
    api.authors().subscribe();
    api.mediaTypes().subscribe();
    api.medias().subscribe();
    for (const path of ['authors', 'mediatypes', 'medias']) {
      const request = http.expectOne(`https://backend.example/api/${path}`);
      expect(request.request.method).toBe('GET');
      request.flush([]);
    }
  });

  it('builds preview and crop URLs using the configured base URL', () => {
    expect(api.previewUrl('image-1')).toBe('https://backend.example/api/artworks/preview/image-1');
    expect(api.cropUrl('image-1', { x: 10, y: 20, width: 100, height: 200, targetWidth: 50 }))
      .toBe('https://backend.example/api/images/image-1/crop?x=10&y=20&width=100&height=200&targetWidth=50');
  });

  it('posts an author using the configured base URL and accepts a text response', () => {
    const author = { familyName: 'Ivanov', name: 'Ivan', secondName: 'Ivanovich' };
    let response = '';
    api.addAuthor(author).subscribe(value => response = value);
    const request = http.expectOne('https://backend.example/api/addAuthor');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(author);
    request.flush('Author saved');
    expect(response).toBe('Author saved');
  });

  it('posts media with a numeric type ID', () => {
    api.addMedia({ name: 'Magazine', typeId: 1 }).subscribe();
    const request = http.expectOne('https://backend.example/api/addMedia');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Magazine', typeId: 1 });
    request.flush('');
  });

  it('posts a media type under the type property', () => {
    api.addMediaType({ type: 'Magazine' }).subscribe();
    const request = http.expectOne('https://backend.example/api/addMediaType');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ type: 'Magazine' });
    request.flush('');
  });
});
