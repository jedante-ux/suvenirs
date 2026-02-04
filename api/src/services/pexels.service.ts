import { env } from '../config/env.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

class PexelsService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor() {
    this.apiKey = env.PEXELS_API_KEY || '';
  }

  /**
   * Buscar fotos en Pexels
   */
  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 15
  ): Promise<PexelsSearchResponse | null> {
    if (!this.apiKey) {
      console.warn('Pexels API key not configured');
      return null;
    }

    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

      const response = await fetch(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json() as PexelsSearchResponse;
      return data;
    } catch (error) {
      console.error('Error fetching photos from Pexels:', error);
      return null;
    }
  }

  /**
   * Obtener foto por ID
   */
  async getPhoto(photoId: number): Promise<PexelsPhoto | null> {
    if (!this.apiKey) {
      console.warn('Pexels API key not configured');
      return null;
    }

    try {
      const url = `${this.baseUrl}/photos/${photoId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json() as PexelsPhoto;
      return data;
    } catch (error) {
      console.error('Error fetching photo from Pexels:', error);
      return null;
    }
  }

  /**
   * Obtener fotos curadas (seleccionadas por Pexels)
   */
  async getCuratedPhotos(
    page: number = 1,
    perPage: number = 15
  ): Promise<PexelsSearchResponse | null> {
    if (!this.apiKey) {
      console.warn('Pexels API key not configured');
      return null;
    }

    try {
      const url = `${this.baseUrl}/curated?page=${page}&per_page=${perPage}`;

      const response = await fetch(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json() as PexelsSearchResponse;
      return data;
    } catch (error) {
      console.error('Error fetching curated photos from Pexels:', error);
      return null;
    }
  }

  /**
   * Obtener URL de imagen en tamaño específico
   */
  getImageUrl(photo: PexelsPhoto, size: keyof PexelsPhoto['src'] = 'medium'): string {
    return photo.src[size];
  }
}

export const pexelsService = new PexelsService();
