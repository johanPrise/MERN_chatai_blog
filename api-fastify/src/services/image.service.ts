import sharp from 'sharp';
import path from 'node:path';

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  suffix?: string;
}

class ImageService {
  private  readonly uploadsDir = path.join(process.cwd(), 'uploads');

  async validateImage(inputBuffer: Buffer): Promise<'jpg' | 'png' | 'webp'> {
    const metadata = await sharp(inputBuffer).metadata();

    switch (metadata.format) {
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        throw new Error('Format d\'image non autorisé');
    }
  }

  async optimizeImage(
    inputBuffer: Buffer,
    filename: string,
    options: ImageOptions = {}
  ): Promise<string> {
    const { width = 800, height, quality = 80, format = 'webp', suffix = 'opt' } = options;
    
    const ext = format === 'jpeg' ? 'jpg' : format;
    const optimizedFilename = `${path.parse(filename).name}-${suffix}.${ext}`;
    const outputPath = path.join(this.uploadsDir, optimizedFilename);

    let pipeline = sharp(inputBuffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      });
    }

    // Apply format and quality
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(outputPath);
    return optimizedFilename;
  }

  async createThumbnail(inputBuffer: Buffer, filename: string): Promise<string> {
    return this.optimizeImage(inputBuffer, filename, {
      width: 300,
      height: 200,
      quality: 70,
      format: 'webp',
      suffix: 'thumb'
    });
  }
}

export const imageService = new ImageService();
