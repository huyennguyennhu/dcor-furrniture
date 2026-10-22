import fs from 'fs';
import path from 'path';

export interface StaffMetadata {
  roles: string[];
  role: string;
  branchId: string;
  branchName: string;
  assignedBranches?: string[];
  customPermissions?: any;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const METADATA_FILE = path.join(DATA_DIR, 'staff-metadata.json');

let inMemoryMetadata: Record<string, StaffMetadata> | null = null;

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(METADATA_FILE)) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Lỗi khởi tạo file staff-metadata.json:', e);
  }
}

export function getAllStaffMetadata(): Record<string, StaffMetadata> {
  if (inMemoryMetadata !== null) {
    return inMemoryMetadata;
  }
  ensureDataFile();
  try {
    const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
    inMemoryMetadata = JSON.parse(raw);
    return inMemoryMetadata || {};
  } catch (e) {
    inMemoryMetadata = {};
    return inMemoryMetadata;
  }
}

export function getStaffMetadata(key: string): StaffMetadata | null {
  if (!key) return null;
  const all = getAllStaffMetadata();
  const lower = key.trim().toLowerCase();
  return all[lower] || all[key] || null;
}

export function setStaffMetadata(emailOrId: string, data: Partial<StaffMetadata>): void {
  try {
    const all = getAllStaffMetadata();
    const key = emailOrId.trim().toLowerCase();
    const existing = all[key] || {
      roles: ['Sales'],
      role: 'Sales',
      branchId: 'ALL',
      branchName: 'Toàn hệ thống',
      assignedBranches: ['ALL']
    };

    all[key] = {
      ...existing,
      ...data,
      roles: data.roles || existing.roles,
      role: data.role || (data.roles ? data.roles[0] : existing.role)
    };

    inMemoryMetadata = all;
    ensureDataFile();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Lỗi lưu staff metadata:', e);
  }
}

export function deleteStaffMetadata(emailOrId: string): void {
  try {
    const all = getAllStaffMetadata();
    const key = emailOrId.trim().toLowerCase();
    delete all[key];
    delete all[emailOrId];
    inMemoryMetadata = all;
    ensureDataFile();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Lỗi xóa staff metadata:', e);
  }
}
