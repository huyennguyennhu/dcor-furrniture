export interface RoomDimensions {
  length: number; // Chiều dài (cạnh ngang của ảnh, m) - 1..30m
  width: number;  // Chiều rộng (cạnh dọc của ảnh, m) - 1..30m
  height?: number; // Chiều cao phòng (tùy chọn, m) - 1..30m
}

export interface PlannerBackground {
  type: 'template' | 'upload';
  name: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  templateId?: string;
  file?: File;
}

export interface RoomTemplate {
  id: string;
  name: string;
  roomType: string;
  description: string;
  imageUrl: string;
  defaultDimensions: RoomDimensions;
}

export interface PlannerObject {
  id: string;
  productId: string;
  variantId?: string;
  productSlug?: string;
  name: string;
  category: string;
  imageUrl: string;
  unitPrice: number;
  // Vị trí trên mặt phẳng phòng (tính bằng pixel thực của nền phòng)
  x: number;
  y: number;
  width: number;  // pixel hiển thị trên canvas
  height: number; // pixel hiển thị trên canvas
  rotation: number; // Góc xoay (độ, 0 - 360)
  zIndex: number;
  isLocked: boolean;
  dimensionCm: {
    width: number;
    depth: number;
    height?: number;
  };
  isEstimatedDimension: boolean;
  selectedColor?: string;
}

export interface PlannerDesign {
  id?: string;
  title: string;
  background: PlannerBackground;
  dimensions: RoomDimensions;
  objects: PlannerObject[];
  layoutCount?: number;
  thumbnailUrl?: string;
  zoom?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignRepository {
  saveDraft(design: PlannerDesign): Promise<string>;
  loadDraft(id: string): Promise<PlannerDesign | null>;
  listDrafts(): Promise<PlannerDesign[]>;
  renameDraft?(id: string, newTitle: string): Promise<boolean>;
  deleteDraft(id: string): Promise<boolean>;
}
