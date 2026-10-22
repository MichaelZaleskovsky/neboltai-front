import type OpenSeadragon from 'openseadragon';

export interface CropTileSourceConfig {
  /** Full image width in original pixels. */
  width: number;
  /** Full image height in original pixels. */
  height: number;
  /** Rendered tile size in pixels (square). */
  tileSize?: number;
  /** Builds the crop URL for a region in ORIGINAL image pixels. */
  cropUrl: (region: { x: number; y: number; width: number; height: number; targetWidth: number }) => string;
}

/**
 * Builds an OpenSeadragon tile-source object backed by a server-side crop
 * endpoint (`/api/images/{identifier}/crop`). OpenSeadragon asks for tiles at
 * each pyramid level; each tile maps to a crop of a region in original pixels,
 * scaled to the rendered tile size. This yields true deep zoom with only the
 * visible region loaded at each zoom level.
 */
export function buildCropTileSource(
  OpenSeadragonCtor: typeof OpenSeadragon,
  config: CropTileSourceConfig,
): OpenSeadragon.TileSourceOptions {
  const tileSize = config.tileSize ?? 256;
  const { width, height, cropUrl } = config;

  // Number of pyramid levels: enough that level 0 is a single tile.
  const maxDimension = Math.max(width, height);
  const levelCount = Math.ceil(Math.log2(maxDimension)) + 1;

  return {
    width,
    height,
    tileSize,
    tileOverlap: 0,
    minLevel: 0,
    maxLevel: levelCount - 1,

    // Scale factor from a given level up to the full-resolution image.
    // At maxLevel the scale is 1 (full res); each level down halves resolution.
    getLevelScale(this: OpenSeadragon.TileSource, level: number): number {
      return Math.pow(0.5, this.maxLevel - level);
    },

    getNumTiles(this: OpenSeadragon.TileSource, level: number) {
      const scale = this.getLevelScale(level);
      const levelWidth = Math.ceil(width * scale);
      const levelHeight = Math.ceil(height * scale);
      return new OpenSeadragonCtor.Point(
        Math.ceil(levelWidth / tileSize),
        Math.ceil(levelHeight / tileSize),
      );
    },

    // Map a tile (level, x, y) to a crop URL. The region is computed in
    // ORIGINAL pixels; targetWidth is the rendered tile width at this level.
    getTileUrl(this: OpenSeadragon.TileSource, level: number, x: number, y: number): string {
      const scale = this.getLevelScale(level);

      // Tile size in original pixels at this level.
      const tileInOriginal = tileSize / scale;

      const regionX = Math.round(x * tileInOriginal);
      const regionY = Math.round(y * tileInOriginal);
      const regionW = Math.round(Math.min(tileInOriginal, width - regionX));
      const regionH = Math.round(Math.min(tileInOriginal, height - regionY));

      // The rendered (target) width for this crop: the region scaled down to
      // this level's resolution, capped at the tile size.
      const targetWidth = Math.max(1, Math.round(regionW * scale));

      return cropUrl({
        x: regionX,
        y: regionY,
        width: regionW,
        height: regionH,
        targetWidth,
      });
    },
  } as OpenSeadragon.TileSourceOptions;
}
