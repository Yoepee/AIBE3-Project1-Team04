'use client';

import ActivitySummary from './ActivitySummary';
import WritingPostListTab from './WritingPostListTab';
import CompletedPostListTab from './CompletedPostListTab';
import PlaceListTab from './PlaceListTab';
import MyTabs from './MyTabs';
import { useMypage } from '@/hooks/useMypage';
import ProfileHeader from './ProfileHeader';

export default function MyPage() {
  const { activeTab, setActiveTab } = useMypage();
  const { userName, numOfPost, numOfPlace, numOfLikes, postList, notPostList, placeList } =
    useMypage();

  return (
    <>
      <ProfileHeader userName={userName} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ActivitySummary numOfPost={numOfPost} numOfPlace={numOfPlace} numOfLikes={numOfLikes} />

          <MyTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* 탭 콘텐츠 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* 임시저장 탭 */}
            {activeTab === 'drafts' && <WritingPostListTab notPostList={notPostList} />}

            {/* 내 게시글 탭 */}
            {activeTab === 'posts' && <CompletedPostListTab postList={postList} />}

            {/* 내 여행지 탭 */}
            {activeTab === 'places' && <PlaceListTab placeList={placeList} />}
          </div>
        </div>
      </div>
    </>
  );
}
