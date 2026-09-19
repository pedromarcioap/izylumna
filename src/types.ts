export type ExcessPolicy = 'block' | 'charge' | 'free_approval';

export type GalleryStatus = 'draft' | 'awaiting_client' | 'completed';

export type PrivacyType = 'public' | 'private';

export type UserRole = 'admin' | 'photographer_pro' | 'photographer' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password?: boolean;
  email_confirmed_at?: string | null;
  phone?: string | null;
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

export interface PhotoMetadata {
  camera?: string | null;
  lens?: string | null;
  f_stop?: string | null;
  shutter_speed?: string | null;
  iso?: string | null;
  focal_length?: string | null;
  taken_at?: string | null;
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
  rating?: number;
  isPicked?: boolean;
  cameraModel?: string;
  technicalDetails?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
  };
  metadata?: PhotoMetadata | null;
  votes?: PhotoVote[];
  commentsList?: PhotoCommentItem[];

  // Adobe Lightroom Cloud Integration Fields
  adobeAssetId?: string;
  adobeRenditionUrl?: string;
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
  ratingsMap?: Record<string, number>; // photoId -> star rating (0-5)
  voters?: GalleryVoter[]; // Active registered voters
}

export interface Gallery {
  id: string;
  userId?: string; // ID of the photographer/user who created this gallery
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

  // Adobe Lightroom Link
  adobeCatalogId?: string;
  adobeAlbumId?: string;

  // Collaborative Consensus Configuration
  predefinedVoters?: GalleryVoter[]; // Pre-defined roles ("Noiva", "Noivo", "Pai da Noiva")
  consensusThreshold?: number; // Minimum votes required for consensus (default 2)
  allowFreeVoterRegistration?: boolean; // Toggle if anyone with PIN can type their name
  voters?: GalleryVoter[]; // Active registered voters for this gallery

  // Quota and Excess Rules
  quotaIncluded: number; // Y photos included in the package
  maxContractedPhotos?: number; // Alias / contract max limit (default 20)
  excessPolicy: ExcessPolicy;
  extraPhotoPrice: number; // R$ per extra photo (used if excessPolicy === 'charge')
  galleryClosureFee?: number; // R$ 6.90 closure fee when client stays within quota
  platformCommissionRate?: number; // Platform split rate (default 0.08 / 8%)
  paymentStatus?: 'pending' | 'paid' | 'waived'; // Financial status of gallery

  // Protection & Display
  watermarkEnabled: boolean;
  watermarkText?: string;
  watermarkPosition?: 'grid' | 'center' | 'both' | 'bottom-right';
  watermarkOpacity?: number;

  // Photos
  photos: Photo[];

  // Client submission data
  clientSelection: ClientSelectionData;

  // Soft Delete / Trash Backup (approx 15 days retention)
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Payment & Order Financial Models (Supabase)
// ==========================================

export type PaymentStatus = 'pending' | 'paid' | 'waived';

export type OrderPayerType = 'client' | 'photographer';

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'canceled';

export type TransactionStatus = 'settled' | 'pending' | 'canceled' | 'failed';
export type PaymentMethod = 'pix' | 'manual' | 'credit_card' | 'bank_transfer';

export interface FinancialTransaction {
  id: string;
  galleryId?: string;
  galleryTitle: string;
  clientName: string;
  clientPhone: string;
  extraPhotosCount: number;
  amount: number;
  pixTxId: string;
  status: TransactionStatus;
  date: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  galleryId: string;
  payerType: OrderPayerType;
  totalAmount: number;
  platformFee: number;
  photographerAmount: number;
  externalId?: string;
  status: OrderStatus;
  pixCopyPaste?: string;
  pixQrCodeBase64?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookPaymentPayload {
  event: 'payment.approved' | 'payment.updated' | 'order.paid';
  orderId: string;
  externalId?: string;
  status: 'paid' | 'approved' | 'pending' | 'failed';
  totalAmount: number;
  paidAt?: string;
  signature?: string;
}

export interface NotificationPayload {
  recipientType: 'photographer' | 'client';
  recipientName: string;
  recipientContact: string; // Phone (WhatsApp) or Email
  channel: 'whatsapp' | 'email' | 'both';
  galleryTitle: string;
  orderId?: string;
  amount?: number;
  extraPhotosCount?: number;
  message?: string;
}

export interface ExportOptions {
  commaSeparated?: boolean;
  includeExtension?: boolean;
  filterByVoterId?: string;
  onlyConsensus?: boolean;
}

// ==========================================
// Adobe Lightroom Cloud Integration Models
// ==========================================

export interface PhotographerIntegration {
  id: string;
  user_id: string;
  provider: 'adobe';
  access_token: string;
  refresh_token: string;
  expires_at: string;
  catalog_id?: string | null;
  account_email?: string | null;
  account_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LightroomCatalog {
  id: string;
  type: string;
  created: string;
  updated: string;
  payload?: {
    name?: string;
  };
}

export interface LightroomAlbum {
  id: string;
  type: string;
  subtype?: string;
  serviceId?: string;
  created: string;
  updated: string;
  payload: {
    name: string;
    cover?: {
      id: string;
    };
  };
  assetCount?: number;
}

export interface LightroomAsset {
  id: string;
  type: string;
  subtype?: string;
  created: string;
  updated: string;
  payload: {
    captureDate?: string;
    importTimestamp?: string;
    fileName?: string;
    ratings?: Record<string, { rating: number }>;
    flags?: Record<string, { flag: 'pick' | 'unflagged' | 'reject' }>;
  };
  renditionUrl?: string;
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
  defaultWatermarkPosition?: 'grid' | 'center' | 'both' | 'bottom-right';
  defaultWatermarkOpacity?: number;
  defaultExtraPrice?: number;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
}

export interface PhotographerSession {
  isAuthenticated: boolean;
  token?: string;
  loginTime?: string;
  rememberMe?: boolean;
  profile: PhotographerProfile;
}
