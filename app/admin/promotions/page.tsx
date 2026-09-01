import { redirect } from 'next/navigation';

export default function PromotionsRootRedirect() {
  redirect('/admin/promotions/vouchers');
}
