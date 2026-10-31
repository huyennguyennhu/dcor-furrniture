import prisma from '../src/lib/prisma';
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
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: cat.slug }
    });

    if (existing) {
      const updated = await prisma.blogCategory.update({
        where: { id: existing.id },
        data: {
          name: cat.name,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive
        }
      });
      categoryMap.set(cat.slug, updated.id);
    } else {
      const created = await prisma.blogCategory.create({
        data: cat
      });
      categoryMap.set(cat.slug, created.id);
    }
  }

  console.log('-> Đã đồng bộ 4 danh mục blog thành công.');

  // 2. Tìm sản phẩm thật trong DB để gắn thẻ
  const findProductIds = async (keywords: string[], take: number = 2): Promise<string[]> => {
    const products = await prisma.product.findMany({
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
    });

    if (products.length > 0) {
      return products.map(p => p.id);
    }

    const fallback = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      take,
      select: { id: true }
    });
    return fallback.map(p => p.id);
  };

  const sofaIds = await findProductIds(['Sofa'], 2);
  const chairAndTableIds = await findProductIds(['Table', 'Chair'], 2);
  const storageAndLampIds = await findProductIds(['Storage', 'Lamp'], 2);
  const careAndTableIds = await findProductIds(['Table', 'Sofa'], 2);

  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 3. Chuẩn bị 4 bài viết cẩm nang THẬT (dài 400 - 700 từ mỗi bài, kiến thức nội thất thuần túy)
  const articles = [
    {
      title: 'Cách đo phòng trước khi mua sofa chuẩn xác từng bước',
      slug: 'cach-do-phong-truoc-khi-mua-sofa',
      categorySlug: 'cam-nang-chon-mua',
      coverImageUrl: '/assets/room_img/phong_khach.png',
      tags: ['sofa', 'phòng khách', 'đo đạc', 'kinh nghiệm mua sắm'],
      seoDescription: 'Hướng dẫn chi tiết các bước đo đạc diện tích phòng khách, hành lang và cửa ra vào trước khi chọn mua sofa để đảm bảo vừa vặn không gian.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: pastDate,
      productIds: sofaIds,
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
          type: 'heading',
          level: 3,
          text: 'Kiểm tra đường vận chuyển từ cửa vào đến phòng khách'
        },
        {
          type: 'paragraph',
          text: 'Nhiều gia đình đo rất cẩn thận phòng khách nhưng lại quên mất kích thước lọt lòng của thang máy, khúc cua cầu thang bộ và cánh cửa chính. Bạn cần ghi chép lại chiều rộng và chiều cao mở hết cỡ của tất cả các cánh cửa mà sofa sẽ đi qua. Đối với các căn hộ chung cư, hãy đo đường chéo của thùng thang máy để chắc chắn rằng chiều dài phủ bì của khung ghế có thể đặt vừa vặn.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Mẹo hình dung kích thước thực tế bằng băng dính giấy'
        },
        {
          type: 'paragraph',
          text: 'Trước khi chốt đơn hàng, hãy dùng cuộn băng dính giấy dán trực tiếp lên mặt sàn đúng bằng kích thước ngang và sâu của mẫu sofa bạn đang chọn. Hãy để nguyên vị trí dán đó trong một ngày và sinh hoạt bình thường. Bạn sẽ cảm nhận rõ ràng chiếc ghế chiếm bao nhiêu diện tích mặt sàn và liệu lối đi có bị cản trở vào ban đêm hay lúc có khách đến chơi hay không.'
        },
        {
          type: 'products',
          title: 'Gợi ý các mẫu sofa cân đối cho phòng khách',
          productIds: sofaIds
        }
      ]
    },
    {
      title: 'Nghệ thuật phối màu theo phong cách tối giản thanh lịch',
      slug: 'phoi-mau-theo-phong-cach-toi-gian',
      categorySlug: 'xu-huong',
      coverImageUrl: '/assets/room_img/phong_ngu.png',
      tags: ['phong cách tối giản', 'phối màu', 'xu hướng nội thất', 'thiết kế'],
      seoDescription: 'Khám phá cách kết hợp bảng màu trung tính, độ tương phản ánh sáng và bề mặt vật liệu để tạo nên không gian sống tối giản ấm cúng.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: pastDate,
      productIds: chairAndTableIds,
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
          type: 'heading',
          level: 3,
          text: 'Tạo chiều sâu bằng vân bề mặt thay vì nhiều màu sặc sỡ'
        },
        {
          type: 'paragraph',
          text: 'Để một căn phòng ít màu không bị cảm giác buồn tẻ, bí quyết nằm ở việc sử dụng đa dạng chất cảm bề mặt. Một mảng tường vữa mịn khi đặt cạnh chiếc bàn gỗ có vân sần tự nhiên, tấm thảm dệt sợi len dày và đệm tựa bằng vải lanh thô mộc sẽ tạo nên sự phong phú mà mắt người có thể cảm nhận ngay lập tức mà không cần bất kỳ gam màu chói lọi nào.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Vai trò của ánh sáng ấm đối với bảng màu trung tính'
        },
        {
          type: 'paragraph',
          text: 'Ánh sáng đèn vào buổi tối có thể thay đổi hoàn toàn tông màu của nội thất. Đối với không gian tối giản dùng tông trắng và xám, việc chọn bóng đèn có nhiệt độ màu ấm áp khoảng hai nghìn bảy trăm đến ba nghìn Kelvin sẽ biến các diện tường trắng lạnh trở nên dịu mắt và ấm cúng như chiếc kén nhỏ bình yên cho gia đình sum họp.'
        },
        {
          type: 'products',
          title: 'Các món nội thất mang gam màu trung tính nhã nhặn',
          productIds: chairAndTableIds
        }
      ]
    },
    {
      title: 'Giải pháp bố trí phòng khách nhỏ thoáng đãng và tiện nghi',
      slug: 'bo-tri-phong-khach-nho',
      categorySlug: 'meo-khong-gian',
      coverImageUrl: '/assets/room_img/phong_khach.png',
      tags: ['phòng khách nhỏ', 'mẹo không gian', 'tiết kiệm diện tích', 'bố trí nội thất'],
      seoDescription: 'Cẩm nang sắp xếp phòng khách diện tích vừa và nhỏ thông minh, tận dụng ánh sáng tự nhiên và lựa chọn nội thất chân cao tạo cảm giác rộng rãi.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: pastDate,
      productIds: storageAndLampIds,
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
          type: 'heading',
          level: 3,
          text: 'Các mẹo bố trí thực tế không thể bỏ qua'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Sử dụng bàn trà đôi lồng nhau: Khi tiếp khách đông có thể kéo rời ra, khi cần không gian cho trẻ nhỏ chơi đùa thì lồng gọn lại một góc.',
            'Khai thác chiều cao của tường: Thay vì dùng kệ tủ đứng chiếm chỗ mặt đất, hãy lắp các đợt kệ treo tường thanh thoát để trưng bày sách và đồ lưu niệm.',
            'Tận dụng gương phản chiếu ánh sáng: Treo một chiếc gương có khung đơn giản vuông góc với cửa sổ ban công giúp nhân đôi ánh sáng trời vào góc khuất.',
            'Quy hoạch luồng di chuyển xuyên suốt: Tránh đặt đôn ghế hay bàn phụ ngay trên đường đi từ cửa chính đến ban công hoặc vào bếp.'
          ]
        },
        {
          type: 'heading',
          level: 3,
          text: 'Lựa chọn rèm cửa treo cao kịch trần'
        },
        {
          type: 'paragraph',
          text: 'Một mẹo thị giác đơn giản nhưng vô cùng hiệu quả là lắp thanh suốt rèm cửa sát mép trần thay vì chỉ gắn ngay phía trên khung cửa sổ. Rèm vải buông dài chạm sàn sẽ kéo dài trục đứng của căn phòng, khiến trần nhà như cao thêm và khung cửa kính trông hoành tráng hơn.'
        },
        {
          type: 'products',
          title: 'Sản phẩm lưu trữ và đèn chiếu sáng gọn gàng',
          productIds: storageAndLampIds
        }
      ]
    },
    {
      title: 'Bí quyết bảo dưỡng sofa và bàn ghế gỗ tự nhiên bền đẹp',
      slug: 'cham-soc-sofa-va-go',
      categorySlug: 'cham-soc-noi-that',
      coverImageUrl: '/assets/room_img/phong_an.png',
      tags: ['chăm sóc nội thất', 'bảo dưỡng sofa', 'gỗ tự nhiên', 'vệ sinh nhà cửa'],
      seoDescription: 'Hướng dẫn chuẩn xác các phương pháp làm sạch sofa vải, dưỡng chất liệu da và bảo quản bề mặt gỗ tự nhiên chống ẩm mốc, cong vênh theo mùa.',
      authorName: 'Ban biên tập DCor',
      status: 'PUBLISHED',
      publishedAt: pastDate,
      productIds: careAndTableIds,
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
          type: 'heading',
          level: 3,
          text: 'Bảo vệ mặt bàn và tủ kệ gỗ trước độ ẩm và nhiệt độ'
        },
        {
          type: 'paragraph',
          text: 'Mặt bàn ăn và bàn trà gỗ rất nhạy cảm với nhiệt độ cao từ đáy nồi canh hoặc cốc nước đá lạnh toát mồ hôi. Hãy tạo thói quen sử dụng đế lót ly cách nhiệt và khăn trải bàn dệt sợi tự nhiên. Khi lau chùi đồ gỗ, chỉ dùng khăn sợi nhỏ vắt ráo nước gần như khô hoàn toàn và lau nhẹ xuôi theo chiều vân gỗ. Tránh xịt các dung dịch tẩy rửa hóa chất đa năng trực tiếp lên bề mặt vì chúng có thể làm bong tróc lớp dầu bóng bảo vệ tự nhiên của thớ gỗ.'
        },
        {
          type: 'heading',
          level: 3,
          text: 'Dán miếng đệm nỉ dưới chân bàn ghế'
        },
        {
          type: 'paragraph',
          text: 'Một việc nhỏ nhưng mang lại lợi ích to lớn là dán các miếng nỉ tròn mềm dưới chân tất cả các ghế ăn, bàn trà và tủ kệ. Miếng lót này ngăn chặn hoàn toàn tiếng ồn khó chịu khi kéo đẩy ghế và bảo vệ lớp sàn gỗ đắt giá trong nhà bạn khỏi những vết trầy xước không thể khắc phục.'
        },
        {
          type: 'products',
          title: 'Sản phẩm bàn ghế gỗ và sofa được ưa chuộng',
          productIds: careAndTableIds
        }
      ]
    }
  ];

  for (const art of articles) {
    const categoryId = categoryMap.get(art.categorySlug);
    if (!categoryId) {
      console.warn(`[WARN] Không tìm thấy categoryId cho slug: ${art.categorySlug}`);
      continue;
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: art.slug }
    });

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
      likesCount: 12,
      viewsCount: 350
    };

    if (existingPost) {
      await prisma.blogPost.update({
        where: { id: existingPost.id },
        data: postData
      });
      console.log(`-> Đã cập nhật bài viết: "${art.title}" (slug: ${art.slug})`);
    } else {
      await prisma.blogPost.create({
        data: postData
      });
      console.log(`-> Đã tạo mới bài viết: "${art.title}" (slug: ${art.slug})`);
    }
  }

  console.log('--- HOÀN THÀNH SEED DỮ LIỆU BLOG THÀNH CÔNG ---');
}

seedBlog()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('[ERROR] Lỗi khi seed blog:', err);
    process.exit(1);
  });

