import prisma from './prisma';

export const MEMBER_TIER_THRESHOLDS = {
  SILVER: 30_000_000,
  GOLD: 80_000_000,
  DIAMOND: 200_000_000,
} as const;

export const POINTS_PER_VND = 100_000;

export const FULFILLED_ORDER_STATUSES = ['DELIVERED', 'COMPLETED'] as const;

export interface MemberTierInfo {
  tier: 'Kim Cương' | 'Vàng' | 'Bạc' | 'Thành viên';
  badge: 'DIAMOND' | 'GOLD' | 'SILVER' | 'MEMBER';
  minPoints: number;
  nextTierThreshold: number;
}

/**
 * Chuẩn phân hạng thành viên thống nhất toàn hệ thống (Khách hàng, Admin, Báo cáo):
 * - Thành viên: < 30.000.000₫
 * - Bạc:        >= 30.000.000₫
 * - Vàng:       >= 80.000.000₫
 * - Kim Cương:  >= 200.000.000₫
 */
export function calculateMemberTier(totalSpent: bigint | number | string | null | undefined): MemberTierInfo {
  const spent = typeof totalSpent === 'bigint' ? Number(totalSpent) : (Number(totalSpent) || 0);
  if (spent >= MEMBER_TIER_THRESHOLDS.DIAMOND) {
    return { tier: 'Kim Cương', badge: 'DIAMOND', minPoints: 2000, nextTierThreshold: MEMBER_TIER_THRESHOLDS.DIAMOND };
  }
  if (spent >= MEMBER_TIER_THRESHOLDS.GOLD) {
    return { tier: 'Vàng', badge: 'GOLD', minPoints: 800, nextTierThreshold: MEMBER_TIER_THRESHOLDS.DIAMOND };
  }
  if (spent >= MEMBER_TIER_THRESHOLDS.SILVER) {
    return { tier: 'Bạc', badge: 'SILVER', minPoints: 300, nextTierThreshold: MEMBER_TIER_THRESHOLDS.GOLD };
  }
  return { tier: 'Thành viên', badge: 'MEMBER', minPoints: 0, nextTierThreshold: MEMBER_TIER_THRESHOLDS.SILVER };
}

export function calculateRewardPoints(totalSpent: bigint | number | string | null | undefined): number {
  const spent = typeof totalSpent === 'bigint' ? Number(totalSpent) : (Number(totalSpent) || 0);
  return Math.max(0, Math.floor(spent / POINTS_PER_VND));
}

/**
 * Tính lại và lưu đồng bộ Customer.totalSpent & Customer.rewardPoints
 * chỉ dựa trên các đơn hàng đã giao thành công / hoàn tất (DELIVERED, COMPLETED).
 */
export async function syncCustomerLoyalty(customerId: string | null | undefined): Promise<{
  totalSpent: number;
  rewardPoints: number;
  tierInfo: MemberTierInfo;
} | null> {
  if (!customerId) return null;
  try {
    const agg = await prisma.order.aggregate({
      where: {
        customerId,
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalSpentBigInt = agg._sum.totalAmount ?? BigInt(0);
    const totalSpent = Number(totalSpentBigInt);
    const rewardPoints = calculateRewardPoints(totalSpent);

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: totalSpentBigInt,
        rewardPoints,
      },
    });

    return {
      totalSpent,
      rewardPoints,
      tierInfo: calculateMemberTier(totalSpent),
    };
  } catch (err) {
    console.warn(`[Loyalty] Không thể đồng bộ hạng thành viên cho customer ${customerId}:`, err);
    return null;
  }
}
