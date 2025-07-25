import { INIT_PLACE_FORM_VALUE } from '@/consts';
import { PlaceFileType, PlaceInputType, PostedPlace } from '@/types/place.type';
import { compareAsc } from 'date-fns';
import { create } from 'zustand';

interface PostPlacesState {
  postedPlaces: PostedPlace[];
  isEditingPlace: boolean;
  editingPlaceId: number | null;
  currentPlace: PlaceInputType;
  images: PlaceFileType[];
  representativePlaceId: number | null;
  setRepresentativePlaceId: (id: number) => void;
  addPostedPlace: (postedPlace: PostedPlace) => void;
  updatePostedPlace: (updatedPlace: PostedPlace) => void;
  removePostedPlace: (id: number) => void;
  resetPostedPlaces: () => void;
  setEditingPlace: (postedPlace: PostedPlace) => void;
  cancelEditingPlace: () => void;
  initPlaceFormData: () => void;
  setCurrentPlace: (currentPlace: PlaceInputType) => void;
  addImages: (image: PlaceFileType) => void;
  removeImage: (index: number) => void;
  toggleRepresentativeImage: (index: number) => void;
  toggleRepresentativePlace: (id: number) => void;
  addAllPostedPlaces: (postedPlaces: PostedPlace[]) => void;
}

export const usePostPlacesStore = create<PostPlacesState>((set) => ({
  postedPlaces: [],
  isEditingPlace: false,
  editingPlaceId: null,
  currentPlace: {
    ...INIT_PLACE_FORM_VALUE,
    visit_start_time: new Date(),
    visit_end_time: new Date(),
  },
  images: [],
  representativePlaceId: null,
  setRepresentativePlaceId: (id) => set(() => ({ representativePlaceId: id })),
  addAllPostedPlaces: (postedPlaces: PostedPlace[]) =>
    set(() => ({
      postedPlaces: sortPlacesByStartTime(postedPlaces),
    })),
  addPostedPlace: (postedPlace) =>
    set((state) => ({
      postedPlaces: sortPlacesByStartTime([...state.postedPlaces, postedPlace]),
    })),

  updatePostedPlace: (updatedPlace) =>
    set((state) => {
      const newPlaces = state.postedPlaces.map((place) =>
        place.place_id === updatedPlace.place_id ? updatedPlace : place
      );
      return {
        postedPlaces: sortPlacesByStartTime(newPlaces),
      };
    }),

  removePostedPlace: (id) =>
    set((state) => ({
      postedPlaces: state.postedPlaces.filter((place) => place.place_id !== id),
    })),

  resetPostedPlaces: () =>
    set(() => ({
      postedPlaces: [],
      isEditingPlace: false,
      editingPlaceId: null,
      currentPlace: {
        ...INIT_PLACE_FORM_VALUE,
        visit_start_time: new Date(),
        visit_end_time: new Date(),
      },
      images: [],
      representativePlaceId: null,
    })),

  setEditingPlace: (postedPlace) =>
    set(() => ({
      isEditingPlace: true,
      editingPlaceId: postedPlace.place_id,
      currentPlace: postedPlace.currentPlace,
      images: postedPlace.images,
    })),

  cancelEditingPlace: () =>
    set(() => ({
      isEditingPlace: false,
      editingPlaceId: null,
    })),
  initPlaceFormData: () =>
    set(() => ({
      currentPlace: {
        ...INIT_PLACE_FORM_VALUE,
        visit_start_time: new Date(),
        visit_end_time: new Date(),
      },
      images: [],
    })),
  setCurrentPlace: (currentPlace) =>
    set(() => ({
      currentPlace,
    })),
  addImages: (image) =>
    set((state) => ({
      images: [...state.images, image],
    })),
  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),
  toggleRepresentativeImage: (index) =>
    set((state) => ({
      images: state.images.map((img, idx) => ({
        ...img,
        is_representative: idx === index,
      })),
    })),
  toggleRepresentativePlace: (id) =>
    set((state) => ({ representativePlaceId: state.representativePlaceId !== id ? id : null })),
}));

const sortPlacesByStartTime = (places: PostedPlace[]) =>
  [...places].sort((a, b) =>
    compareAsc(a.currentPlace.visit_start_time, b.currentPlace.visit_start_time)
  );
