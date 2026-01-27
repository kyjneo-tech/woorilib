
/**
 * Target List for Massive Data Collection
 * Focused on Major Publishers & Popular Series for 0-8 Years
 */

export const TARGET_PUBLISHERS = [
  // 3대장 (Great Books, Aram, Kids Schole)
  { name: '그레이트북스', keywords: ['안녕 마음아', '도레미 곰', '놀라운 자연', '내 친구 과학공룡', '내 친구 수학공룡', '이야기 꽃할망', '행복한 명작', '베베 코알라', '버니의 세계책방'] },
  { name: '아람', keywords: ['자연이랑', '베이비올', '라라랜드', '과학특공대', '수학특공대', '경제특공대', '심쿵', '바나나 세계창작'] },
  { name: '키즈스콜레', keywords: ['마이퍼스트월드', '사파리', '스텝스', '야호 자연아', '100일 독서', '발밤발밤'] },
  
  // Traditional Giants (Woongjin, Kyowon, Froebel)
  { name: '웅진주니어', keywords: ['웅진북클럽', '호기심백과 큐', '한걸음 먼저', '바나나', '첫 지식 그림책'] },
  { name: '교원', keywords: ['자연이 소곤소곤', '조물조물', '빨간펜', '노래하는 솜사탕'] },
  { name: '한국프뢰벨', keywords: ['영아다중', '토탈시스템', '말하기', '생생 다큐 자연관찰', '은물'] },
  
  // Specialized / Trendy
  { name: '블루래빗', keywords: ['오감발달', '생생 자연관찰', '토이북', '아이큐 베이비'] },
  { name: '북극곰', keywords: ['북극곰 곰 이야기'] },
  { name: '비룡소', keywords: ['사각사각', '비룡소 북클럽', '난 책읽기가 좋아'] },
  { name: '성우출판사', keywords: ['과학뒤집기', '수학뒤집기'] },
  
  // From BabyBear Analysis (Interactive / Board Books)
  { name: '어스본', keywords: ['태엽북', '사운드북', '플랩북', '어스본 코리아'] },
  { name: '별똥별', keywords: ['야물야물', '부릉부릉 탈것', '인성동화'] },

  // Top 10 Market Players (Added)
  { name: '예림당', keywords: ['Why', '스마트베어', '예림당'] }, // Rank 3
  { name: '웅진씽크빅', keywords: ['웅진씽크빅', '바로독해'] }, // Rank 5
  { name: '잉글리시에그', keywords: ['잉글리시에그', 'English Egg'] }, // Rank 9
  { name: '디즈니월드잉글리쉬', keywords: ['디즈니 월드 잉글리쉬', '월간 잉글리쉬', 'World Family'] }, // Rank 10

  // MUST-HAVES (User Requests)
  { name: '무지개', keywords: ['추피의 생활이야기', '추피'] } // Tchoupi
];

export const CATEGORY_KEYWORDS = [
  '세이펜', '바나펜', '전집', '유아 전집', '초등 전집', '베스트셀러', '신간'
];
