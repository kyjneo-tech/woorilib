import { useState, useEffect } from 'react';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { useRegionStore } from '@/features/region-selector/lib/use-region-store';

interface AvailabilityState {
  isLoading: boolean;
  isAvailable: boolean;
  libraryCount: number;
  nearestLibrary: string | null;
}

export function useLibraryAvailability(isbn: string) {
  const [state, setState] = useState<AvailabilityState>({
    isLoading: true,
    isAvailable: false,
    libraryCount: 0,
    nearestLibrary: null,
  });

  const { getRegionCode } = useRegionStore();
  const regionCode = getRegionCode();

  useEffect(() => {
    let isMounted = true;

    async function checkAvailability() {
      if (!isbn) return;
      
      try {
        // regionCode format: "11" (Seoul) or "11010" (Jongno-gu)
        // API expects region (2 digits) and dtl_region (5 digits)
        const params: any = { isbn, pageSize: 1 };
        
        if (regionCode) {
           if (regionCode.length === 2) {
               params.region = regionCode;
           } else if (regionCode.length >= 4) {
               params.dtl_region = regionCode;
           }
        }

        const res = await libraryApiClient.searchLibrariesByBook(params);
        
        if (isMounted) {
          setState({
            isLoading: false,
            isAvailable: res.totalCount > 0,
            libraryCount: res.totalCount,
            nearestLibrary: res.libraries[0]?.libName || null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    }

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [isbn, regionCode]);

  return state;
}
