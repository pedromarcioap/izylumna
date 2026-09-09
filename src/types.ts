export type ExcessPolicy = 'block' | 'charge' | 'free_approval';

export type GalleryStatus = 'draft' | 'awaiting_client' | 'completed';

export type PrivacyType = 'public' | 'private';

export interface PhotoComment {
  photoId: string;
  comment: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  originalFileName: string; // e.g., "IMG_4021.CR3", "DSC_0092.JPG"
  url: string;
  width?: number;
  height?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  caption?: string;
}

export interface ClientSelectionData {
  selectedPhotoIds: string[];
  comments: Record<string, string>; // photoId -> comment
  completedAt?: string;
  clientNotes?: string;
  totalExtraAmount?: number;
  status: 'pending' | 'submitted';
}

export interface Gallery {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  eventDate: string;
  description: string;
  coverPhotoUrl: string;
  status: GalleryStatus;
  privacy: PrivacyType;
  pinCode?: string; // 4 to 6 digits if private
  
  // Quota and Excess Rules
  quotaIncluded: number; // Y photos included in the package
  excessPolicy: ExcessPolicy;
  extraPhotoPrice: number; // R$ per extra photo (used if excessPolicy === 'charge')
  
  // Protection & Display
  watermarkEnabled: boolean;
  watermarkText?: string;
  
  // Photos
  photos: Photo[];
  
  // Client submission data
  clientSelection: ClientSelectionData;
  
  createdAt: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

export interface PhotographerProfile {
  id: string;
  name: string;
  email: string;
  studioName: string;
  phone?: string;
  avatarUrl?: string;
  defaultWatermarkText?: string;
  defaultExtraPrice?: number;
}

export interface PhotographerSession {
  isAuthenticated: boolean;
  token?: string;
  loginTime?: string;
  rememberMe?: boolean;
  profile: PhotographerProfile;
}
