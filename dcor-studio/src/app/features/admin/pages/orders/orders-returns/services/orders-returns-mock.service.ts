import { Injectable } from '@angular/core';

export type ReturnStatus = 
  | 'PENDING' 
  | 'REVIEWING' 
  | 'REJECTED' 
  | 'APPROVED' 
  | 'RETURNING' 
  | 'RECEIVED' 
  | 'REFUNDING' 
  | 'EXCHANGING' 
  | 'COMPLETED';

export type ReturnType = 'EXCHANGE' | 'REFUND';

export interface ReturnItemInfo {
  name: string;
  sku: string;
  variant: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface ReturnCustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface ReturnQcChecklist {
  surfaceChecked: boolean;
  structureChecked: boolean;
  cushionLeatherChecked: boolean;
  accessoriesChecked: boolean;
  condition: string;
  defectAssessment: string;
  refundPercent: number;
  restockOption: 'RESTOCK_SALE' | 'REFURBISH' | 'SCRAP';
  inspector: string;
}

export interface ReturnTimelineEvent {
  time: string;
  status: string;
  actor: string;
  desc: string;
}

export interface ReturnPickupDispatch {
  provider: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  movingTeam: string;
  trackingCode: string;
  estimatedTime: string;
  dispatchNote?: string;
  currentLeg?: 1 | 2 | 3 | 4;
  currentLocation?: string;
}

export interface ReturnReplacementOrder {
  orderNumber: string;
  createdAt: string;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  item: ReturnItemInfo;
  priceDiff: number;
  deliveryAddress: string;
}

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderId: string;
  createdAt: string;
  customer: ReturnCustomerInfo;
  item: ReturnItemInfo;
  type: ReturnType;
  reason: string;
  customerNote: string;
  proofImages: string[];
  status: ReturnStatus;
  stage: 1 | 2 | 3 | 4;
  assignee: string;
  exchangeItem?: {
    name: string;
    sku: string;
    variant: string;
    price: number;
    priceDiff: number; // >0 khách bù thêm, <0 hoàn lại phần dư
    imageUrl: string;
  };
  refundInfo?: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    refundAmount: number;
    txRef?: string;
  };
  pickupInfo?: ReturnPickupDispatch;
  replacementOrder?: ReturnReplacementOrder;
  qcReport?: ReturnQcChecklist;
  timeline: ReturnTimelineEvent[];
}

