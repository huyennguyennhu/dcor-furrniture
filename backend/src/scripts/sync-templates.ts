import prisma from '../lib/prisma';

async function main() {
  const templates = [
    {
      id: 'TMPL-LIVING-01',
      name: 'Phòng khách Bắc Âu Hiện đại',
      roomType: 'Phòng khách',
      description: 'Không gian mở ngập tràn ánh sáng với sàn gỗ ấm áp, lý tưởng để bài trí sofa góc, bàn trà và kệ tivi.',
      imageUrl: '/assets/room_img/phong_khach.png',
      length: 5.5,
      width: 4.2,
      height: 2.8,
      suggestedProducts: ['Sofa Góc Chữ L DCor Nordic', 'Bàn Trà Mặt Đá Ceramic DCor Elegance']
    },
    {
      id: 'TMPL-BEDROOM-02',
      name: 'Phòng ngủ Master Thư giãn',
      roomType: 'Phòng ngủ',
      description: 'Tone màu trung tính nhã nhặn mang lại cảm giác bình yên, phù hợp bố trí giường đôi, tủ đầu giường và tủ quần áo.',
      imageUrl: '/assets/room_img/phong_ngu.png',
      length: 4.5,
      width: 3.8,
      height: 2.7,
      suggestedProducts: ['Giường Ngủ Bọc Nệm DCor King Bed', 'Đèn Ngủ Glow Brass']
    },
    {
      id: 'TMPL-DINING-03',
      name: 'Phòng ăn & Bếp Gia đình',
      roomType: 'Phòng ăn',
      description: 'Mặt bằng vuông vắn ấm cúng, tối ưu cho bộ bàn ghế ăn 6-8 người cùng tủ đồ hoặc đảo bếp phong cách Nordic.',
      imageUrl: '/assets/room_img/phong_an.png',
      length: 4.2,
      width: 3.6,
      height: 2.8,
      suggestedProducts: ['Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', 'Tủ Bếp DCor Nordic']
    }
  ];

  for (const t of templates) {
    await prisma.$executeRawUnsafe(
      `UPDATE "RoomTemplate"
       SET "name" = $1, "roomType" = $2, "description" = $3, "imageUrl" = $4,
           "length" = $5, "width" = $6, "height" = $7, "suggestedProducts" = $8::jsonb, "isActive" = true
       WHERE "id" = $9`,
      t.name,
      t.roomType,
      t.description,
      t.imageUrl,
      t.length,
      t.width,
      t.height,
      JSON.stringify(t.suggestedProducts),
      t.id
    );
  }

  console.log('SYNC_TEMPLATES_COMPLETED_SUCCESSFULLY');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
