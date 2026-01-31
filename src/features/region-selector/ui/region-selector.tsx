'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check, ChevronLeft } from 'lucide-react';
import { useRegionStore, REGIONS } from '../lib/use-region-store';
import { useUserStore } from '@/entities/user/model/user-store';
import { cn } from '@/shared/lib/cn';
import { RegionData, SubRegion, District } from '@/shared/config/region-codes';

interface RegionSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function RegionSelector({ className, variant = 'default' }: RegionSelectorProps) {
  const { setRegion: setGlobalRegion } = useUserStore();
  const {
    selectedRegion,
    selectedSubRegion,
    selectedDistrict,
    isOpen,
    setRegion,
    setSubRegion,
    setDistrict,
    setIsOpen,
    getDisplayName,
  } = useRegionStore();

  const [step, setStep] = useState<'region' | 'subRegion' | 'district'>('region');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    // 현재 상태에 맞춰 단계 설정
    if (selectedSubRegion) {
      setStep(selectedSubRegion.districts ? 'district' : 'subRegion');
    } else if (selectedRegion) {
      setStep('subRegion');
    } else {
      setStep('region');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRegionSelect = (region: RegionData) => {
    setRegion(region);
    setStep('subRegion');
  };

  const handleSubRegionSelect = (subRegion: SubRegion) => {
    setSubRegion(subRegion);
    if (subRegion.districts && subRegion.districts.length > 0) {
      setStep('district');
    } else {
      // Finalize selection if no districts
      if (selectedRegion) {
        setGlobalRegion({
            regionCode: selectedRegion.code,
            regionName: selectedRegion.name,
            subRegionCode: subRegion.code,
            subRegionName: subRegion.name
        });
      }
      setIsOpen(false);
    }
  };

  const handleDistrictSelect = (district: District) => {
    setDistrict(district);
    if (selectedRegion && selectedSubRegion) {
        setGlobalRegion({
            regionCode: selectedRegion.code,
            regionName: selectedRegion.name,
            subRegionCode: selectedSubRegion.code,
            subRegionName: selectedSubRegion.name,
            districtCode: district.code,
            districtName: district.name
        });
    }
    setIsOpen(false);
  };

  const handleBack = () => {
    if (step === 'district') setStep('subRegion');
    else if (step === 'subRegion') setStep('region');
  };

  return (
    <div className={cn('relative', className)}>
      {variant === 'default' ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-purple-50 rounded-[1.5rem] hover:bg-purple-50/30 transition-all shadow-sm w-full group"
        >
          <MapPin className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          <span className="flex-1 text-left font-bold text-gray-800 truncate">
            {mounted ? getDisplayName() : '지역을 선택하세요'}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95"
          style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}
        >
          <span>📍 {mounted ? getDisplayName() : '지역선택'}</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={handleClose}
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[340px] max-w-[90vw] bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl z-50 max-h-[70vh] overflow-hidden animate-in slide-in-from-top-4 duration-300">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-50 px-6 py-5 flex items-center gap-3">
              {step !== 'region' && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-purple-500 hover:bg-purple-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] block mb-0.5">
                  Step {step === 'region' ? '01' : step === 'subRegion' ? '02' : '03'}
                </span>
                <span className="font-black text-gray-900 text-lg">
                  {step === 'region'
                    ? '어느 지역인가요?'
                    : step === 'subRegion'
                      ? `${selectedRegion?.name} 어디인가요?`
                      : `${selectedSubRegion?.name} 상세 구 선택`}
                </span>
              </div>
            </div>

            {/* 리스트 */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {step === 'region' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {REGIONS.map((region) => (
                    <button
                      key={region.code}
                      type="button"
                      onClick={() => handleRegionSelect(region)}
                      className={cn(
                        'px-4 py-4 text-left rounded-2xl text-sm font-black transition-all border-2',
                        selectedRegion?.code === region.code
                          ? 'bg-purple-600 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-600 border-gray-50 hover:border-purple-100 hover:bg-purple-50/30'
                      )}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              ) : step === 'subRegion' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedRegion?.subRegions?.map((sub) => (
                    <button
                      key={sub.code}
                      type="button"
                      onClick={() => handleSubRegionSelect(sub)}
                      className={cn(
                        'px-4 py-4 text-left rounded-2xl text-sm font-black transition-all border-2 flex items-center justify-between',
                        selectedSubRegion?.code === sub.code
                          ? 'bg-purple-600 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-600 border-gray-50 hover:border-purple-100 hover:bg-purple-50/30'
                      )}
                    >
                      <span>{sub.name}</span>
                      {sub.districts && <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedSubRegion?.districts?.map((dist) => (
                    <button
                      key={dist.code}
                      type="button"
                      onClick={() => handleDistrictSelect(dist)}
                      className={cn(
                        'px-4 py-4 text-left rounded-2xl text-sm font-black transition-all border-2 flex items-center justify-between',
                        selectedDistrict?.code === dist.code
                          ? 'bg-indigo-600 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-600 border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30'
                      )}
                    >
                      <span>{dist.name}</span>
                      {selectedDistrict?.code === dist.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
