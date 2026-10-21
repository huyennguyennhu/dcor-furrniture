import { RoomTemplate } from '../models/planner.model';

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'phong-khach',
    name: 'Phòng khách Bắc Âu Hiện đại',
    roomType: 'Phòng khách',
    description: 'Không gian mở ngập tràn ánh sáng với sàn gỗ ấm áp, lý tưởng để bài trí sofa góc, bàn trà và kệ tivi.',
    imageUrl: '/assets/room_img/phong_khach.png',
    defaultDimensions: {
      length: 5.5,
      width: 4.2,
      height: 2.8
    }
  },
  {
    id: 'phong-ngu',
    name: 'Phòng ngủ Master Thư giãn',
    roomType: 'Phòng ngủ',
    description: 'Tone màu trung tính nhã nhặn mang lại cảm giác bình yên, phù hợp bố trí giường đôi, tủ đầu giường và tủ quần áo.',
    imageUrl: '/assets/room_img/phong_ngu.png',
    defaultDimensions: {
      length: 4.5,
      width: 3.8,
      height: 2.7
    }
  },
  {
    id: 'phong-an',
    name: 'Phòng ăn & Bếp Gia đình',
    roomType: 'Phòng ăn',
    description: 'Mặt bằng vuông vắn ấm cúng, tối ưu cho bộ bàn ghế ăn 6-8 người cùng tủ đồ hoặc đảo bếp phong cách Nordic.',
    imageUrl: '/assets/room_img/phong_an.png',
    defaultDimensions: {
      length: 4.2,
      width: 3.6,
      height: 2.8
    }
  }
];
