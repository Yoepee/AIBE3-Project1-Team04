'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlaceForm from '@/components/places/PlaceForm';
import { usePostPlacesStore } from '@/stores/PostPlacesStore';
import PostedPlaceCard from '@/components/places/PostedPlaceCard';
import { usePlace } from '@/hooks/usePlace';
import { useRegion } from '@/hooks/useRegion';
import { differenceInCalendarDays, isAfter, isBefore, max, min } from 'date-fns';
import { INIT_POST_FORM_VALUE } from '@/consts';
import { useAuth } from '@/hooks/useAuth';
import { usePost } from '@/hooks/usePost';
import { isEqual } from 'lodash';
import { validatePlace } from '@/lib/post';
import usePostEdit from '@/hooks/usePostEdit';
import { supabase } from '@/lib/supabaseClient';

export default function PostForm() {
  const [postData, setPostData] = useState(INIT_POST_FORM_VALUE);
  const { postId, resData, setResData, router } = usePostEdit();
  const { user } = useAuth();
  const { cities, fetchPlaceCities } = useRegion();
  const { createPost, linkPostToPlaces } = usePost();
  const {
    createPlace,
    uploadPlaceImage,
    setRepresentativeImage,
    updatePlace,
    deleteAllPlaceImages,
  } = usePlace();
  const currentPlace = usePostPlacesStore((state) => state.currentPlace);
  const images = usePostPlacesStore((state) => state.images);
  const postedPlaces = usePostPlacesStore((state) => state.postedPlaces);
  const isEditingPlace = usePostPlacesStore((state) => state.isEditingPlace);
  const editingPlaceId = usePostPlacesStore((state) => state.editingPlaceId);
  const representativePlaceId = usePostPlacesStore((state) => state.representativePlaceId);
  const addPostedPlace = usePostPlacesStore((state) => state.addPostedPlace);
  const updatePostedPlace = usePostPlacesStore((state) => state.updatePostedPlace);
  const initPlaceFormData = usePostPlacesStore((state) => state.initPlaceFormData);
  const cancelEditingPlace = usePostPlacesStore((state) => state.cancelEditingPlace);
  const resetPostedPlaces = usePostPlacesStore((state) => state.resetPostedPlaces);
  const addAllPostedPlaces = usePostPlacesStore((state) => state.addAllPostedPlaces);
  const setRepresentativePlaceId = usePostPlacesStore((state) => state.setRepresentativePlaceId);

  useEffect(() => {
    fetchPlaceCities();
  }, [fetchPlaceCities]);

  useEffect(() => {
    resetPostedPlaces();
  }, [resetPostedPlaces]);

  useEffect(() => {
    setPostData({
      title: resData.post.title,
      content: resData.post.content,
    });
    addAllPostedPlaces(
      resData.places.map((place) => ({
        place_id: place.place_id,
        currentPlace: {
          ...place.currentPlace,
          visit_start_time: new Date(place.currentPlace.visit_start_time),
          visit_end_time: new Date(place.currentPlace.visit_end_time),
          memo: place.currentPlace.memo || '',
        },
        images: place.currentPlace.images.map((image) => ({
          image_file: new File([image.image_url], 'image.jpg', { type: 'image/jpeg' }),
          image_string: image.image_url,
          is_representative: place.currentPlace.rep_image_url === image.image_url,
        })),
      }))
    );
    setRepresentativePlaceId(resData.post.representative_place_id);
  }, [addAllPostedPlaces, resData]);

  /** 여행지 등록 */
  const handleAddPlace = async (e: React.FormEvent, isviewed: boolean = true) => {
    e.preventDefault();

    try {
      if (!validatePlace(currentPlace, postedPlaces)) return;
      const newCurrentPlace = { ...currentPlace, isviewed };
      const place = await createPlace(newCurrentPlace);

      const finalImages = [...images];
      if (finalImages.length > 0) {
        const hasRepresentative = finalImages.some((img) => img.is_representative);
        if (!hasRepresentative) {
          finalImages[0] = {
            ...finalImages[0],
            is_representative: true,
          };
        }
        const image = await uploadPlaceImage(place.id, finalImages);
        const representativeImage = image.saved.find((image) => image.is_representative);
        if (representativeImage) {
          await setRepresentativeImage(place.id, representativeImage.id);
        }
      }

      addPostedPlace({ place_id: place.id, currentPlace: newCurrentPlace, images: finalImages });
      initPlaceFormData();
    } catch (error) {
      console.error('여행지 생성 중 오류 발생:', error);
    }
  };

  /** 여행지 수정 */
  const handleUpdatePlace = async (e: React.FormEvent, isviewed: boolean = true) => {
    e.preventDefault();
    if (!editingPlaceId) return;
    try {
      const newCurrentPlace = {
        name: currentPlace.name,
        category: currentPlace.category,
        city_id: currentPlace.city_id,
        state_id: currentPlace.state_id,
        cost: currentPlace.cost,
        visit_start_time: currentPlace.visit_start_time,
        visit_end_time: currentPlace.visit_end_time,
        memo: currentPlace.memo,
        isviewed,
      };
      console.log('place : ', newCurrentPlace);

      const place = await updatePlace(editingPlaceId, newCurrentPlace);
      const postedPlace = postedPlaces.find((place) => place.place_id === editingPlaceId)!;

      /** 이미지가 달라진 경우 */
      const finalImages = [...images];
      if (!isEqual(postedPlace.images, finalImages)) {
        await deleteAllPlaceImages(editingPlaceId);
        // 새로 업로드할 이미지가 있는 경우에만 업로드 수행
        if (finalImages.length > 0) {
          const hasRepresentative = finalImages.some((img) => img.is_representative);
          if (!hasRepresentative) {
            finalImages[0] = {
              ...finalImages[0],
              is_representative: true,
            };
          }
          const image = await uploadPlaceImage(place.id, finalImages);
          const representativeImage = image.saved.find((image) => image.is_representative);
          if (representativeImage) {
            await setRepresentativeImage(place.id, representativeImage.id);
          }
        }
      }

      updatePostedPlace({ place_id: place.id, currentPlace: newCurrentPlace, images: finalImages });
      initPlaceFormData();
      cancelEditingPlace();
    } catch (error) {
      console.error('여행지 수정 중 오류 발생:', error);
    }
  };

  /** 게시물 등록 */
  const handleUpdatePost = async (e: React.FormEvent, isviewd: boolean = true) => {
    e.preventDefault();
    if (!user) return;
    const visiblePlaces = postedPlaces.filter((place) => place.currentPlace.isviewed !== false);

    if (!postData.title || !postData.content || visiblePlaces.length === 0) {
      alert('제목, 내용, 그리고 최소 1개의 여행지를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase.rpc('update_editpost', {
        _post_id: postId,
        _title: postData.title,
        _content: postData.content,
        _place_ids: visiblePlaces.map((place) => place.place_id),
        _is_viewed: isviewd,
        _representative_place_id: representativePlaceId,
      });

      if (error) {
        console.error('게시글 수정 오류:', error);
        throw error;
      }

      // data는 VOID 반환이기 때문에 undefined,
      // 만약 성공 후 추가 작업 (리다이렉트나 스낵바 표시 등)
      console.log('게시글이 성공적으로 업데이트되었습니다.');

      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error('[게시글 등록 실패]', error);
    }
  };

  // 여행지 개수와 총 비용 계산
  const visiblePlaces = postedPlaces.filter((place) => place.currentPlace.isviewed === true);
  const totalPlaces = visiblePlaces.length;
  const totalCost = visiblePlaces.reduce((sum, place) => sum + place.currentPlace.cost, 0);
  const startTimes = visiblePlaces.map((p) => p.currentPlace.visit_start_time);
  const endTimes = visiblePlaces.map((p) => p.currentPlace.visit_end_time);
  const firstVisitTime = startTimes.length > 0 ? min(startTimes) : null;
  const lastVisitTime = endTimes.length > 0 ? max(endTimes) : null;

  return (
    <div className="space-y-8">
      {/* 게시글 기본 정보 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6">기본 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={postData.title}
              onChange={(e) => setPostData({ ...postData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="여행 제목을 입력하세요"
              // NOTE : maxLength 확인 필요
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">{postData.title.length}/100자</div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">여행 내용</label>
            <textarea
              value={postData.content}
              onChange={(e) => setPostData({ ...postData, content: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="여행 경험과 팁을 자세히 공유해주세요..."
              // NOTE : maxLength 확인 필요
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 mt-1">{postData.content.length}/2000자</div>
          </div>
        </div>
      </div>

      {/* 여행 요약 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-xl font-bold mb-4">여행 요약</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{totalPlaces}</div>
            <div className="text-sm opacity-90">등록된 여행지</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{totalCost.toLocaleString()}</div>
            <div className="text-sm opacity-90">총 예상 비용 (원)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {firstVisitTime && lastVisitTime
                ? differenceInCalendarDays(lastVisitTime, firstVisitTime) + 1
                : 0}
            </div>
            <div className="text-sm opacity-90">총 여행 기간 (일)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {totalPlaces > 0 ? Math.round(totalCost / totalPlaces).toLocaleString() : 0}
            </div>
            <div className="text-sm opacity-90">평균 여행 비용 (원)</div>
          </div>
        </div>
      </div>

      {/* 여행지 등록 (수정 모드가 아닐 때만 표시) */}
      {!isEditingPlace && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">여행지 등록</h2>
          <PlaceForm type={'new'} callback={handleAddPlace} />
        </div>
      )}

      {/* 등록된 여행지 목록 */}
      {postedPlaces.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">등록된 여행지 ({postedPlaces.length}개)</h2>

          <div className="space-y-4">
            {postedPlaces.map((place) => (
              <div key={place.place_id}>
                {/* 여행지 카드 */}
                <PostedPlaceCard postedPlace={place} />

                {/* 해당 여행지의 수정 패널 (해당 여행지가 수정 중일 때만 표시) */}
                {isEditingPlace && editingPlaceId === place.place_id && (
                  <div className="bg-blue-50 rounded-lg shadow-sm p-4 border-2 border-blue-200 mt-3">
                    <h3 className="text-lg font-bold mb-4 text-blue-800">여행지 수정</h3>

                    <PlaceForm type={'edit'} callback={handleUpdatePlace} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 작성 완료 버튼 */}
      <div className="flex justify-center gap-4">
        <Link
          href="/posts"
          className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 font-medium whitespace-nowrap cursor-pointer"
        >
          취소
        </Link>
        <button
          onClick={(e) => handleUpdatePost(e, false)}
          className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium whitespace-nowrap cursor-pointer"
        >
          임시 저장
        </button>
        <button
          onClick={(e) => handleUpdatePost(e, true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap cursor-pointer"
        >
          게시글 수정 완료
        </button>
      </div>
    </div>
  );
}
