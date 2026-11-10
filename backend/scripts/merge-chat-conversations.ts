import os from 'os';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma';
import { extractPhoneNumber } from '../src/services/chat-text.util';

/**
 * Script gộp hội thoại trùng lặp: MỖI NGƯỜI MỘT HỘI THOẠI DUY NHẤT
 * 
 * Cách chạy:
 * Dry-run (mặc định):
 *   npx ts-node scripts/merge-chat-conversations.ts
 * Apply thay đổi:
 *   npx ts-node scripts/merge-chat-conversations.ts --apply
 * Purge empty guest conversations (> 24h không có tin CUSTOMER):
 *   npx ts-node scripts/merge-chat-conversations.ts --apply --purge-empty
 */

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isPurgeEmpty = args.includes('--purge-empty');
  const isMergeSameName = args.includes('--merge-same-name');

  // Xử lý cờ --only <tiền tố khóa nhóm>
  const onlyIndex = args.indexOf('--only');
  let onlyPrefix: string | null = null;
  if (onlyIndex !== -1 && args[onlyIndex + 1] && !args[onlyIndex + 1].startsWith('--')) {
    onlyPrefix = args[onlyIndex + 1].trim();
  }

  console.log('================================================================');
  console.log('🔄 DCOR CHAT - SCRIPT GỘP DỮ LIỆU CŨ (MỖI NGƯỜI 1 HỘI THOẠI)');
  console.log(`Chế độ: ${isApply ? '🚀 APPLY (GHI DATABASE)' : '🔍 DRY-RUN (CHỈ KIỂM TRA & IN BÁO CÁO)'}`);
  if (isPurgeEmpty) {
    console.log('Tùy chọn: Đã bật --purge-empty (xóa hội thoại rỗng > 24h)');
  }
  if (isMergeSameName) {
    console.log('Tùy chọn: Đã bật --merge-same-name (gộp khách vãng lai trùng tên & trùng/không SĐT)');
  }
  if (onlyPrefix) {
    console.log(`Tùy chọn: Chỉ xử lý nhóm có tiền tố khóa: "${onlyPrefix}"`);
  }
  console.log('================================================================\n');

  // 1. Sao lưu 4 bảng chat ra os.tmpdir() trước khi ghi
  if (isApply) {
    console.log('📦 Đang tạo bản sao lưu dữ liệu chat ra thư mục tạm hệ thống...');
    const backupDir = os.tmpdir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `dcor-chat-backup-${timestamp}.json`);

    const [conversations, messages, scripts, settings] = await Promise.all([
      prisma.chatConversation.findMany(),
      prisma.chatMessage.findMany(),
      prisma.chatBotScript.findMany(),
      prisma.chatSetting.findMany(),
    ]);

    const backupData = {
      createdAt: new Date().toISOString(),
      conversations,
      messages,
      scripts,
      settings,
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`✅ Đã xuất bản sao lưu an toàn tại: ${backupFile}\n`);
  }

  // 2. Thống kê trước khi gộp
  const totalConvsBefore = await prisma.chatConversation.count();
  const totalMsgsBefore = await prisma.chatMessage.count();
  const allConversations = await prisma.chatConversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
  });

  const allCustomers = await prisma.customer.findMany({
    select: { id: true, phone: true, fullName: true },
  });

  // Map phone -> customerId (chỉ phone VN hợp lệ và không phải GOOG_)
  const phoneToCustomerMap = new Map<string, string>();
  for (const c of allCustomers) {
    if (c.phone && !c.phone.startsWith('GOOG_')) {
      const clean = extractPhoneNumber(c.phone) || c.phone.replace(/\s+/g, '').replace('+84', '0').replace(/^84/, '0');
      if (clean && clean.length === 10) {
        phoneToCustomerMap.set(clean, c.id);
      }
    }
  }

  // 3. Phân nhóm hội thoại theo quy tắc:
  // (a) cùng customerId
  // (b) chưa có customerId nhưng guestPhone là SĐT VN hợp lệ trùng SĐT một Customer thật thì thuộc customerId đó
  // (c) cùng guestPhone hợp lệ khi không có Customer thì gộp theo SĐT
  // (d) cờ --merge-same-name: gộp các hội thoại khách vãng lai có CÙNG tên không rỗng và không phải mặc định khi cùng trùng SĐT hoặc cùng không có SĐT
  // (e) guest không có định danh thì KHÔNG gộp (mỗi hội thoại 1 nhóm riêng)
  const groupMap = new Map<string, typeof allConversations>();

  let emptyGuestPurgeCandidates: string[] = [];
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Thu thập danh sách nghi trùng tên cho dry-run report
  const sameNameSuspectsMap = new Map<string, typeof allConversations>();
  for (const conv of allConversations) {
    if (!conv.customerId && conv.guestName) {
      const trimmed = conv.guestName.trim();
      if (trimmed && trimmed !== 'Khách vãng lai' && !trimmed.startsWith('Khách vãng lai #')) {
        let phoneKey = 'NO_PHONE';
        if (conv.guestPhone && !conv.guestPhone.startsWith('GOOG_')) {
          const ext = extractPhoneNumber(conv.guestPhone);
          if (ext && ext.length === 10) phoneKey = ext;
        }
        const suspectKey = `${trimmed}___${phoneKey}`;
        if (!sameNameSuspectsMap.has(suspectKey)) sameNameSuspectsMap.set(suspectKey, []);
        sameNameSuspectsMap.get(suspectKey)!.push(conv);
      }
    }
  }

  for (const conv of allConversations) {
    let groupKey: string | null = null;

    if (conv.customerId) {
      groupKey = `CUSTOMER:${conv.customerId}`;
    } else {
      let validPhone: string | null = null;
      if (conv.guestPhone && !conv.guestPhone.startsWith('GOOG_')) {
        const extracted = extractPhoneNumber(conv.guestPhone);
        if (extracted && extracted.length === 10) {
          validPhone = extracted;
        }
      }

      if (validPhone) {
        const matchedCustId = phoneToCustomerMap.get(validPhone);
        if (matchedCustId) {
          groupKey = `CUSTOMER:${matchedCustId}`;
        } else {
          groupKey = `PHONE:${validPhone}`;
        }
      } else if (isMergeSameName) {
        const trimmed = (conv.guestName || '').trim();
        if (trimmed && trimmed !== 'Khách vãng lai' && !trimmed.startsWith('Khách vãng lai #')) {
          groupKey = `GUEST_NAME_NO_PHONE:${trimmed}`;
        } else {
          groupKey = `ANON_GUEST:${conv.id}`;
        }
      } else {
        // Guest không có định danh -> không gộp
        groupKey = `ANON_GUEST:${conv.id}`;
      }

      if (groupKey.startsWith('ANON_GUEST:')) {
        // Kiểm tra ứng viên xóa nếu là guest rỗng và cũ hơn 24h
        const ageMs = now - new Date(conv.createdAt).getTime();
        if (ageMs > ONE_DAY_MS) {
          emptyGuestPurgeCandidates.push(conv.id);
        }
      }
    }

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(conv);
  }

  // Lọc chính xác các guest rỗng không có tin nhắn CUSTOMER
  let purgeCount = 0;
  const purgeIdsToDelete: string[] = [];

  if (emptyGuestPurgeCandidates.length > 0) {
    const customerMsgs = await prisma.chatMessage.findMany({
      where: {
        conversationId: { in: emptyGuestPurgeCandidates },
        senderType: 'CUSTOMER',
      },
      select: { conversationId: true },
    });
    const convsWithCustomerMsg = new Set(customerMsgs.map((m) => m.conversationId));

    for (const id of emptyGuestPurgeCandidates) {
      if (!convsWithCustomerMsg.has(id)) {
        purgeIdsToDelete.push(id);
      }
    }
    purgeCount = purgeIdsToDelete.length;
  }

  // Thống kê các nhóm cần gộp (size > 1)
  const mergeGroups: Array<{ key: string; convs: typeof allConversations }> = [];
  for (const [key, convs] of groupMap.entries()) {
    if (convs.length > 1) {
      mergeGroups.push({ key, convs });
    }
  }

  mergeGroups.sort((a, b) => b.convs.length - a.convs.length);

  // In Báo cáo Dry-run
  console.log('📊 BÁO CÁO TỔNG QUAN:');
  console.log(`- Tổng số hội thoại trước khi xử lý: ${totalConvsBefore}`);
  console.log(`- Số nhóm hội thoại cần gộp (có từ 2 hội thoại trở lên): ${mergeGroups.length}`);
  const totalConvsToMerge = mergeGroups.reduce((acc, g) => acc + g.convs.length, 0);
  const convsReduced = totalConvsToMerge - mergeGroups.length;
  console.log(`- Số lượng hội thoại dư thừa sẽ được gộp: ${convsReduced}`);
  console.log(`- Dự kiến tổng số hội thoại sau gộp: ${totalConvsBefore - convsReduced}`);
  console.log(`- Số hội thoại guest rỗng (>24h không có tin nhắn khách) đủ điều kiện xóa: ${purgeCount}`);
  if (isPurgeEmpty && isApply) {
    console.log(`  -> Sẽ xóa thêm ${purgeCount} hội thoại guest rỗng.`);
  }

  // Liệt kê các hội thoại không có customerId, không có guestTokenHash và không có tin nhắn của khách
  const orphanConvs = await prisma.chatConversation.findMany({
    where: {
      customerId: null,
      guestTokenHash: null,
      messages: {
        none: { senderType: 'CUSTOMER' },
      },
    },
    select: { id: true, guestName: true, guestPhone: true, createdAt: true },
  });
  console.log(`- Số hội thoại không customerId, không guestTokenHash và không có tin khách: ${orphanConvs.length}`);
  if (orphanConvs.length > 0) {
    console.log('  Danh sách hội thoại không định danh & không tin khách:');
    orphanConvs.forEach((c) => console.log(`   * ID: ${c.id} | Tên: ${c.guestName} | Phone: ${c.guestPhone} | Tạo lúc: ${c.createdAt}`));
  }

  // Danh sách nghi trùng tên (guest có cùng tên, cùng trùng hoặc không SĐT)
  const suspectList: Array<{ name: string; phone: string; count: number; ids: string[] }> = [];
  for (const [key, convs] of sameNameSuspectsMap.entries()) {
    if (convs.length > 1) {
      const [name, phone] = key.split('___');
      suspectList.push({
        name,
        phone: phone === 'NO_PHONE' ? 'Không có SĐT' : phone,
        count: convs.length,
        ids: convs.map((c) => c.id),
      });
    }
  }

  console.log('\n🔎 DANH SÁCH NGHI TRÙNG TÊN (GUEST CÙNG TÊN & TRÙNG/KHÔNG SĐT):');
  if (suspectList.length === 0) {
    console.log('  (Không có trường hợp nào nghi trùng tên)');
  } else {
    suspectList.forEach((s, idx) => {
      console.log(`  ${idx + 1}. Tên: "${s.name}" | SĐT: ${s.phone} | Số lượng: ${s.count} hội thoại`);
      console.log(`     -> ID các hội thoại: ${s.ids.join(', ')}`);
    });
    if (!isMergeSameName) {
      console.log('  💡 Lưu ý: Mặc định KHÔNG tự động gộp các nhóm này. Hãy thêm cờ --merge-same-name nếu bạn muốn gộp.');
    }
  }

  console.log('\n🏆 TOP 10 NHÓM HỘI THOẠI LỚN NHẤT ĐƯỢC GỘP:');
  const top10 = mergeGroups.slice(0, 10);
  if (top10.length === 0) {
    console.log('  (Không có nhóm nào cần gộp - Dữ liệu đã chuẩn hóa 1 người 1 hội thoại)');
  } else {
    top10.forEach((g, idx) => {
      console.log(`  ${idx + 1}. Khóa: ${g.key} | Số hội thoại: ${g.convs.length} | Tên đại diện: ${g.convs[0].guestName || 'Không tên'}`);
    });
  }

  // 4. Nếu có --apply hoặc --only: Lọc danh sách nhóm thực hiện
  let activeMergeGroups = mergeGroups;
  if (onlyPrefix) {
    activeMergeGroups = mergeGroups.filter((g) => g.key.startsWith(onlyPrefix));
    if (activeMergeGroups.length === 0) {
      console.error(`\n❌ Không tìm thấy nhóm nào có khóa bắt đầu bằng tiền tố: "${onlyPrefix}"!`);
      console.error(`   Các khóa có sẵn: ${mergeGroups.map((g) => g.key).join(', ') || '(không có nhóm cần gộp)'}`);
      process.exit(1);
    }
  }

  if (onlyPrefix) {
    console.log(`\n🎯 ĐÃ ÁP DỤNG BỘ LỌC --only "${onlyPrefix}": Sẽ chỉ gộp ${activeMergeGroups.length} nhóm:`);
    activeMergeGroups.forEach((g, idx) => {
      console.log(`   ${idx + 1}. Khóa: ${g.key} (${g.convs.length} hội thoại)`);
    });
  }

  // 5. Nếu có --apply: Tiến hành gộp dữ liệu
  if (isApply) {
    console.log(`\n⚙️ Đang tiến hành gộp dữ liệu ${activeMergeGroups.length} nhóm (mỗi nhóm 1 Transaction độc lập)...`);
    let mergedCount = 0;
    const failedGroups: Array<{ key: string; error: string }> = [];

    // Helper chia lô <= 1000 phần tử
    const chunkArray = <T>(arr: T[], size: number = 1000): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    for (const group of activeMergeGroups) {
      const startTime = Date.now();
      process.stdout.write(`⏳ Đang gộp nhóm [${group.key}] (${group.convs.length} hội thoại)... `);

      // Sắp xếp theo lastMessageAt giảm dần -> hội thoại có tin nhắn mới nhất là hội thoại chính giữ lại
      const sorted = [...group.convs].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      const primary = sorted[0];
      const others = sorted.slice(1);
      const otherIds = others.map((o) => o.id);

      // Xác định customerId nếu có
      let assignedCustId = primary.customerId;
      if (!assignedCustId && group.key.startsWith('CUSTOMER:')) {
        assignedCustId = group.key.replace('CUSTOMER:', '');
      }

      // Xác định mode, assignedStaffId, needsHuman
      let chosenMode = primary.mode;
      let chosenStaffId = primary.assignedStaffId;
      let chosenNeedsHuman = primary.needsHuman;

      const isStaffLevel = (m: string) => m === 'STAFF' || m === 'WAITING_STAFF';
      if (!isStaffLevel(chosenMode)) {
        const staffConv = sorted.find((c) => isStaffLevel(c.mode));
        if (staffConv) {
          chosenMode = staffConv.mode;
          chosenStaffId = staffConv.assignedStaffId;
          chosenNeedsHuman = staffConv.needsHuman;
        }
      }

      // Nối internalNote
      const noteSet = new Set<string>();
      sorted.forEach((c) => {
        if (c.internalNote && c.internalNote.trim()) {
          noteSet.add(c.internalNote.trim());
        }
      });
      const mergedNote = Array.from(noteSet).join('\n---\n');

      // Tính tổng unreadStaff, unreadCustomer
      const totalUnreadStaff = sorted.reduce((sum, c) => sum + (c.unreadStaff || 0), 0);
      const totalUnreadCustomer = sorted.reduce((sum, c) => sum + (c.unreadCustomer || 0), 0);

      // Gộp botState
      let mergedBotState: any = {};
      sorted.forEach((c) => {
        if (c.botState && typeof c.botState === 'object') {
          mergedBotState = { ...mergedBotState, ...(c.botState as any) };
        }
      });

      // Tính lastMessageAt và lastMessagePreview từ các hội thoại trong bộ nhớ
      let latestMessageAt = new Date(primary.lastMessageAt);
      let latestMessagePreview = primary.lastMessagePreview;
      for (const c of sorted) {
        const d = new Date(c.lastMessageAt);
        if (d.getTime() > latestMessageAt.getTime()) {
          latestMessageAt = d;
          latestMessagePreview = c.lastMessagePreview;
        }
      }

      const allGroupConvIds = [primary.id, ...otherIds];
      const otherIdChunks = chunkArray(otherIds, 1000);

      try {
        let movedCount = 0;

        await prisma.$transaction(
          async (tx) => {
            // Đếm tổng tin nhắn của nhóm trước khi gộp
            const countBefore = await tx.chatMessage.count({
              where: { conversationId: { in: allGroupConvIds } },
            });

            // (a) updateMany đặt clientMessageId = null cho tin của các hội thoại phụ (tránh vi phạm unique)
            for (const chunk of otherIdChunks) {
              await tx.chatMessage.updateMany({
                where: { conversationId: { in: chunk } },
                data: { clientMessageId: null },
              });
            }

            // (b) MỘT (hoặc vài theo chunk) updateMany chuyển toàn bộ tin sang hội thoại chính
            for (const chunk of otherIdChunks) {
              const res = await tx.chatMessage.updateMany({
                where: { conversationId: { in: chunk } },
                data: { conversationId: primary.id },
              });
              movedCount += res.count;
            }

            // Kiểm tra tin nhắn thực tế mới nhất trong DB sau khi chuyển
            const latestMsgInDb = await tx.chatMessage.findFirst({
              where: { conversationId: primary.id },
              orderBy: { createdAt: 'desc' },
            });
            if (latestMsgInDb) {
              latestMessageAt = latestMsgInDb.createdAt;
              latestMessagePreview = (latestMsgInDb.content || '[Hình ảnh]').slice(0, 100);
            }

            // (c) MỘT update cho hội thoại chính
            await tx.chatConversation.update({
              where: { id: primary.id },
              data: {
                customerId: assignedCustId || primary.customerId,
                status: 'OPEN',
                mode: chosenMode,
                assignedStaffId: chosenStaffId,
                needsHuman: chosenNeedsHuman,
                unreadStaff: totalUnreadStaff,
                unreadCustomer: totalUnreadCustomer,
                internalNote: mergedNote || null,
                botState: mergedBotState,
                lastMessageAt: latestMessageAt,
                lastMessagePreview: latestMessagePreview,
                closedAt: null,
              },
            });

            // (d) deleteMany hội thoại phụ
            for (const chunk of otherIdChunks) {
              await tx.chatConversation.deleteMany({
                where: { id: { in: chunk } },
              });
            }

            // Đếm tổng tin nhắn sau khi gộp và xác thực bảo toàn dữ liệu
            const countAfter = await tx.chatMessage.count({
              where: { conversationId: primary.id },
            });

            if (countBefore !== countAfter) {
              throw new Error(
                `Lỗi không toàn vẹn tin nhắn! Trước: ${countBefore}, Sau: ${countAfter} (khác nhau). Transaction bị rollback.`
              );
            }
          },
          {
            maxWait: 30000,
            timeout: 120000,
          }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Thành công! Đã chuyển ${movedCount} tin (${duration}s).`);
        mergedCount++;
      } catch (grpErr: any) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`❌ THẤT BÀI (${duration}s): ${grpErr.message}`);
        failedGroups.push({ key: group.key, error: grpErr.message });
      }
    }

    console.log(`\n🏁 Đã xử lý xong: ${mergedCount}/${activeMergeGroups.length} nhóm thành công.`);
    if (failedGroups.length > 0) {
      console.log(`⚠️ Có ${failedGroups.length} nhóm gặp lỗi:`);
      failedGroups.forEach((f) => console.log(`   - [${f.key}]: ${f.error}`));
    }

    // 4. Bước CHUẨN HÓA khi --apply (bằng updateMany hàng loạt):
    // Hội thoại status CLOSED thì chuyển status OPEN; nếu mode STAFF mà có assignedStaffId thì đặt mode BOT, gỡ assignedStaffId và needsHuman
    console.log('\n🧹 Đang thực hiện bước CHUẨN HÓA trạng thái hội thoại toàn hệ thống (bằng updateMany)...');
    const closedStaffNormalized = await prisma.chatConversation.updateMany({
      where: {
        status: 'CLOSED',
        mode: 'STAFF',
      },
      data: {
        status: 'OPEN',
        mode: 'BOT',
        assignedStaffId: null,
        needsHuman: false,
        closedAt: null,
      },
    });
    console.log(`  - Đã chuẩn hóa ${closedStaffNormalized.count} hội thoại CLOSED kèm mode STAFF về status OPEN, mode BOT.`);

    const remainingClosedNormalized = await prisma.chatConversation.updateMany({
      where: {
        status: 'CLOSED',
      },
      data: {
        status: 'OPEN',
        closedAt: null,
      },
    });
    console.log(`  - Đã chuyển ${remainingClosedNormalized.count} hội thoại CLOSED còn lại về status OPEN.`);

    // Xử lý --purge-empty
    if (isPurgeEmpty && purgeIdsToDelete.length > 0) {
      console.log(`\n🧹 Đang xóa ${purgeIdsToDelete.length} hội thoại guest rỗng (> 24h không có tin nhắn khách)...`);
      const purgeChunks = chunkArray(purgeIdsToDelete, 1000);
      for (const chunk of purgeChunks) {
        await prisma.chatConversation.deleteMany({
          where: { id: { in: chunk } },
        });
      }
      console.log(`✅ Đã xóa sạch ${purgeIdsToDelete.length} hội thoại guest rỗng.`);
    }

    // Sau khi gộp xong, thử tạo UNIQUE partial index nếu chưa có
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_chatconversation_customerid_unique"
        ON "ChatConversation" ("customerId")
        WHERE "customerId" IS NOT NULL;
      `);
      console.log('✅ Đã tạo/đảm bảo partial UNIQUE index trên ChatConversation(customerId).');
    } catch (idxErr: any) {
      console.warn('⚠️ Cảnh báo tạo index:', idxErr.message);
    }

    // 5. Kiểm tra và in báo cáo kết thúc
    const totalConvsAfter = await prisma.chatConversation.count();
    const totalMsgsAfter = await prisma.chatMessage.count();

    // Đếm số khách có hơn 1 hội thoại
    const custConvs = await prisma.chatConversation.groupBy({
      by: ['customerId'],
      where: { customerId: { not: null } },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
    });
    const duplicateCustomersCount = custConvs.length;

    console.log('\n================================================================');
    console.log('📊 BÁO CÁO KẾT THÚC:');
    console.log(`- Tổng số hội thoại sau xử lý: ${totalConvsAfter}`);
    console.log(`- Số khách hàng có hơn 1 hội thoại: ${duplicateCustomersCount} (kỳ vọng: 0)`);
    console.log(`- Tổng số tin nhắn: Trước = ${totalMsgsBefore} | Sau = ${totalMsgsAfter} (${totalMsgsBefore === totalMsgsAfter ? '✅ BẢO TOÀN HOÀN TOÀN' : '⚠️ LỆCH'})`);
    console.log('================================================================');

    if (failedGroups.length > 0) {
      console.error('\n❌ Script kết thúc với lỗi ở một số nhóm.');
      process.exit(1);
    }

    console.log('\n🎉 HOÀN THÀNH TOÀN DIỆN!');
  } else {
    console.log('\n💡 Gợi ý: Chạy lệnh dưới đây để thực hiện gộp dữ liệu thật:');
    if (onlyPrefix) {
      console.log(`   npx ts-node scripts/merge-chat-conversations.ts --apply --only ${onlyPrefix}`);
    } else {
      console.log('   npx ts-node scripts/merge-chat-conversations.ts --apply');
    }
    console.log('   (Thêm cờ --purge-empty nếu muốn xóa bỏ các guest rỗng cũ hơn 24 giờ)');
  }
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi thực thi script:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

