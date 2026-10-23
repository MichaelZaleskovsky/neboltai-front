import { Author, CatalogItem, PagedResult } from '../models/catalog-item';

/**
 * Dummy data used as a fallback when the backend is unreachable or returns an
 * error (e.g. 500), and whenever `environment.useMock` is true. Lets the whole
 * UI — catalog, filters, product page, admin table — run with no backend.
 *
 * Images are public domain posters served from Wikimedia so previews render.
 */

const IMG = (file: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${file}`;

export const MOCK_AUTHORS: Author[] = [
  { id: 1, author: 'Dmitry Moor' },
  { id: 2, author: 'El Lissitzky' },
  { id: 3, author: 'Gustav Klutsis' },
  { id: 4, author: 'Unknown' },
];

export const MOCK_MEDIA_TYPES: string[] = ['Poster', 'Lithograph', 'Photomontage'];

export const MOCK_ITEMS: CatalogItem[] = [
  {
    id: 1,
    imageId: 'mock-1',
    name: 'Have You Volunteered?',
    author: 'Dmitry Moor',
    authorId: 1,
    media: 'Lithograph on paper',
    mediaType: 'Poster',
    size: '1066 × 1600 px',
    year: '1920',
    description:
      'Iconic Russian Civil War recruitment poster. This is dummy data for local testing.',
    width: 1066,
    height: 1600,
    previewUrl: IMG('a/a5/Ty_zapisalsya_dobrovol%27cem.jpg/400px-Ty_zapisalsya_dobrovol%27cem.jpg'),
  },
  {
    id: 2,
    imageId: 'mock-2',
    name: 'Beat the Whites with the Red Wedge',
    author: 'El Lissitzky',
    authorId: 2,
    media: 'Lithograph',
    mediaType: 'Lithograph',
    size: '1280 × 960 px',
    year: '1919',
    description: 'Suprematist propaganda lithograph. Dummy data for local testing.',
    width: 1280,
    height: 960,
    previewUrl: IMG('5/5a/Klinom_krasnym_bej_belych_1920.jpg/400px-Klinom_krasnym_bej_belych_1920.jpg'),
  },
  {
    id: 3,
    imageId: 'mock-3',
    name: 'Men and Women Workers',
    author: 'Gustav Klutsis',
    authorId: 3,
    media: 'Photomontage',
    mediaType: 'Photomontage',
    size: '900 × 1300 px',
    year: '1931',
    description: 'Constructivist photomontage poster. Dummy data for local testing.',
    width: 900,
    height: 1300,
    previewUrl: IMG('e/e0/Gustav_Klutsis%2C_1930.jpg/400px-Gustav_Klutsis%2C_1930.jpg'),
  },
  {
    id: 4,
    imageId: 'mock-4',
    name: 'Untitled Agitprop Poster',
    author: 'Unknown',
    authorId: 4,
    media: 'Offset print',
    mediaType: 'Poster',
    size: '800 × 1100 px',
    year: '1925',
    description: 'Placeholder entry with no known author. Dummy data for local testing.',
    width: 800,
    height: 1100,
    previewUrl: IMG('c/c3/Plakat_no_text.svg/400px-Plakat_no_text.svg.png'),
  },
];

/** Build a paged result over the mock items, honoring page/size. */
export function mockPagedItems(page = 0, size = 20): PagedResult<CatalogItem> {
  const start = page * size;
  const slice = MOCK_ITEMS.slice(start, start + size);
  return {
    items: slice,
    page,
    size,
    totalElements: MOCK_ITEMS.length,
    totalPages: Math.max(1, Math.ceil(MOCK_ITEMS.length / size)),
  };
}
