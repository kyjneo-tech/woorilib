
const { PrismaClient } = require('../../generated/client-seed');
// import { DEVELOPMENTAL_AREAS, DevelopmentalArea } from '../shared/config/constants';

const prisma = new PrismaClient();

const SUB_COMPETENCIES: Record<string, string[]> = {
    // 의사소통 (Communication)
    '어휘력': ['단어', '낱말', '이름', '어휘', '말문', 'Vocabulary'],
    '언어표현': ['말하기', '표현', '대화', '문장', 'Speak', 'Talk'],
    '듣기태도': ['경청', '듣기', '집중', 'Listen'],
    '읽기흥미': ['책읽기', '독서', '이야기', 'Story', 'Read'],
    '외국어노출': ['영어', '알파벳', '원서', 'English', 'ABC', 'Letter'],

    // 자연탐구 (Nature/Science)
    '관찰력': ['관찰', '찾기', '숨은그림', 'Observe', 'Find'],
    '수리논리': ['수학', '숫자', '도형', '계산', 'Math', 'Number', 'Shape'],
    '과학원리': ['과학', '원리', '실험', '작동', 'Science', 'How'],
    '동물생태': ['동물', '생물', '숲', '바다', '곤충', 'Animal', 'Nature'],
    '우주공학': ['우주', '별', '행성', '로켓', '자동차', '기차', 'Space', 'Car'],

    // 사회관계 (Social)
    '자아존중': ['나', '자신감', '자존감', '용기', 'Self', 'Brave'],
    '감정조절': ['감정', '마음', '화', '슬픔', '기쁨', 'Emotion', 'Feel'],
    '공감능력': ['배려', '위로', '나눔', '공감', 'Empathy', 'Share'],
    '사회성': ['친구', '이웃', '집단', '유치원', '학교', 'Friend', 'Social'],
    '다양성인식': ['세계', '문화', '전통', '다른', 'Different', 'World'],

    // 예술경험 (Art)
    '심미감': ['아름다움', '예술', '색깔', '풍경', 'Art', 'Color'],
    '예술적표현': ['그리기', '만들기', '꾸미기', '창의', 'Creative', 'Paint'],
    '리듬감': ['음악', '노래', '악기', '춤', '박자', 'Music', 'Rhythm'],

    // 신체운동·건강 (Physical/Safety)
    '대근육발달': ['운동', '신체', '달리기', '뛰기', 'Body', 'Jump'],
    '소근육발달': ['조작', '플랩', '스티커', '뜯기', 'Motor', 'Stick'],
    '안전의식': ['안전', '조심', '위험', '사고', 'Safety', 'Danger'],

    // 생활습관 (Habits)
    '배변습관': ['배변', '변기', '응가', '기저귀', 'Potty'],
    '청결습관': ['양치', '목욕', '손씻기', '치카', 'Wash', 'Brush'],
    '수면습관': ['잠자기', '자장가', '꿈', '밤', 'Sleep', 'Dream'],
    '식습관': ['골고루', '편식', '식사', '냠냠', 'Eat', 'Meal'],
    '정리정돈': ['정리', '청소', 'Clean'],
};

const COMP_TO_AREA: Record<string, string> = {
    '어휘력': '의사소통', '언어표현': '의사소통', '듣기태도': '의사소통', '읽기흥미': '의사소통', '외국어노출': '의사소통',
    '관찰력': '자연탐구', '수리논리': '자연탐구', '과학원리': '자연탐구', '동물생태': '자연탐구', '우주공학': '자연탐구',
    '자아존중': '사회관계', '감정조절': '사회관계', '공감능력': '사회관계', '사회성': '사회관계', '다양성인식': '사회관계',
    '심미감': '예술경험', '예술적표현': '예술경험', '리듬감': '예술경험',
    '대근육발달': '신체운동·건강', '소근육발달': '신체운동·건강', '안전의식': '신체운동·건강',
    '배변습관': '생활습관', '청결습관': '생활습관', '수면습관': '생활습관', '식습관': '생활습관', '정리정돈': '생활습관'
};

async function main() {
    console.log('Seeding Classification Rules...');

    for (const [subComp, keywords] of Object.entries(SUB_COMPETENCIES)) {
        const parentArea = COMP_TO_AREA[subComp];

        // Check if rule exists
        const existing = await prisma.classificationRule.findFirst({
            where: { type: 'sub_competency', name: subComp }
        });

        if (!existing) {
            await prisma.classificationRule.create({
                data: {
                    type: 'sub_competency',
                    name: subComp,
                    keywords: keywords,
                    metadata: { parentArea: parentArea || 'Unknown' }
                }
            });
            console.log(`Created rule for: ${subComp}`);
        } else {
            console.log(`Updated rule for: ${subComp}`);
            await prisma.classificationRule.update({
                where: { id: existing.id },
                data: { keywords: keywords, metadata: { parentArea: parentArea || 'Unknown' } }
            });
        }
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
