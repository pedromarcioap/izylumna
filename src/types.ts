export type ExcessPolicy = 'block' | 'charge' | 'free_approval';

export type GalleryStatus = 'draft' | 'awaiting_client' | 'completed';

export type PrivacyType = 'public' | 'private';

export type UserRole = 'admin' | 'photographer' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface GalleryVoter {
  id: string;
  name: string;
  isDecisionMaker?: boolean; // Decision maker (e.g. Noiva/Noivo)
  hasFinalized?: boolean;
  finalizedAt?: string;
  avatarColor?: string;
}

export interface PhotoVote {
  voterId: string;
  voterName: string;
  createdAt: string;
}

export interface PhotoCommentItem {
  id: string;
  voterId: string;
  voterName: string;
  text: string;
  createdAt: string;
}

// Legacy format support
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
  isStarred?: boolean;
  votes?: PhotoVote[];
  commentsList?: PhotoCommentItem[];
}

export interface ClientSelectionData {
  id?: string;
  selectedPhotoIds: string[]; // Legacy compatibility array
  comments: Record<string, string>; // Legacy photoId -> text comment
  completedAt?: string;
  clientNotes?: string;
  totalExtraAmount?: number;
  status: 'pending' | 'submitted';

  // Collaborative Voting Extensions
  votes?: Record<string, PhotoVote[]>; // photoId -> list of votes
  commentsMap?: Record<string, PhotoCommentItem[]>; // photoId -> list of comments
  voters?: GalleryVoter[]; // Active registered voters
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

  // Collaborative Consensus Configuration
  predefinedVoters?: GalleryVoter[]; // Pre-defined roles ("Noiva", "Noivo", "Pai da Noiva")
  consensusThreshold?: number; // Minimum votes required for consensus (default 2)
  allowFreeVoterRegistration?: boolean; // Toggle if anyone with PIN can type their name
  voters?: GalleryVoter[]; // Active registered voters for this gallery

  // Quota and Excess Rules
  quotaIncluded: number; // Y photos included in the package
  excessPolicy: ExcessPolicy;
  extraPhotoPrice: number; // R$ per extra photo (used if excessPolicy === 'charge')

  // Protection & Display
  watermarkEnabled: boolean;
  watermarkText?: string;
  watermarkPosition?: 'grid' | 'center' | 'both' | 'bottom-right';
  watermarkOpacity?: number;

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
