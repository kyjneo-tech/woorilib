
import { useState, useEffect, useMemo } from 'react';
import { RoadmapStage, STANDARD_ROADMAP_DATA, RoadmapItem } from '../config/standard-roadmaps';
import { BookshelfItem } from '@/features/bookshelf/lib/bookshelf-service';

export function useRoadmapEngine(childMonths: number, myBooks: BookshelfItem[]) {
  // 1. Calculate Default Stage based on Age
  const defaultStage = useMemo(() => {
    if (childMonths <= 24) return RoadmapStage.STEP_1_SEED;      // ~2 years
    if (childMonths <= 48) return RoadmapStage.STEP_2_SPROUT;    // ~4 years
    if (childMonths <= 72) return RoadmapStage.STEP_3_LEAF;      // ~6 years
    return RoadmapStage.STEP_4_TREE;                             // 7+ years
  }, [childMonths]);

  const [currentStage, setCurrentStage] = useState<RoadmapStage>(defaultStage);

  // Sync default if months change (e.g. user changes child)
  useEffect(() => {
    setCurrentStage(defaultStage);
  }, [defaultStage]);

  // 2. Filter Items by Stage
  const stageItems = useMemo(() => {
    return STANDARD_ROADMAP_DATA.filter(item => item.stage === currentStage);
  }, [currentStage]);

  // 3. Analyze Ownership (Fuzzy Match)
  const ownershipMap = useMemo(() => {
    const map = new Map<string, boolean>();
    
    stageItems.forEach(roadmapItem => {
        const isOwned = myBooks.some(myBook => {
            if (!myBook.title) return false;
            
            // Normalize: remove spaces, lowercase
            const myTitle = myBook.title.replace(/\s/g, '').toLowerCase();
            const targetTitle = roadmapItem.title.replace(/\s/g, '').toLowerCase();
            
            // A. Title Containment
            if (myTitle.includes(targetTitle)) return true;

            // B. Keyword Match
            if (roadmapItem.keywords) {
                return roadmapItem.keywords.some(k => 
                    myTitle.includes(k.replace(/\s/g, '').toLowerCase())
                );
            }
            return false;
        });
        map.set(roadmapItem.id, isOwned);
    });
    
    return map;
  }, [stageItems, myBooks]);

  return {
    currentStage,
    setStage: setCurrentStage,
    stageItems,
    ownershipMap,
    defaultStage,
    progress: {
        total: stageItems.length,
        owned: Array.from(ownershipMap.values()).filter(v => v).length
    }
  };
}
