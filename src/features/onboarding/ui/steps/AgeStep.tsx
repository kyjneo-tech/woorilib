import { AGE_GROUPS, AgeGroupId } from '@/shared/config/constants';
import { Button, Typography } from '@/shared/ui';

interface Props {
    selectedAge: AgeGroupId | null;
    onSelect: (ageId: AgeGroupId) => void;
    onNext: () => void;
}

export function AgeStep({ selectedAge, onSelect, onNext }: Props) {
    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <Typography variant="h2" className="mb-2">우리 아이 나이는?</Typography>
                <Typography color="secondary">아이의 발달 단계에 딱 맞는 책을 찾아드릴게요</Typography>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                {AGE_GROUPS.map((age) => (
                    <button
                        key={age.id}
                        onClick={() => onSelect(age.id)}
                        className={`
                            relative p-4 rounded-2xl border-2 text-left transition-all duration-200
                            ${selectedAge === age.id
                                ? 'border-primary bg-primary-soft ring-2 ring-primary-light/20 ring-offset-2'
                                : 'border-border bg-white hover:border-primary-light/50 hover:bg-surface-secondary'
                            }
                        `}
                    >
                        <Typography 
                            variant="h4" 
                            className="mb-1"
                            color={selectedAge === age.id ? 'primary' : 'default'}
                        >
                            {age.label}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            color={selectedAge === age.id ? 'primary' : 'secondary'}
                        >
                            {age.description}
                        </Typography>
                    </button>
                ))}
            </div>

            <Button
                onClick={onNext}
                disabled={!selectedAge}
                fullWidth
                size="xl"
            >
                다음으로
            </Button>
        </div>
    );
}
