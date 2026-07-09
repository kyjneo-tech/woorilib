
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/entities/user/model/user-store';
import { AgeGroupId, AGE_GROUPS } from '@/shared/config/constants';
import { AgeStep } from './steps/AgeStep';
import { PropensityStep } from './steps/PropensityStep';
import { InterestStep } from './steps/InterestStep';

export function OnboardingFunnel() {
    const router = useRouter();
    const { setChildProfile } = useUserStore();

    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        ageGroup: null as AgeGroupId | null,
        propensity: null as 'active' | 'calm' | 'sensitive' | 'curious' | null,
        interests: [] as string[]
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleComplete = () => {
        if (data.ageGroup && data.propensity) {
            setChildProfile({
                childAgeGroup: data.ageGroup,
                propensity: data.propensity,
                interests: data.interests
            });
            router.push('/home');
        }
    };

    const updateData = (key: string, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${((step + 1) / 3) * 100}%` }}
                />
            </div>

            {step === 0 && (
                <AgeStep
                    selectedAge={data.ageGroup}
                    onSelect={(age) => updateData('ageGroup', age)}
                    onNext={handleNext}
                />
            )}

            {step === 1 && (
                <PropensityStep
                    selectedPropensity={data.propensity}
                    onSelect={(p) => updateData('propensity', p)}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 2 && (
                <InterestStep
                    initialInterests={data.interests}
                    onSelect={(interests) => updateData('interests', interests)}
                    onComplete={handleComplete}
                    onBack={handleBack}
                />
            )}
        </div>
    );
}
