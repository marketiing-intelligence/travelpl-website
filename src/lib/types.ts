export interface Trip {
  slug: string;
  name: string;
  fullName: string;
  type: 'wczasy' | 'wycieczka';
  region: 'morze' | 'gory' | 'miasto' | 'zagranica';
  dates: string;
  duration: string;
  price: number;
  image: string;
  beachDistance?: string;
  shortDescription: string;
  fullDescription: string;
  included: string[];
  notIncluded?: string[];
  highlights: string[];
  itinerary?: string[];
  program?: string[];
  specialAttractions?: string[];
  importantInfo?: string;
  badge?: string;
  urgencyBadge?: string;
  featured?: boolean;
}
