export interface InventoryTransaction {
  id: string;
  date: string;
  sku: string;
  productName: string;
  variant: string;
  type: string;
  quantity: string; // e.g. '+20', '-5'
  beforeStock: number;
  stockAfter: number;
  location: string;
  destLocation?: string;
  creator: string;
  reference: string;
  status: string;
  reason: string;
}

const defaultHistory: InventoryTransaction[] = [
  {
    id: 'INV-20260901-001',
    date: '01/09/2026 08:42',
    sku: 'SF-LUNA-03',
    productName: 'Sofa Luna',
    variant: 'Nâu - Chân gỗ',
    type: 'Xuất kho',
    quantity: '-2',
    beforeStock: 15,
    stockAfter: 13,
    location: 'Showroom Thủ Đức',
    creator: 'Nguyễn Văn A',
    reference: '#ORD-00125',
    status: 'Đã hoàn tất',
    reason: 'Xuất kho phục vụ đơn hàng #ORD-00125.'
  },
  {
    id: 'INV-20260901-002',
    date: '01/09/2026 09:15',
    sku: 'BA-IND-WAL',
    productName: 'Bàn ăn Indochine',
    variant: 'Gỗ óc chó - 1m6',
    type: 'Chuyển kho',
    quantity: '-1',
    beforeStock: 5,
    stockAfter: 4,
    location: 'Showroom Thủ Đức',
    destLocation: 'Showroom Quận 1',
    creator: 'Lê Văn C',
    reference: '#TR-0099',
    status: 'Đang xử lý',
    reason: 'Chuyển hàng bổ sung trưng bày chi nhánh Q1.'
  },
  {
    id: 'INV-20260830-005',
    date: '30/08/2026 15:45',
    sku: 'GL-SCA-GRY',
    productName: 'Ghế lười Scandi Minimalist',
    variant: 'Xám sáng',
    type: 'Điều chỉnh giảm',
    quantity: '-2',
    beforeStock: 12,
    stockAfter: 10,
    location: 'Kho Hà Nội',
    creator: 'Admin',
    reference: '#AUD-005',
    status: 'Đã hoàn tất',
    reason: 'Kiểm kê thực tế phát hiện thiếu 2 sản phẩm.'
  },
  {
    id: 'INV-20260829-011',
    date: '29/08/2026 10:30',
    sku: 'SF-OSA-3-BRW',
    productName: 'Sofa Da Bò Osaka (Băng 3)',
    variant: 'Đen - Chân sắt',
    type: 'Nhập kho',
    quantity: '+20',
    beforeStock: 5,
    stockAfter: 25,
    location: 'Kho Tổng (TP.HCM)',
    creator: 'Trần Văn A',
    reference: '#PO-2026-08',
    status: 'Đã hoàn tất',
    reason: 'Nhập lô hàng đợt 2 tháng 8 từ NSX.'
  }
];

export const getInventoryHistory = (): InventoryTransaction[] => {
  if (typeof window === 'undefined') return defaultHistory;
  const stored = localStorage.getItem('inventoryHistory');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
      return defaultHistory;
    }
  }
  // Initialize if empty
  localStorage.setItem('inventoryHistory', JSON.stringify(defaultHistory));
  return defaultHistory;
};

export const addInventoryTransaction = (tx: Partial<InventoryTransaction>) => {
  if (typeof window === 'undefined') return;
  const history = getInventoryHistory();
  
  // Create a new record based on current time
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Format ID: INV-YYYYMMDD-XXX
  const randomNum = Math.floor(Math.random() * 900) + 100;
  const idStr = `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${randomNum}`;
  
  const newTx: InventoryTransaction = {
    id: idStr,
    date: dateStr,
    sku: tx.sku || 'SKU-NEW',
    productName: tx.productName || 'Sản phẩm mới',
    variant: tx.variant || 'Mặc định',
    type: tx.type || 'Nhập kho',
    quantity: tx.quantity || '+0',
    beforeStock: tx.beforeStock || 0,
    stockAfter: tx.stockAfter || 0,
    location: tx.location || 'Kho Tổng',
    destLocation: tx.destLocation,
    creator: tx.creator || 'Admin Hiện tại',
    reference: tx.reference || '#AUTO-GEN',
    status: tx.status || 'Đã hoàn tất',
    reason: tx.reason || 'Tạo tự động từ form.'
  };

  const newHistory = [newTx, ...history];
  localStorage.setItem('inventoryHistory', JSON.stringify(newHistory));
  return newTx;
};