export const INITIAL_MOCK_RETURNS: ReturnRequest[] = [
  {
    id: 'RET-20261021-001',
    orderNumber: 'DCOR-ORD-1008',
    orderId: 'ORD-20261014-1008',
    createdAt: '21/10/2026 08:30',
    customer: {
      name: 'Nguyễn Văn An',
      phone: '0912 345 678',
      email: 'an.nguyen@gmail.com',
      address: 'Biệt thự B12, Khu đô thị Sala, P. An Lợi Đông, TP. Thủ Đức, TP.HCM'
    },
    item: {
      name: 'Salamanca 3 seater lounge sofa',
      sku: 'SKU-SAL-3S-LUX',
      variant: 'Tiêu chuẩn / Vải nỉ xám xi măng',
      quantity: 1,
      price: 32500000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400898/dcor/products/dcor_products_64b4f3319263ff6db7c03d740f513353.webp'
    },
    type: 'EXCHANGE',
    reason: 'Sai màu sắc so với ảnh 3D phòng khách',
    customerNote: 'Sofa nhận thực tế màu xám sáng hơn so với phối cảnh 3D nội thất, muốn đổi sang phiên bản Vải nỉ nâu trầm cao cấp.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400898/dcor/products/dcor_products_64b4f3319263ff6db7c03d740f513353.webp',
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400899/dcor/products/dcor_products_0f4553531b740523e10faee5876615b3.webp'
    ],
    status: 'PENDING',
    stage: 1,
    assignee: 'CSKH Kim Ngân',
    exchangeItem: {
      name: 'Salamanca 3 seater lounge sofa - Bản da nỉ cao cấp',
      sku: 'SKU-SAL-3S-BROWN',
      variant: 'Nâu trầm Walnut Luxury',
      price: 35000000,
      priceDiff: 2500000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400899/dcor/products/dcor_products_0f4553531b740523e10faee5876615b3.webp'
    },
    timeline: [
      { time: '21/10/2026 08:30', status: 'PENDING', actor: 'Khách hàng', desc: 'Gửi yêu cầu đổi hàng qua App DCOR Studio kèm 2 hình ảnh chụp sofa tại phòng khách.' }
    ]
  },
  {
    id: 'RET-20261021-002',
    orderNumber: 'DCOR-ORD-1007',
    orderId: 'ORD-20261012-1007',
    createdAt: '21/10/2026 07:15',
    customer: {
      name: 'Trần Thị Mai',
      phone: '0988 776 554',
      email: 'mai.tran@dcor.vn',
      address: 'Căn hộ 15.02, Tháp Aqua 1, Vinhomes Golden River, Bến Nghé, Quận 1, TP.HCM'
    },
    item: {
      name: 'Ghế xoay thư giãn Imola da Cognac',
      sku: 'SKU-IMOLA-COG-01',
      variant: 'Chân thép xoay mạ Chrome',
      quantity: 1,
      price: 18900000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400900/dcor/products/dcor_products_feff2d6409600a72c1c69c5e53308d74.webp'
    },
    type: 'REFUND',
    reason: 'Trầy xước da mặt sau khi bốc xếp lên chung cư',
    customerNote: 'Tài xế giao hàng va quẹt cửa thang máy làm rách 1 đường nhỏ mặt sau lưng ghế.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400900/dcor/products/dcor_products_feff2d6409600a72c1c69c5e53308d74.webp'
    ],
    status: 'REVIEWING',
    stage: 1,
    assignee: 'CSKH Minh Phúc',
    refundInfo: {
      bank: 'Vietcombank',
      accountNumber: '0071001234567',
      accountHolder: 'TRAN THI MAI',
      refundAmount: 18900000
    },
    timeline: [
      { time: '21/10/2026 07:15', status: 'PENDING', actor: 'Khách hàng', desc: 'Khách gửi yêu cầu trả hàng do lỗi vận chuyển trầy da.' },
      { time: '21/10/2026 08:00', status: 'REVIEWING', actor: 'CSKH Minh Phúc', desc: 'CSKH đã liên hệ xác nhận lỗi với tài xế và gọi cho khách hàng để lập biên bản thu hồi.' }
    ]
  },
  {
    id: 'RET-20261020-003',
    orderNumber: 'DCOR-ORD-1005',
    orderId: 'ORD-20261010-1005',
    createdAt: '20/10/2026 14:20',
    customer: {
      name: 'Lê Hoàng Long',
      phone: '0903 112 233',
      email: 'long.le@gmail.com',
      address: 'Số 45 Đường số 7, KDC Cityland Park Hills, P.10, Gò Vấp, TP.HCM'
    },
    item: {
      name: 'Bàn ăn mở rộng Kingston gỗ sồi tự nhiên',
      sku: 'SKU-KINGSTON-EXT',
      variant: 'Gỗ sồi Bắc Âu sấy mộc',
      quantity: 1,
      price: 24500000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400901/dcor/products/dcor_products_5f190e22709e30a514d0f62299a9a3b6.webp'
    },
    type: 'EXCHANGE',
    reason: 'Không vừa kích thước phòng ăn gia đình',
    customerNote: 'Bàn mở rộng 2m4 khi mở ra bị cấn lối đi ban công, xin đổi sang mẫu bàn tròn Roma đường kính 1m35.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400901/dcor/products/dcor_products_5f190e22709e30a514d0f62299a9a3b6.webp'
    ],
    status: 'APPROVED',
    stage: 2,
    assignee: 'CSKH Kim Ngân',
    exchangeItem: {
      name: 'Bàn ăn tròn Roma mặt đá cẩm thạch Ý',
      sku: 'SKU-ROMA-ROUND-135',
      variant: 'Đá trắng Volakas / Chân gỗ Ash',
      price: 22000000,
      priceDiff: -2500000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400902/dcor/products/dcor_products_c6c4c9b9101662fb16a18274719bb807.webp'
    },
    pickupInfo: {
      provider: 'DCOR Express Đội xe chuyên dụng',
      driverName: 'Phạm Quốc Cường',
      driverPhone: '0909 333 444',
      vehiclePlate: '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)',
      movingTeam: 'Đội bốc xếp 1 (2 thợ khiêng lầu)',
      trackingCode: 'DCOR-TRK-7712',
      estimatedTime: '21/10/2026 14:00 - 16:00',
      dispatchNote: 'Chuẩn bị màng xốp bọc bảo vệ mặt gỗ sồi và cờ lê tháo chân bàn',
      currentLeg: 1,
      currentLocation: 'Kho trung tâm DCOR (Bình Tân)'
    },
    timeline: [
      { time: '20/10/2026 14:20', status: 'PENDING', actor: 'Khách hàng', desc: 'Yêu cầu đổi kích thước bàn ăn.' },
      { time: '20/10/2026 15:10', status: 'REVIEWING', actor: 'CSKH Kim Ngân', desc: 'Tư vấn đổi sang bàn tròn Roma và khách đã đồng ý phương án hoàn lại 2.500.000 đ tiền dư.' },
      { time: '20/10/2026 16:00', status: 'APPROVED', actor: 'CSKH Trưởng phòng', desc: 'Duyệt lệnh đổi trả và tạo yêu cầu điều phối xe tải thu hồi.' }
    ]
  },
  {
    id: 'RET-20261019-004',
    orderNumber: 'DCOR-ORD-1002',
    orderId: 'ORD-20261008-1002',
    createdAt: '19/10/2026 10:15',
    customer: {
      name: 'Phạm Thu Hương',
      phone: '0938 999 111',
      email: 'huong.pham@vietjet.vn',
      address: 'Penthouse P02, Chung cư Gateway Thảo Điền, TP. Thủ Đức, TP.HCM'
    },
    item: {
      name: 'Kệ tivi Fermo mặt kính đen mờ',
      sku: 'SKU-FERMO-TV-02',
      variant: 'Kính mờ xám khói / Dài 2m2',
      quantity: 1,
      price: 16200000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400902/dcor/products/dcor_products_c6c4c9b9101662fb16a18274719bb807.webp'
    },
    type: 'REFUND',
    reason: 'Lỗi kỹ thuật bản lề cánh mở bị kẹt',
    customerNote: 'Bản lề thủy lực bên trái không đóng kín được, gây cấn cửa kính.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400902/dcor/products/dcor_products_c6c4c9b9101662fb16a18274719bb807.webp'
    ],
    status: 'RETURNING',
    stage: 2,
    assignee: 'Kỹ thuật viên Trịnh Văn Bách',
    refundInfo: {
      bank: 'Techcombank',
      accountNumber: '19034567890012',
      accountHolder: 'PHAM THU HUONG',
      refundAmount: 16200000
    },
    pickupInfo: {
      provider: 'DCOR Express Logistics',
      driverName: 'Đỗ Văn Thành',
      driverPhone: '0918 222 333',
      vehiclePlate: '51C-645.18 (Xe tải 2.5 tấn thùng kín)',
      movingTeam: 'Đội phản ứng nhanh DCOR Express (Tài xế + Phụ xe)',
      trackingCode: 'DCOR-TRK-8801',
      estimatedTime: '21/10/2026 11:30',
      dispatchNote: 'Tháo dỡ bản lề kính cẩn thận, dán băng keo niêm phong cửa tủ',
      currentLeg: 2,
      currentLocation: 'Đường Nguyễn Hữu Thọ, P. Tân Hưng, Quận 7'
    },
    timeline: [
      { time: '19/10/2026 10:15', status: 'PENDING', actor: 'Khách hàng', desc: 'Gửi video bản lề kẹt.' },
      { time: '19/10/2026 11:00', status: 'REVIEWING', actor: 'KTV Trịnh Văn Bách', desc: 'Xác nhận lỗi van giảm chấn thủy lực từ xưởng sản xuất.' },
      { time: '19/10/2026 14:00', status: 'APPROVED', actor: 'Trưởng bộ phận QC', desc: 'Chấp thuận thu hồi và hoàn tiền 100% cho khách.' },
      { time: '21/10/2026 09:00', status: 'RETURNING', actor: 'Tài xế Đỗ Văn Thành', desc: 'Đã nhận lệnh xe và đang trên đường đến Gateway Thảo Điền thu hồi kiện hàng.' }
    ]
  },
  {
    id: 'RET-20261018-005',
    orderNumber: 'DCOR-ORD-0998',
    orderId: 'ORD-20261005-0998',
    createdAt: '18/10/2026 16:45',
    customer: {
      name: 'Vũ Đức Thịnh',
      phone: '0977 445 667',
      email: 'thinh.vu@fpt.com',
      address: 'Số 12 Nhà vườn SimCity, Đường Lò Lu, P. Trường Thạnh, TP. Thủ Đức'
    },
    item: {
      name: 'Giường ngủ Modena bọc da bò Ý cao cấp',
      sku: 'SKU-MODENA-BED-18',
      variant: '1m8 x 2m / Da Nappa Kem Vanilla',
      quantity: 1,
      price: 28900000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400903/dcor/products/dcor_products_67a216eefd2089b2518eec4ff5be3c09.webp'
    },
    type: 'REFUND',
    reason: 'Lỗi đường may và da bị chùng nếp đầu giường',
    customerNote: 'Gia đình kiểm tra thấy đường may mép trái bị lệch 1.5cm và da đầu giường không căng đều.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400903/dcor/products/dcor_products_67a216eefd2089b2518eec4ff5be3c09.webp'
    ],
    status: 'RECEIVED',
    stage: 2,
    assignee: 'Thủ kho Hoàng Sơn',
    refundInfo: {
      bank: 'MB Bank',
      accountNumber: '0977445667',
      accountHolder: 'VU DUC THINH',
      refundAmount: 28900000
    },
    pickupInfo: {
      provider: 'DCOR Express',
      driverName: 'Lê Văn Hiền',
      driverPhone: '0908 555 777',
      vehiclePlate: '51D-901.22 (Xe tải 1.5 tấn)',
      movingTeam: 'Đội bốc xếp 2 (2 nhân sự)',
      trackingCode: 'DCOR-TRK-7650',
      estimatedTime: '20/10/2026 15:30',
      dispatchNote: 'Kiểm tra khớp mộng dát giường trước khi đưa lên xe',
      currentLeg: 4,
      currentLocation: 'Trung tâm phân phối & QC DCOR Bình Tân'
    },
    qcReport: {
      surfaceChecked: true,
      structureChecked: true,
      cushionLeatherChecked: false,
      accessoriesChecked: true,
      condition: 'Khung dát giường nguyên vẹn, da đầu giường đúng bị lỗi căng mút tại xưởng.',
      defectAssessment: 'Lỗi công đoạn may bọc tại xưởng sofa DCOR.',
      refundPercent: 100,
      restockOption: 'REFURBISH',
      inspector: 'KTV Trịnh Văn Bách'
    },
    timeline: [
      { time: '18/10/2026 16:45', status: 'PENDING', actor: 'Khách hàng', desc: 'Báo lỗi da chùng.' },
      { time: '19/10/2026 09:30', status: 'APPROVED', actor: 'CSKH', desc: 'Duyệt thu hồi về kho kiểm định.' },
      { time: '20/10/2026 15:30', status: 'RETURNING', actor: 'Đội xe', desc: 'Đã lấy giường tại SimCity.' },
      { time: '20/10/2026 17:15', status: 'RECEIVED', actor: 'Thủ kho Hoàng Sơn', desc: 'Kho Bình Tân đã tiếp nhận kiện giường, đưa vào khu vực QC kiểm định.' }
    ]
  },
  {
    id: 'RET-20261017-006',
    orderNumber: 'DCOR-ORD-0994',
    orderId: 'ORD-20261002-0994',
    createdAt: '17/10/2026 11:20',
    customer: {
      name: 'Đặng Ngọc Trâm',
      phone: '0945 678 999',
      email: 'tram.dang@vinamilk.com.vn',
      address: 'Villa A05, Khu Compound Riviera Point, Huỳnh Tấn Phát, Quận 7, TP.HCM'
    },
    item: {
      name: 'Đèn sàn Kizu đá cẩm thạch trắng tự nhiên',
      sku: 'SKU-KIZU-FL',
      variant: 'Đá Marble Calacatta / Chao thủy tinh Opal',
      quantity: 1,
      price: 8500000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_334547c1ebef399ef7fa480b0c25a075.webp'
    },
    type: 'REFUND',
    reason: 'Lỗi công tắc cảm ứng và biến tần chập chờn',
    customerNote: 'Đèn chạm bật nhưng 5 phút là tự tắt, ánh sáng bị chớp giật.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_334547c1ebef399ef7fa480b0c25a075.webp'
    ],
    status: 'REFUNDING',
    stage: 3,
    assignee: 'Kế toán Bích Ngọc',
    refundInfo: {
      bank: 'ACB - Á Châu',
      accountNumber: '284918239',
      accountHolder: 'DANG NGOC TRAM',
      refundAmount: 8500000,
      txRef: 'UNC-20261021-0091'
    },
    qcReport: {
      surfaceChecked: true,
      structureChecked: true,
      cushionLeatherChecked: true,
      accessoriesChecked: true,
      condition: 'Ngoại quan chân đá đẹp 100%, lỗi mạch nguồn Driver LED.',
      defectAssessment: 'Lỗi linh kiện điện tử bo mạch nhập khẩu.',
      refundPercent: 100,
      restockOption: 'REFURBISH',
      inspector: 'KTV Trịnh Văn Bách'
    },
    timeline: [
      { time: '17/10/2026 11:20', status: 'PENDING', actor: 'Khách hàng', desc: 'Báo lỗi đèn tự tắt.' },
      { time: '18/10/2026 14:00', status: 'APPROVED', actor: 'CSKH', desc: 'Chấp thuận thu hồi hoàn tiền.' },
      { time: '19/10/2026 10:00', status: 'RECEIVED', actor: 'Kho', desc: 'Đã nhận tại kho trung tâm.' },
      { time: '20/10/2026 16:30', status: 'REFUNDING', actor: 'Kế toán Bích Ngọc', desc: 'Lập ủy nhiệm chi hoàn tiền 8.500.000 đ, lệnh chuyển khoản đang được Kế toán trưởng phê duyệt.' }
    ]
  },
  {
    id: 'RET-20261016-007',
    orderNumber: 'DCOR-ORD-0991',
    orderId: 'ORD-20260930-0991',
    createdAt: '16/10/2026 09:10',
    customer: {
      name: 'Hoàng Minh Tuấn',
      phone: '0908 123 789',
      email: 'tuan.hoang@gmail.com',
      address: 'Số 88 Trần Não, Phường An Khánh, TP. Thủ Đức, TP.HCM'
    },
    item: {
      name: 'Ghế bành Adelaide chân gỗ sồi tự nhiên',
      sku: 'SKU-ADELAIDE-OAK',
      variant: 'Nỉ xám Anthracite / Chân sồi sáng',
      quantity: 2,
      price: 11200000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
    },
    type: 'EXCHANGE',
    reason: 'Đổi sang chân kim loại sơn tĩnh điện đen',
    customerNote: 'Muốn đổi từ chân gỗ sang chân thép tĩnh điện màu đen cho đồng bộ với bàn trà.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
    ],
    status: 'EXCHANGING',
    stage: 3,
    assignee: 'Thủ kho Hoàng Sơn',
    exchangeItem: {
      name: 'Ghế bành Adelaide chân xoay kim loại đen',
      sku: 'SKU-ADELAIDE-STEEL-BLK',
      variant: 'Nỉ xám Anthracite / Chân thép Matt Black',
      price: 11200000,
      priceDiff: 0,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
    },
    replacementOrder: {
      orderNumber: 'DCOR-ORD-2026-EX07',
      createdAt: '21/10/2026 08:00',
      status: 'PROCESSING',
      item: {
        name: 'Ghế bành Adelaide chân xoay kim loại đen',
        sku: 'SKU-ADELAIDE-STEEL-BLK',
        variant: 'Nỉ xám Anthracite / Chân thép Matt Black',
        quantity: 2,
        price: 11200000,
        imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
      },
      priceDiff: 0,
      deliveryAddress: 'Số 88 Trần Não, Phường An Khánh, TP. Thủ Đức, TP.HCM'
    },
    timeline: [
      { time: '16/10/2026 09:10', status: 'PENDING', actor: 'Khách hàng', desc: 'Yêu cầu đổi chân ghế sang chân kim loại.' },
      { time: '17/10/2026 10:00', status: 'APPROVED', actor: 'CSKH', desc: 'Duyệt đổi ngang giá 0 đ.' },
      { time: '19/10/2026 14:00', status: 'RECEIVED', actor: 'Kho', desc: 'Đã nhận lại 2 ghế chân gỗ.' },
      { time: '21/10/2026 08:00', status: 'EXCHANGING', actor: 'Thủ kho Hoàng Sơn', desc: 'Đã tự động kích hoạt đơn hàng thay thế mới #DCOR-ORD-2026-EX07 và chuyển sang khâu đóng gói xuất kho.' }
    ]
  },
  {
    id: 'RET-20261015-008',
    orderNumber: 'DCOR-ORD-0985',
    orderId: 'ORD-20260925-0985',
    createdAt: '15/10/2026 14:00',
    customer: {
      name: 'Võ Thanh Tùng',
      phone: '0919 888 222',
      email: 'tung.vo@tiki.vn',
      address: 'Số 18 Đường số 2, KDC Him Lam, Tân Hưng, Quận 7, TP.HCM'
    },
    item: {
      name: 'Bộ 4 ghế ăn Vienna khung gỗ uốn cong',
      sku: 'SKU-VIENNA-CHAIR-4',
      variant: 'Gỗ tần bì Walnut / Mặt ngồi đệm da',
      quantity: 4,
      price: 3800000,
      imageUrl: 'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
    },
    type: 'REFUND',
    reason: 'Quá thời hạn 72h hỗ trợ đổi trả theo chính sách',
    customerNote: 'Đã nhận hàng 10 ngày trước, nay đổi ý muốn trả lại do muốn đổi sang màu khác.',
    proofImages: [
      'https://res.cloudinary.com/dsasf753c/image/upload/v1792400904/dcor/products/dcor_products_8121be1958f9c2a43001ec855f1f26d6.webp'
    ],
    status: 'REJECTED',
    stage: 1,
    assignee: 'CSKH Trưởng phòng Lan Anh',
    timeline: [
      { time: '15/10/2026 14:00', status: 'PENDING', actor: 'Khách hàng', desc: 'Yêu cầu trả hàng sau 10 ngày nhận.' },
      { time: '15/10/2026 15:30', status: 'REJECTED', actor: 'CSKH Trưởng phòng Lan Anh', desc: 'Từ chối do đơn hàng đã hoàn tất quá thời hạn 72h. Đã gọi điện giải thích chính sách cho khách.' }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class OrdersReturnsMockService {
  private returns: ReturnRequest[] = JSON.parse(JSON.stringify(INITIAL_MOCK_RETURNS));

  getAll(): ReturnRequest[] {
    return this.returns;
  }

  getById(id: string): ReturnRequest | undefined {
    return this.returns.find(r => r.id === id);
  }

  updateStatus(id: string, newStatus: ReturnStatus, desc: string, actor: string = 'CSKH'): ReturnRequest | null {
    const item = this.returns.find(r => r.id === id);
    if (!item) return null;

    item.status = newStatus;

    // Auto stage detection
    if (['PENDING', 'REVIEWING', 'REJECTED'].includes(newStatus)) item.stage = 1;
    else if (['APPROVED', 'RETURNING', 'RECEIVED'].includes(newStatus)) item.stage = 2;
    else if (['REFUNDING', 'EXCHANGING'].includes(newStatus)) item.stage = 3;
    else if (newStatus === 'COMPLETED') item.stage = 4;

    const nowStr = new Date().toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    // Auto-setup logic theo từng trạng thái mới
    if (newStatus === 'APPROVED' && !item.pickupInfo) {
      item.pickupInfo = {
        provider: 'DCOR Express Đội xe chuyên dụng',
        driverName: 'Nguyễn Văn Cường',
        driverPhone: '0909 333 444',
        vehiclePlate: '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)',
        movingTeam: 'Đội bốc xếp 1 (2 thợ khiêng lầu)',
        trackingCode: `DCOR-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
        estimatedTime: 'Hôm nay, 14:00 - 16:00',
        dispatchNote: 'Chuẩn bị màng PE 3 lớp bọc bảo vệ bề mặt chống trầy xước và đồ nghề tháo dỡ',
        currentLeg: 1,
        currentLocation: 'Kho trung tâm DCOR (Bình Tân)'
      };
    } else if (newStatus === 'RETURNING') {
      if (item.pickupInfo) {
        item.pickupInfo.currentLeg = 2;
        item.pickupInfo.currentLocation = 'Đường Nguyễn Hữu Thọ, P. Tân Hưng, Quận 7 (Đang đến nhà khách)';
      }
    } else if (newStatus === 'RECEIVED') {
      if (item.pickupInfo) {
        item.pickupInfo.currentLeg = 4;
        item.pickupInfo.currentLocation = 'Đã về tới Trung tâm phân phối & QC DCOR Bình Tân';
      }
      if (!item.qcReport) {
        item.qcReport = {
          surfaceChecked: true,
          structureChecked: true,
          cushionLeatherChecked: true,
          accessoriesChecked: true,
          condition: 'Kiện hàng nguyên vẹn tem niêm phong khi tài xế thu hồi về kho.',
          defectAssessment: item.reason,
          refundPercent: 100,
          restockOption: 'RESTOCK_SALE',
          inspector: 'KTV Trịnh Văn Bách'
        };
      }
    } else if (newStatus === 'EXCHANGING') {
      // TỰ ĐỘNG KÍCH HOẠT 1 ĐƠN HÀNG MỚI NẾU LÀ ĐỔI HÀNG
      if (item.type === 'EXCHANGE' && !item.replacementOrder && item.exchangeItem) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        item.replacementOrder = {
          orderNumber: `DCOR-ORD-EX${randomNum}`,
          createdAt: nowStr,
          status: 'PROCESSING',
          item: {
            name: item.exchangeItem.name,
            sku: item.exchangeItem.sku,
            variant: item.exchangeItem.variant,
            quantity: item.item.quantity || 1,
            price: item.exchangeItem.price,
            imageUrl: item.exchangeItem.imageUrl
          },
          priceDiff: item.exchangeItem.priceDiff,
          deliveryAddress: item.customer.address
        };
        desc += ` (Tự động kích hoạt đơn hàng thay thế mới #${item.replacementOrder.orderNumber})`;
      }
    }

    item.timeline.unshift({
      time: nowStr,
      status: newStatus,
      actor,
      desc
    });

    return item;
  }

  updatePickupDispatch(id: string, dispatch: Partial<ReturnPickupDispatch>): ReturnRequest | null {
    const item = this.returns.find(r => r.id === id);
    if (!item) return null;
    if (!item.pickupInfo) {
      item.pickupInfo = {
        provider: 'DCOR Express Đội xe chuyên dụng',
        driverName: 'Nguyễn Văn Cường',
        driverPhone: '0909 333 444',
        vehiclePlate: '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)',
        movingTeam: 'Đội bốc xếp 1 (2 thợ khiêng lầu)',
        trackingCode: `DCOR-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
        estimatedTime: 'Hôm nay, 14:00 - 16:00',
        currentLeg: 1
      };
    }
    Object.assign(item.pickupInfo, dispatch);
    return item;
  }

  updateAssignee(id: string, newAssignee: string, actor: string = 'Quản trị viên'): ReturnRequest | null {
    const item = this.returns.find(r => r.id === id);
    if (!item) return null;

    const oldAssignee = item.assignee;
    item.assignee = newAssignee;

    const nowStr = new Date().toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    item.timeline.unshift({
      time: nowStr,
      status: item.status,
      actor,
      desc: `Phân công phụ trách: Chuyển quyền xử lý từ "${oldAssignee}" sang "${newAssignee}"`
    });

    return item;
  }

  batchApprove(ids: Set<string>): number {
    let count = 0;
    this.returns.forEach(r => {
      if (ids.has(r.id) && (r.status === 'PENDING' || r.status === 'REVIEWING')) {
        r.status = 'APPROVED';
        r.stage = 2;
        count++;
      }
    });
    return count;
  }

  getStatusMeta(status: ReturnStatus, type: ReturnType = 'REFUND'): {
    labelAdmin: string;
    labelUser: string;
    bg: string;
    color: string;
    border: string;
    badgeDot: string;
  } {
    switch (status) {
      case 'PENDING':
        return {
          labelAdmin: 'Chờ xử lý',
          labelUser: 'Chờ shop xem xét',
          bg: '#FEF3C7',
          color: '#D97706',
          border: '#FDE68A',
          badgeDot: '#D97706'
        };
      case 'REVIEWING':
        return {
          labelAdmin: 'Đang xem xét',
          labelUser: 'Shop đang liên hệ xử lý',
          bg: '#EFF6FF',
          color: '#2563EB',
          border: '#BFDBFE',
          badgeDot: '#2563EB'
        };
      case 'REJECTED':
        return {
          labelAdmin: 'Đã từ chối',
          labelUser: 'Yêu cầu bị từ chối',
          bg: '#FEE2E2',
          color: '#DC2626',
          border: '#FECACA',
          badgeDot: '#DC2626'
        };
      case 'APPROVED':
        return {
          labelAdmin: 'Chuẩn bị thu hồi',
          labelUser: 'Đã duyệt - Chuẩn bị thu hồi',
          bg: '#FAF5FF',
          color: '#9333EA',
          border: '#E9D5FF',
          badgeDot: '#9333EA'
        };
      case 'RETURNING':
        return {
          labelAdmin: 'Đang thu hồi & Vận chuyển',
          labelUser: 'Tài xế đang lấy hàng',
          bg: '#FFF7ED',
          color: '#EA580C',
          border: '#FED7AA',
          badgeDot: '#EA580C'
        };
      case 'RECEIVED':
        return {
          labelAdmin: 'Đã nhận hàng (QC Kho)',
          labelUser: 'Đã nhận hàng tại kho',
          bg: '#F0FDF4',
          color: '#15803D',
          border: '#BBF7D0',
          badgeDot: '#15803D'
        };
      case 'REFUNDING':
        return {
          labelAdmin: 'Đang hoàn tiền',
          labelUser: 'Đang xử lý hoàn tiền',
          bg: '#FDF2F8',
          color: '#DB2777',
          border: '#FBCFE8',
          badgeDot: '#DB2777'
        };
      case 'EXCHANGING':
        return {
          labelAdmin: 'Kích hoạt đơn hàng mới',
          labelUser: 'Đang chuẩn bị sản phẩm mới',
          bg: '#F0F9FF',
          color: '#0284C7',
          border: '#BAE6FD',
          badgeDot: '#0284C7'
        };
      case 'COMPLETED':
        return {
          labelAdmin: 'Hoàn tất đổi trả',
          labelUser: 'Đổi trả thành công',
          bg: '#DCFCE7',
          color: '#16A34A',
          border: '#86EFAC',
          badgeDot: '#16A34A'
        };
    }
  }

  formatVND(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  }
}
