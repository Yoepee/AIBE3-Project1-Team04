'use client';

import Link from 'next/link';
import { getStayDuration } from '@/lib/place';
import { formatCost } from '@/lib/place';
import { formatCategories, formatRegions } from '@/lib/post';
import { PostWithUserAction } from '@/types/post.type';
import { format } from 'date-fns';
import { DUMMY_IMAGE_URL } from '@/consts';

export default function PostCard({ post }: { post: PostWithUserAction }) {
  const total_cost = post.places.reduce((sum, place) => sum + place.cost, 0);
  return (
    <Link href={`/posts/${post.id}`}>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="relative">
          <img
            src={DUMMY_IMAGE_URL}
            alt={post?.title || '여행 제목'}
            className="w-full h-48 object-cover object-top"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
              {formatCategories(post.places)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-full">
              {formatRegions(post.places)}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{post.title}</h3>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <i className="ri-map-pin-line mr-1 w-4 h-4 flex items-center justify-center" />
            <span className="line-clamp-1">{formatRegions(post.places)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <i className="ri-user-line mr-1 w-4 h-4 flex items-center justify-center" />
              <span>{post.user_name ?? '-'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <i className="ri-star-fill text-yellow-400 mr-1 w-4 h-4 flex items-center justify-center" />
              <span className="font-medium text-gray-900">{post.average_rating ?? 0}</span>
              <span className="text-gray-500 text-sm ml-1">({post.rating_count})</span>

              <i className="ri-eye-line ml-4 mr-1 w-4 h-4 flex items-center justify-center" />
              <span>{post.view_count}</span>
            </div>

            <div className="text-blue-600 font-bold">{formatCost(total_cost)}</div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <i className="ri-calendar-line mr-1 w-4 h-4 flex items-center justify-center" />
                <span>{getStayDuration(post.visit_start_time, post.visit_end_time)}</span>
                <span className="mx-2">•</span>
                <span>
                  {post.visit_start_time ? format(post.visit_start_time, 'yyyy-MM-dd') : '-'}
                </span>
              </div>
              <button
                type="button"
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                  post.liked_by_me ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <i className={`ri-heart-${post.liked_by_me ? 'fill' : 'line'} w-4 h-4`} />
                <span>{post.like_count}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
