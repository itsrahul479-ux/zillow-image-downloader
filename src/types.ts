export interface ListingImage {
  url: string;
  filename: string;
  width: number;
  height: number;
}

export interface ExtractionResponse {
  success: boolean;
  address: string;
  images: ListingImage[];
  isDemoMode: boolean;
  message?: string;
}

export interface RecentExtraction {
  url: string;
  address: string;
  imageCount: number;
  timestamp: number;
}
