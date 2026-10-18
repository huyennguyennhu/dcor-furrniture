export function getParentCategory(childCategory: string): string {
  if (!childCategory) return 'Sofa';
  const category = childCategory.toLowerCase();
  if (category.includes('sofa') || category.includes('chaise')) return 'Sofa';
  if (category.includes('chair') || category.includes('bench') || category.includes('stool') || category.includes('recliner') || category.includes('poufs') || category.includes('cushion') || category.includes('seat')) return 'Ghế';
  if (category.includes('table') || category.includes('desk') || (category.includes('stand') && !category.includes('night'))) return 'Bàn';
  if (category.includes('storage') || category.includes('shelf') || category.includes('shelves') || category.includes('bookcase') || category.includes('board') || category.includes('unit') || category.includes('chest') || category.includes('drawer') || category.includes('system') || category.includes('night') || category.includes('hallway')) return 'Tủ Kệ';
  if (category.includes('bed') || category.includes('daybed')) return 'Giường';
  if (category.includes('lamp') || category.includes('pendant') || category.includes('lighting')) return 'Đèn';
  if (category.includes('rug') || category.includes('carpet')) return 'Thảm';
  return 'Phụ Kiện';
}
