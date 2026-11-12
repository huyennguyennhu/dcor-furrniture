import prisma, { withDbRetry } from '../src/lib/prisma';
import { initBlogDatabase } from '../src/lib/init-blog-db';

async function seedBlog(): Promise<void> {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU BLOG DCOR ---');

  // Đảm bảo cấu trúc bảng đã được khởi tạo
  await initBlogDatabase();

  // 1. Tạo 4 danh mục theo yêu cầu
  const categoriesData = [
    {
      name: 'Xu hướng',
      slug: 'xu-huong',
      sortOrder: 1,
      isActive: true
    },
    {
      name: 'Mẹo không gian',
      slug: 'meo-khong-gian',
      sortOrder: 2,
      isActive: true
    },
    {
      name: 'Cẩm nang chọn mua',
      slug: 'cam-nang-chon-mua',
      sortOrder: 3,
      isActive: true
    },
    {
      name: 'Chăm sóc nội thất',
      slug: 'cham-soc-noi-that',
      sortOrder: 4,
      isActive: true
    }
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const existing = await withDbRetry(() =>
      prisma.blogCategory.findUnique({
        where: { slug: cat.slug }
      })
    );

    if (existing) {
      const updated = await withDbRetry(() =>
        prisma.blogCategory.update({
          where: { id: existing.id },
          data: {
            name: cat.name,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive
          }
        })
      );
      categoryMap.set(cat.slug, updated.id);
    } else {
      const created = await withDbRetry(() =>
        prisma.blogCategory.create({
          data: cat
        })
      );
      categoryMap.set(cat.slug, created.id);
    }
  }

  console.log('-> Đã đồng bộ 4 danh mục blog thành công.');

  // 2. Tìm sản phẩm thật trong DB để gắn thẻ
  const findProductIds = async (keywords: string[], take: number = 2): Promise<string[]> => {
    try {
      const products = await withDbRetry(() =>
        prisma.product.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            OR: keywords.map(kw => ({
              OR: [
                { name: { contains: kw, mode: 'insensitive' } },
                { category: { name: { contains: kw, mode: 'insensitive' } } }
              ]
            }))
          },
          take,
          select: { id: true }
        })
      );

      if (products.length > 0) {
        return products.map(p => p.id);
      }

      const fallback = await withDbRetry(() =>
        prisma.product.findMany({
          where: { isActive: true, deletedAt: null },
          take,
          select: { id: true }
        })
      );
      return fallback.map(p => p.id);
    } catch {
      return [];
    }
  };

  const sofaIds = await findProductIds(['Sofa'], 4);
  const chairAndTableIds = await findProductIds(['Table', 'Chair'], 4);
  const storageAndLampIds = await findProductIds(['Storage', 'Lamp'], 4);
  const careAndTableIds = await findProductIds(['Table', 'Sofa'], 4);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 3. Chuẩn bị 12 bài viết cẩm nang (mỗi danh mục 3 bài = 1 bài cũ + 2 bài mới theo yêu cầu)
  const articles = [
    // ==========================================
    // CHUYÊN MỤC 1: XU HƯỚNG (xu-huong) - 3 bài
    // ==========================================
    {
      title: 'Kiến Tạo Không Gian Sống Đương Đại: Góc Nhìn & Triết Lý Từ Giám Đốc Thiết Kế DCor',
      slug: 'kien-tao-khong-gian-song-duong-dai',
      categorySlug: 'xu-huong',
      coverImageUrl: '/assets/img/modern_luxury.jpg',
      tags: ['thiết kế đương đại', 'xu hướng 2024', 'triết lý sống', 'kiến trúc'],
      seoDescription: 'Khám phá cách thức phối hợp chất liệu gỗ sồi tự nhiên, da bò Ý Mastrotto cùng ánh sáng gián tiếp để định hình vẻ đẹp sang trọng, ấm cúng trong từng góc nhà.',
      authorName: 'Trần Minh Quân',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 1 * dayMs),
      productIds: sofaIds,
      likesCount: 42,
      viewsCount: 1250,
      excerpt: 'Khám phá cách thức phối hợp chất liệu gỗ sồi tự nhiên, da bò Ý Mastrotto cùng ánh sáng gián tiếp để định hình vẻ đẹp sang trọng, ấm cúng và đầy cảm xúc trong từng góc nhà.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Vẻ đẹp đương đại bắt đầu từ sự chân thật của vật liệu'
        },
        {
          type: 'paragraph',
          text: 'Không gian sống đương đại không còn bị trói buộc bởi những khuôn khổ cứng nhắc của chủ nghĩa công năng thuần túy. Ngày nay, một ngôi nhà sang trọng thực sự được định nghĩa bởi sự hòa quyện giữa các chất liệu thô mộc cao cấp: vân gỗ sồi Bắc Mỹ ấm áp, da bò thuộc nguyên tấm từ các xưởng Ý và các chi tiết kim loại phay xước tinh xảo.'
        },
        {
          type: 'quote',
          text: 'Ngôi nhà không chỉ là nơi để ở, mà là tấm gương phản chiếu tâm hồn và sự trưởng thành thẩm mỹ của gia chủ.',
          cite: 'Trần Minh Quân - Giám đốc Thiết kế DCor'
        },
        {
          type: 'heading',
          level: 3,
          text: '3 Yếu tố cốt lõi định hình phong cách sống hiện đại'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Sự kết nối mạch lạc giữa các khu vực sinh hoạt chung qua luồng di chuyển không rào cản.',
            'Ánh sáng đa tầng: kết hợp ánh sáng tự nhiên ban ngày và hệ thống chiếu sáng gián tiếp 3000K ấm dịu khi đêm về.',
            'Nội thất chọn lọc: Ưu tiên chất lượng vượt thời gian thay vì số lượng đồ đạc chất đầy phòng.'
          ]
        },
        {
          type: 'products',
          title: 'Sản phẩm nội thất đương đại nổi bật',
          productIds: sofaIds
        }
      ]
    },
    {
      title: 'Xu Hướng Nội Thất Japandi: Giao Thoa Tinh Tế Giữa Bắc Âu & Tinh Thần Thiền Nhật Bản',
      slug: 'xu-huong-noi-that-japandi',
      categorySlug: 'xu-huong',
      coverImageUrl: '/assets/img/japandi.jpg',
      tags: ['japandi', 'phong cách bắc âu', 'nội thất nhật bản', 'tối giản'],
      seoDescription: 'Tìm hiểu tại sao phong cách Japandi trở thành xu hướng nội thất dẫn đầu xu thế, mang lại sự cân bằng hoàn hảo giữa tính tiện dụng và sự thanh tịnh cho tâm hồn.',
      authorName: 'Hoàng Thu Thảo',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 3 * dayMs),
      productIds: chairAndTableIds,
      likesCount: 35,
      viewsCount: 890,
      excerpt: 'Sự kết hợp hoàn hảo giữa công năng ấm áp của phong cách Scandinavian và vẻ đẹp tối giản thanh lịch của thẩm mỹ Wabi Sabi Nhật Bản đang tạo nên làn sóng mới trong kiến trúc căn hộ.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Japandi - Cuộc gặp gỡ định mệnh của hai nửa bán cầu'
        },
        {
          type: 'paragraph',
          text: 'Mặc dù cách nhau hàng ngàn dặm, văn hóa thiết kế Bắc Âu (Danish Hygge) và triết lý thẩm mỹ Nhật Bản lại chia sẻ chung một giá trị cốt lõi: tôn trọng thiên nhiên, yêu chuộng vật liệu hữu cơ và tìm kiếm sự bình yên giản dị trong cuộc sống thường nhật.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Đặc trưng nhận diện không gian mang âm hưởng Japandi'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Bảng màu đất dịu nhẹ: Be cát, nâu ấm của gỗ thông/gỗ tần bì, xám nhạt và điểm xuyết sắc xanh rêu sẫm.',
            'Nội thất có chiều cao vừa phải: Bàn trà thấp, ghế bành bọc vải lanh thô mộc và đệm ngồi sát sàn tạo cảm giác thư thái gần gũi.',
            'Sự hiện diện của thủ công mỹ nghệ: Bình gốm vuốt tay, đèn lồng giấy washi và khay gỗ chạm trổ tinh xảo.'
          ]
        },
        {
          type: 'quote',
          text: 'Trong một thế giới đầy hối hả, phong cách Japandi như một lời mời gọi bước chậm lại để cảm nhận sự tĩnh lặng quý giá trong ngôi nhà của mình.',
          cite: 'Hoàng Thu Thảo'
        },
        {
          type: 'products',
          title: 'Gợi ý các thiết kế mang tinh thần Japandi mộc mạc',
          productIds: chairAndTableIds
        }
      ]
    },
    {
      title: 'Nghệ Thuật Phối Màu Theo Phong Cách Tối Giản Thanh Lịch',
      slug: 'phoi-mau-theo-phong-cach-toi-gian',
      categorySlug: 'xu-huong',
      coverImageUrl: '/assets/room_img/phong_ngu.jpg',
      tags: ['phong cách tối giản', 'phối màu', 'xu hướng nội thất', 'thiết kế'],
      seoDescription: 'Khám phá cách kết hợp bảng màu trung tính, độ tương phản ánh sáng và bề mặt vật liệu để tạo nên không gian sống tối giản ấm cúng.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 7 * dayMs),
      productIds: chairAndTableIds,
      likesCount: 18,
      viewsCount: 420,
      excerpt: 'Phong cách tối giản không đồng nghĩa với sự đơn điệu hay lạnh lẽo. Khi biết kết hợp bảng màu trung tính cùng chất liệu mộc mạc, bạn sẽ có một ngôi nhà tràn đầy sự thư thái và tinh tế.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Bản chất của màu sắc trong không gian sống tối giản'
        },
        {
          type: 'paragraph',
          text: 'Trong kiến trúc hiện đại, phong cách tối giản hướng tới việc loại bỏ những chi tiết rườm rà để tôn vinh sự tinh khiết của đường nét, hình khối và ánh sáng tự nhiên. Màu sắc trong không gian này đóng vai trò như lớp phông nền tĩnh lặng, giúp tâm trí người ở được thả lỏng sau những giờ làm việc căng thẳng bên ngoài.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Nguyên tắc tỷ lệ màu nền, màu bổ trợ và điểm nhấn'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Màu chủ đạo chiếm phần lớn diện tích: Thường là các gam trắng kem, be nhạt hoặc xám tro trên các diện tường lớn và trần nhà để tối đa hóa độ phản chiếu ánh sáng ban ngày.',
            'Màu trung gian cho đồ nội thất lớn: Bàn ăn gỗ sồi tự nhiên, ghế sofa nỉ màu ghi đá hoặc rèm vải thô giúp gắn kết các khoảng tường trống lại với nhau.',
            'Màu điểm nhấn chừng mực: Màu đen mờ của kim loại sơn tĩnh điện hoặc sắc xanh của tán cây cảnh trong phòng tạo chiều sâu thị giác mà không gây rối mắt.'
          ]
        },
        {
          type: 'quote',
          text: 'Đỉnh cao của sự sang trọng là khi mọi món đồ trong phòng đều có lý do để tồn tại và hòa hợp tự nhiên cùng nhau.',
          cite: 'Ban biên tập DCor'
        },
        {
          type: 'products',
          title: 'Các món nội thất mang gam màu trung tính nhã nhặn',
          productIds: chairAndTableIds
        }
      ]
    },

    // ==========================================
    // CHUYÊN MỤC 2: MẸO KHÔNG GIAN (meo-khong-gian) - 3 bài
    // ==========================================
    {
      title: 'Tối Ưu 35m² Căn Hộ Studio: Nghệ Thuật Phân Chia Vách Lam Gỗ Không Bí Bách',
      slug: 'toi-uu-35m2-can-ho-studio',
      categorySlug: 'meo-khong-gian',
      coverImageUrl: '/assets/room_img/phong_khach.jpg',
      tags: ['căn hộ studio', 'mẹo không gian', 'vách lam gỗ', 'nhà nhỏ đẹp'],
      seoDescription: 'Giải pháp phân chia phòng khách và khu nghỉ ngơi thông minh bằng vách lam gỗ kết hợp hệ tủ âm tường, tối ưu hóa công năng cho diện tích nhỏ.',
      authorName: 'Trần Minh Quân',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 2 * dayMs),
      productIds: storageAndLampIds,
      likesCount: 29,
      viewsCount: 780,
      excerpt: 'Giải pháp vách ngăn hở kết hợp hệ tủ âm tường thông minh biến không gian nhỏ thành tác phẩm kiến trúc tĩnh lặng, đón gió và tràn ngập ánh sáng tự nhiên.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Nghệ thuật phân vùng không gian mở không cần xây tường'
        },
        {
          type: 'paragraph',
          text: 'Đối với những căn hộ studio dưới 40m², việc xây tường gạch truyền thống sẽ chia vụn không gian và ngăn chặn dòng chảy ánh sáng. Thay vào đó, vách lam gỗ đứng xoay được hoặc hệ kệ sách không lưng là giải pháp phân chia khu vực ngủ và tiếp khách vô cùng duyên dáng.'
        },
        {
          type: 'quote',
          text: 'Không gian nhỏ không giới hạn sự sáng tạo; nó đòi hỏi chúng ta phải chắt lọc từng centimet để mỗi chi tiết đều có giá trị sử dụng cao nhất.',
          cite: 'Trần Minh Quân'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Các nguyên tắc vàng cho căn hộ studio'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Sử dụng gương ốp tường phản chiếu góc nhìn, nhân đôi cảm giác về chiều sâu.',
            'Lựa chọn sofa giường thông minh có ngăn trữ đồ tiện lợi bên dưới đệm ngồi.',
            'Thiết kế tủ quần áo kịch trần cánh trượt phẳng đồng màu với tường để xóa nhòa khối tích của tủ.'
          ]
        },
        {
          type: 'products',
          title: 'Nội thất đa năng dành riêng cho không gian nhỏ',
          productIds: storageAndLampIds
        }
      ]
    },
    {
      title: 'Thiết Kế Góc Làm Việc Tại Nhà Đầy Cảm Hứng & Công Thái Học',
      slug: 'thiet-ke-goc-lam-viec-cong-thai-hoc',
      categorySlug: 'meo-khong-gian',
      coverImageUrl: '/assets/room_img/phong_lam_viec.jpg',
      tags: ['góc làm việc', 'công thái học', 'phòng làm việc', 'bố trí thông minh'],
      seoDescription: 'Bí quyết bố trí bàn ghế làm việc đón ánh sáng tự nhiên, cách chọn ghế công thái học bảo vệ cột sống và tổ chức tài liệu gọn gàng giúp tăng 200% năng suất làm việc.',
      authorName: 'Hoàng Thu Thảo',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 5 * dayMs),
      productIds: storageAndLampIds,
      likesCount: 24,
      viewsCount: 650,
      excerpt: 'Tạo dựng một không gian làm việc tại nhà chuẩn công thái học giúp duy trì sự tập trung cao độ, bảo vệ sức khỏe lâu dài và khơi nguồn cảm hứng sáng tạo mỗi ngày.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Vị trí đặt bàn làm việc quyết định năng lượng cả ngày'
        },
        {
          type: 'paragraph',
          text: 'Một sai lầm phổ biến khi làm việc tại nhà là quay mặt trực tiếp vào bức tường kín hoặc ngồi quay lưng hoàn toàn ra cửa chính. Theo nguyên tắc tâm lý học không gian, bạn nên đặt bàn làm việc vuông góc với cửa sổ để tận dụng ánh sáng tự nhiên gián tiếp, hạn chế chói lóa màn hình mà vẫn có tầm nhìn thư giãn.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Tiêu chuẩn lựa chọn bàn ghế chuẩn công thái học'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Chiều cao bàn tiêu chuẩn 72 - 75cm kết hợp đệm đỡ tay ghế ngang tầm mặt bàn.',
            'Ghế làm việc có tựa lưng ôm sát đường cong sinh lý cột sống thắt lưng (Lumbar support).',
            'Đèn bàn ánh sáng trung tính 4000K có chỉ số hoàn màu CRI > 90 chống mỏi mắt khi làm việc buổi tối.'
          ]
        },
        {
          type: 'products',
          title: 'Bàn ghế và phụ kiện góc làm việc cao cấp',
          productIds: storageAndLampIds
        }
      ]
    },
    {
      title: 'Giải Pháp Bố Trí Phòng Khách Nhỏ Thoáng Đãng Và Tiện Nghi',
      slug: 'bo-tri-phong-khach-nho',
      categorySlug: 'meo-khong-gian',
      coverImageUrl: '/assets/img/phong_khach.jpg',
      tags: ['phòng khách nhỏ', 'mẹo không gian', 'tiết kiệm diện tích', 'bố trí nội thất'],
      seoDescription: 'Cẩm nang sắp xếp phòng khách diện tích vừa và nhỏ thông minh, tận dụng ánh sáng tự nhiên và lựa chọn nội thất chân cao tạo cảm giác rộng rãi.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 8 * dayMs),
      productIds: storageAndLampIds,
      likesCount: 16,
      viewsCount: 510,
      excerpt: 'Phòng khách diện tích khiêm tốn hoàn toàn có thể trở nên rộng rãi bất ngờ nếu gia chủ nắm vững các nguyên tắc chọn nội thất chân cao, bàn trà thông minh và phân luồng giao thông khoa học.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Thách thức thường gặp khi sắp đặt phòng khách nhỏ'
        },
        {
          type: 'paragraph',
          text: 'Tại các căn hộ vừa và nhỏ, phòng khách thường là không gian sinh hoạt chung kết nối trực tiếp với lối vào và khu vực bàn ăn. Sai lầm phổ biến nhất là lựa chọn những bộ bàn ghế bọc nệm dày sát đất khiến tầm nhìn bị che chắn và không khí khó lưu thông, dẫn đến cảm giác tù túng ngay khi bước chân vào cửa.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Ưu tiên nội thất có chân thanh mảnh và gầm thoáng'
        },
        {
          type: 'paragraph',
          text: 'Quy tắc thị giác quan trọng nhất cho phòng nhỏ là giữ cho mặt sàn càng thông thoáng càng tốt. Khi mắt bạn có thể nhìn xuyên qua gầm ghế sofa hoặc gầm bàn trà tới bức tường phía sau, bộ não sẽ tự động đánh giá căn phòng rộng hơn thực tế. Hãy chọn các mẫu ghế sofa chân gỗ hoặc kim loại mảnh cao từ mười lăm centimet trở lên, vừa giúp phòng thoáng mắt vừa thuận tiện khi dùng máy hút bụi dọn dẹp hàng ngày.'
        },
        {
          type: 'quote',
          text: 'Càng nhìn thấy nhiều diện tích mặt sàn, không gian sống của bạn càng tạo cảm giác rộng rãi và khoáng đạt.',
          cite: 'Ban biên tập DCor'
        },
        {
          type: 'products',
          title: 'Sản phẩm lưu trữ và đèn chiếu sáng gọn gàng',
          productIds: storageAndLampIds
        }
      ]
    },

    // ==========================================
    // CHUYÊN MỤC 3: CẨM NANG CHỌN MUA (cam-nang-chon-mua) - 3 bài
    // ==========================================
    {
      title: 'Phân Biệt Da Bò Mastrotto Thật Và Da Công Nghiệp: Bí Quyết Của Chuyên Gia',
      slug: 'phan-biet-da-bo-mastrotto-that-va-da-cong-nghiep',
      categorySlug: 'cam-nang-chon-mua',
      coverImageUrl: '/assets/img/blog_featured_sofa.jpg',
      tags: ['da mastrotto', 'sofa da ý', 'cẩm nang chọn mua', 'chất liệu da'],
      seoDescription: '4 bước kiểm tra độ đàn hồi, mùi hương và vân da tự nhiên độc bản giúp gia chủ chọn đúng chất liệu da thuộc cao cấp của tập đoàn Mastrotto Ý.',
      authorName: 'Hoàng Thu Thảo',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 4 * dayMs),
      productIds: sofaIds,
      likesCount: 38,
      viewsCount: 1120,
      excerpt: '4 bước kiểm tra độ đàn hồi, mùi hương và vân da tự nhiên độc bản giúp gia chủ chọn đúng chất liệu da thuộc cao cấp cho bộ sofa phòng khách.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Tại sao da bò Mastrotto Ý lại là chuẩn mực vàng của sofa cao cấp?'
        },
        {
          type: 'paragraph',
          text: 'Gruppo Mastrotto là tập đoàn thuộc da hàng đầu thế giới có trụ sở tại Arzignano (Ý) với hơn 65 năm lịch sử. Da bò Mastrotto được xử lý qua quy trình thuộc bằng thảo mộc tự nhiên nghiêm ngặt, giữ trọn vẹn lỗ chân lông thoáng khí và độ mềm xốp êm ái mà các loại da nhân tạo không bao giờ mô phỏng được.'
        },
        {
          type: 'heading',
          level: 3,
          text: '4 Cách thử nhanh để nhận diện da thật tại showroom'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Thử nghiệm độ đàn hồi bằng ngón tay: Khi ấn mạnh ngón tay vào bề mặt da thật, các nếp nhăn li ti sẽ tỏa đều ra xung quanh và đàn hồi biến mất ngay khi buông tay.',
            'Cảm nhận độ ấm nhiệt: Da thật hấp thụ nhiệt cơ thể tạo cảm giác ấm áp dễ chịu, trong khi da simili hay microfiber nhân tạo luôn cho cảm giác lạnh và bí mồ hôi khi ngồi lâu.',
            'Quan sát độ đồng đều vân da: Mỗi mét vuông da tự nhiên đều có các hạt vân không đều nhau ngẫu hứng độc bản; nếu các vân hạt dập nổi lặp lại răm rắp thì chắc chắn là da công nghiệp.',
            'Thử giọt nước: Nhỏ một giọt nước nhỏ lên bề mặt da mộc, sau 1-2 phút giọt nước sẽ hơi ngấm nhẹ và làm sẫm màu vùng da đó, sau đó khô lại nguyên vẹn.'
          ]
        },
        {
          type: 'quote',
          text: 'Một chiếc sofa da thật không già đi theo năm tháng, nó chỉ tích tụ thêm nét duyên thâm trầm của thời gian và trải nghiệm sống của chủ nhân.',
          cite: 'Hoàng Thu Thảo'
        },
        {
          type: 'products',
          title: 'Bộ sưu tập sofa bọc da bò Mastrotto nhập khẩu',
          productIds: sofaIds
        }
      ]
    },
    {
      title: 'Gợi Ý 5 Mẫu Sofa Góc Chữ L Dành Riêng Cho Phòng Khách Biệt Thự Hiện Đại',
      slug: 'goi-y-5-mau-sofa-goc-chu-l',
      categorySlug: 'cam-nang-chon-mua',
      coverImageUrl: '/assets/img/modern_luxury.jpg',
      tags: ['sofa góc l', 'biệt thự hiện đại', 'phòng khách rộng', 'sofa cao cấp'],
      seoDescription: 'Tỉ lệ hình khối cân xứng, đệm lông vũ đa tầng và ngôn ngữ thiết kế tinh giản kiến tạo diện mạo sang trọng, trang nhã cho phòng khách biệt thự cao cấp.',
      authorName: 'Vũ Mai Anh',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 6 * dayMs),
      productIds: sofaIds,
      likesCount: 31,
      viewsCount: 940,
      excerpt: 'Tỉ lệ hình khối cân xứng, đệm lông vũ đa tầng và ngôn ngữ thiết kế tinh giản kiến tạo diện mạo sang trọng, trang nhã cho phòng khách biệt thự hiện đại.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Vị thế của sofa góc chữ L trong không gian phòng khách lớn'
        },
        {
          type: 'paragraph',
          text: 'Đối với những phòng khách biệt thự có diện tích từ 40m² trở lên, một bộ sofa nhỏ sẽ bị lọt thỏm và mất đi sự uy nghi cần thiết. Sofa chữ L với kích thước bề thế 3m2 - 3m8 không chỉ là món đồ nội thất chính mà còn đóng vai trò như một tác phẩm điêu khắc kiến trúc neo giữ trọng tâm của cả ngôi nhà.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Bí quyết chọn kích thước và hướng góc chữ L'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Xác định góc L trái hay L phải dựa theo luồng giao thông chính từ sảnh vào để tránh bị chắn tầm nhìn.',
            'Chiều sâu ghế ngồi nên đạt tối thiểu 105cm kết hợp đệm tựa lông vũ êm ái cho những buổi sum vầy xem phim gia đình.',
            'Khoảng cách từ mép sofa đến kệ tivi lý tưởng từ 3m5 đến 4m5 để đảm bảo an toàn cho thị lực.'
          ]
        },
        {
          type: 'products',
          title: 'Các mẫu sofa góc module DCor kích thước lớn',
          productIds: sofaIds
        }
      ]
    },
    {
      title: 'Cách Đo Phòng Trước Khi Mua Sofa Chuẩn Xác Từng Bước',
      slug: 'cach-do-phong-truoc-khi-mua-sofa',
      categorySlug: 'cam-nang-chon-mua',
      coverImageUrl: '/assets/room_img/phong_khach.jpg',
      tags: ['sofa', 'phòng khách', 'đo đạc', 'kinh nghiệm mua sắm'],
      seoDescription: 'Hướng dẫn chi tiết các bước đo đạc diện tích phòng khách, hành lang và cửa ra vào trước khi chọn mua sofa để đảm bảo vừa vặn không gian.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 9 * dayMs),
      productIds: sofaIds,
      likesCount: 22,
      viewsCount: 680,
      excerpt: 'Việc đo đạc kích thước trước khi đặt mua sofa là khâu chuẩn bị quan trọng nhất giúp bạn tránh tình trạng ghế quá khổ, chắn lối đi hoặc không thể vận chuyển qua cửa ra vào.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Tại sao việc đo đạc kỹ lưỡng lại mang tính quyết định?'
        },
        {
          type: 'paragraph',
          text: 'Một chiếc sofa khi đặt trong showroom rộng lớn thường tạo cảm giác nhỏ hơn so với thực tế. Khi mang về căn hộ, sự chênh lệch về tỷ lệ trần nhà và diện tích sàn có thể khiến không gian trở nên chật chội nếu bạn không chuẩn bị kỹ số đo từ trước. Đo đạc chính xác giúp xác định chiều dài tối đa của sofa, khoảng lùi cần thiết so với bàn trà và luồng di chuyển chính trong phòng khách.'
        },
        {
          type: 'quote',
          text: 'Không gian sống thoải mái bắt đầu từ sự cân đối giữa kích thước đồ đạc và lối đi lại hàng ngày trong gia đình.',
          cite: 'Ban biên tập DCor'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Các kích thước bắt buộc phải kiểm tra'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Diện tích mảng tường dự kiến kê sofa: Đo chiều dài của bức tường chính và trừ đi khoảng cách tối thiểu dành cho rèm cửa hoặc bàn góc.',
            'Khoảng cách từ sofa đến bàn trà và kệ tivi: Cần chừa khoảng trống từ bốn mươi đến bốn mươi lăm centimet giữa sofa và bàn trà để ngồi và đứng lên thuận tiện.',
            'Lối đi lại chính trong phòng: Giữ khoảng trống tối thiểu sáu mươi đến tám mươi centimet để cả nhà di chuyển thoải mái mà không bị vướng gối tựa hay góc ghế.',
            'Chiều cao trần nhà: Phòng có trần thấp nên ưu tiên các dòng sofa có tựa lưng vừa phải để trần trông cao ráo và thoáng đãng hơn.'
          ]
        },
        {
          type: 'products',
          title: 'Gợi ý các mẫu sofa cân đối cho phòng khách',
          productIds: sofaIds
        }
      ]
    },

    // ==========================================
    // CHUYÊN MỤC 4: CHĂM SÓC NỘI THẤT (cham-soc-noi-that) - 3 bài
    // ==========================================
    {
      title: 'Quy Trình Xử Lý Ẩm Mốc & Chống Nồm Cho Đồ Gỗ Tự Nhiên Vào Mùa Mưa',
      slug: 'xu-ly-am-moc-chong-nom-cho-do-go',
      categorySlug: 'cham-soc-noi-that',
      coverImageUrl: '/assets/img/blog_care_guide.jpg',
      tags: ['bảo quản đồ gỗ', 'chống nồm ẩm', 'chăm sóc nội thất', 'vệ sinh nhà cửa'],
      seoDescription: 'Bí quyết giữ độ ẩm phòng lý tưởng từ 45-60%, cách lau bảo dưỡng dầu khoáng và sử dụng túi hút ẩm an toàn cho tủ áo, bàn ghế gỗ trong những ngày nồm ẩm.',
      authorName: 'Vũ Mai Anh',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 1 * dayMs),
      productIds: careAndTableIds,
      likesCount: 27,
      viewsCount: 820,
      excerpt: 'Thời tiết nồm ẩm tại miền Bắc là thử thách lớn đối với nội thất gỗ tự nhiên. Áp dụng đúng 5 bước chăm sóc khoa học giúp bề mặt gỗ luôn khô thoáng, bóng đẹp không ẩm mốc.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Ảnh hưởng của độ ẩm cao lên thớ gỗ tự nhiên'
        },
        {
          type: 'paragraph',
          text: 'Gỗ tự nhiên là chất liệu "sống" liên tục thở và cân bằng ẩm với môi trường. Khi độ ẩm không khí vượt quá 75% trong những ngày nồm ẩm, thớ gỗ sẽ hút ẩm phồng nhẹ, có thể dẫn đến hiện tượng kẹt ngăn kéo hoặc xuất hiện các chấm mốc trắng li ti ở các góc khuất.'
        },
        {
          type: 'heading',
          level: 3,
          text: '5 Nguyên tắc vàng bảo vệ đồ gỗ trong mùa nồm'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Bật chế độ Dry trên điều hòa hoặc dùng máy hút ẩm để duy trì độ ẩm phòng ổn định quanh mức 50% - 60%.',
            'Kê đồ gỗ cách tường tối thiểu 5 - 10cm để không khí được đối lưu liên tục sau lưng tủ.',
            'Lau chùi bằng khăn vi sợi (microfiber) vắt ráo nước kiệt, tuyệt đối không dùng khăn ướt đẫm nước.',
            'Dùng sáp ong tự nhiên (Beeswax) hoặc dầu khoáng bảo dưỡng thoa nhẹ định kỳ 6 tháng một lần để tạo lớp màng chống thấm nước.',
            'Đặt túi than hoạt tính hoặc gói hút ẩm chuyên dụng vào các ngăn kéo chứa quần áo và tài liệu.'
          ]
        },
        {
          type: 'quote',
          text: 'Sự tỉ mỉ và kiên nhẫn chăm chút định kỳ chính là chìa khóa để nội thất gỗ tự nhiên đồng hành cùng gia đình qua nhiều thế hệ.',
          cite: 'Vũ Mai Anh'
        },
        {
          type: 'products',
          title: 'Các sản phẩm bàn ăn và bàn trà gỗ tự nhiên hoàn thiện cao cấp',
          productIds: careAndTableIds
        }
      ]
    },
    {
      title: 'Hướng Dẫn Vệ Sinh Sofa Vải Nỉ & Nệm Bọc Tại Nhà Sạch Như Mới',
      slug: 've-sinh-sofa-vai-ni-tai-nha',
      categorySlug: 'cham-soc-noi-that',
      coverImageUrl: '/assets/img/about_material_core.jpg',
      tags: ['vệ sinh sofa nỉ', 'tẩy vết bẩn', 'mẹo vặt nội thất', 'chăm sóc nhà cửa'],
      seoDescription: 'Phương pháp loại bỏ các vết bẩn cứng đầu như cà phê, trà hay dầu mỡ trên sofa vải nỉ bằng baking soda và giấm trắng an toàn, hiệu quả bất ngờ.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 3 * dayMs),
      productIds: sofaIds,
      likesCount: 33,
      viewsCount: 970,
      excerpt: 'Phương pháp làm sạch các vết bẩn cứng đầu trên sofa vải nỉ bằng các nguyên liệu tự nhiên sẵn có trong nhà, giúp đệm ghế sạch thơm và kéo dài tuổi thọ sợi vải.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Hiểu mã ký hiệu vệ sinh gắn trên nhãn sofa'
        },
        {
          type: 'paragraph',
          text: 'Trước khi bắt tay vào làm sạch sofa vải, hãy lật tem nhãn kỹ thuật dưới gầm ghế để kiểm tra mã ký hiệu: Mã "W" cho phép dùng dung dịch nước; Mã "S" chỉ được giặt khô bằng dung môi; Mã "WS" hoặc "SW" cho phép cả hai cách; và Mã "X" chỉ được hút bụi khô.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Quy trình xử lý vết bẩn đổ nước ngọt, cà phê khẩn cấp'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Bước 1: Lấy khăn giấy hoặc khăn khô dặm ngay lập tức lên vết nước để hút chất lỏng, KHÔNG chà xát.',
            'Bước 2: Pha dung dịch gồm 1 thìa xà phòng rửa bát dịu nhẹ + 1 thìa giấm trắng + 2 cốc nước ấm.',
            'Bước 3: Dùng bọt biển chấm nhẹ dung dịch vào vết bẩn từ mép ngoài hướng vào trung tâm.',
            'Bước 4: Rắc bột baking soda phủ lên trên, để yên 30 phút hút ẩm và khử mùi hôi, sau đó hút bụi sạch lại.'
          ]
        },
        {
          type: 'products',
          title: 'Sản phẩm sofa vải nỉ chống bám bụi cao cấp',
          productIds: sofaIds
        }
      ]
    },
    {
      title: 'Bí Quyết Bảo Dưỡng Sofa Và Bàn Ghế Gỗ Tự Nhiên Bền Đẹp',
      slug: 'cham-soc-sofa-va-go',
      categorySlug: 'cham-soc-noi-that',
      coverImageUrl: '/assets/img/blog_dining_table.jpg',
      tags: ['chăm sóc nội thất', 'bảo dưỡng sofa', 'gỗ tự nhiên', 'vệ sinh nhà cửa'],
      seoDescription: 'Hướng dẫn chuẩn xác các phương pháp làm sạch sofa vải, dưỡng chất liệu da và bảo quản bề mặt gỗ tự nhiên chống ẩm mốc, cong vênh theo mùa.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: new Date(now - 10 * dayMs),
      productIds: careAndTableIds,
      likesCount: 20,
      viewsCount: 590,
      excerpt: 'Đồ nội thất chất lượng cao cần chế độ chăm sóc định kỳ đúng cách để giữ được vẻ đẹp nguyên bản của vân gỗ và độ đàn hồi êm ái của đệm mút qua nhiều năm sử dụng.',
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Hiểu đúng về đặc tính của chất liệu gỗ và sofa'
        },
        {
          type: 'paragraph',
          text: 'Nội thất bằng gỗ tự nhiên và sofa da hay vải nỉ đều có khả năng trao đổi độ ẩm với môi trường xung quanh. Khí hậu nhiệt đới gió mùa tại Việt Nam với các đợt nồm ẩm hoặc hanh khô kéo dài là nguyên nhân chính khiến bề mặt gỗ dễ bị co ngót hoặc lớp vải bọc sofa tích tụ bụi mịn và ẩm mốc nếu không được lau chùi khoa học.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Quy trình chăm sóc sofa hàng tuần và định kỳ'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Hút bụi định kỳ: Sử dụng đầu hút chổi mềm hút dọc theo các đường chỉ may và kẽ nệm ngồi mỗi tuần một lần để ngăn bụi cát ma sát làm mòn sợi vải.',
            'Xử lý vết bẩn mới ngay lập tức: Khi vô tình làm đổ nước trà hay cà phê, dùng khăn bông khô dặm nhẹ thấm hút từ ngoài vào trong, tuyệt đối không chà xát mạnh làm loang rộng vết bẩn.',
            'Đảo chiều gối tựa và đệm rời: Đối với các mẫu ghế có đệm rời, việc đổi chỗ và lật mặt đệm định kỳ giúp lực tì đè phân bổ đều, giữ dáng nệm luôn căng tròn.',
            'Tránh ánh nắng mặt trời chiếu trực diện: Tia tử ngoại chiếu rọi gay gắt qua kính có thể làm bạc màu sợi vải và khiến bề mặt da bị khô nứt sớm.'
          ]
        },
        {
          type: 'quote',
          text: 'Sự kiên nhẫn lau dọn đúng cách mỗi tuần chính là phương thuốc tốt nhất giúp ngôi nhà luôn giữ được vẻ tươm tất, ấm êm.',
          cite: 'Ban biên tập DCor'
        },
        {
          type: 'products',
          title: 'Sản phẩm bàn ghế gỗ và sofa được ưa chuộng',
          productIds: careAndTableIds
        }
      ]
    }
  ];

  let successCount = 0;
  for (const art of articles) {
    const categoryId = categoryMap.get(art.categorySlug);
    if (!categoryId) {
      console.warn(`[WARN] Không tìm thấy categoryId cho slug: ${art.categorySlug}`);
      continue;
    }

    const existingPost = await withDbRetry(() =>
      prisma.blogPost.findUnique({
        where: { slug: art.slug }
      })
    );

    const postData = {
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      blocks: art.blocks,
      coverImageUrl: art.coverImageUrl,
      categoryId,
      tags: art.tags,
      seoDescription: art.seoDescription,
      authorName: art.authorName,
      status: art.status,
      publishedAt: art.publishedAt,
      productIds: art.productIds,
      likesCount: art.likesCount || 15,
      viewsCount: art.viewsCount || 300
    };

    if (existingPost) {
      await withDbRetry(() =>
        prisma.blogPost.update({
          where: { id: existingPost.id },
          data: postData
        })
      );
      console.log(`-> [CẬP NHẬT] "${art.title}" (Chuyên mục: ${art.categorySlug})`);
    } else {
      await withDbRetry(() =>
        prisma.blogPost.create({
          data: postData
        })
      );
      console.log(`-> [TẠO MỚI] "${art.title}" (Chuyên mục: ${art.categorySlug})`);
    }
    successCount++;
  }

  console.log(`\n--- HOÀN THÀNH SEED DỮ LIỆU: ${successCount} BÀI VIẾT THÀNH CÔNG ---`);
}

seedBlog()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('[ERROR] Lỗi khi seed blog:', err);
    process.exit(1);
  });
