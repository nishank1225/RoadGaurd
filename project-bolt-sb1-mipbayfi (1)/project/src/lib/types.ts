export type Role = 'user' | 'admin';
export type DamageType = 'pothole' | 'crack' | 'surface_wear' | 'road_depression' | 'broken_edge' | 'water_damage';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus =
  | 'submitted' | 'pending' | 'under_review' | 'approved' | 'rejected'
  | 'maintenance_assigned' | 'in_progress' | 'completed' | 'closed';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface BoundingBox {
  x: number; y: number; width: number; height: number; label: DamageType; confidence: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  image_url: string;
  damage_type: DamageType;
  severity: Severity;
  confidence: number;
  road_health_score: number;
  prediction_time_ms: number;
  bounding_boxes: BoundingBox[];
  latitude: number | null;
  longitude: number | null;
  location_text: string;
  status: ReportStatus;
  admin_remarks: string;
  priority: Priority;
  verified_by: string | null;
  verified_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  reporter?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  report_id: string | null;
  read: boolean;
  created_at: string;
}

export interface DetectionResult {
  damage_type: DamageType;
  severity: Severity;
  confidence: number;
  road_health_score: number;
  prediction_time_ms: number;
  bounding_boxes: BoundingBox[];
}

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'crack', label: 'Crack' },
  { value: 'surface_wear', label: 'Surface Wear' },
  { value: 'road_depression', label: 'Road Depression' },
  { value: 'broken_edge', label: 'Broken Edge' },
  { value: 'water_damage', label: 'Water Damage' },
];

export const DAMAGE_TYPE_LABEL: Record<DamageType, string> = {
  pothole: 'Pothole',
  crack: 'Crack',
  surface_wear: 'Surface Wear',
  road_depression: 'Road Depression',
  broken_edge: 'Broken Edge',
  water_damage: 'Water Damage',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

export const STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: 'Submitted', pending: 'Pending', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', maintenance_assigned: 'Maintenance Assigned',
  in_progress: 'In Progress', completed: 'Completed', closed: 'Closed',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
};
