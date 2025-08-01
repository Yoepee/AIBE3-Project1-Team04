import { SortOption } from '@/components/posts/SortButton';

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: '최신순', value: 'latest' },
  { label: '조회순', value: 'popular' },
  { label: '평점순', value: 'rating' },
  { label: '좋아요순', value: 'likes' },
  { label: '비용순', value: 'cost' },
];
