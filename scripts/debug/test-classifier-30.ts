import { BookClassifier } from '../../src/features/curation/core/classifiers/book-classifier';

const TEST_CASES = [
  // --- 기존 20개 ---
  { title: "Brown Bear, Brown Bear, What Do You See?", description: "Bill Martin Jr's rhythmic text and Eric Carle's bold images make this a classic.", category: "Foreign Books > Children > Animals" },
  { title: "Peppa Pig: Little Library", description: "Six chunky board books in a little box case.", category: "Foreign Books > Children > Activity Books" },
  { title: "아람 자연이랑 01 개미", description: "개미의 생태를 생생한 사진으로 관찰하는 자연관찰 전집.", category: "유아 > 전집 > 자연관찰" },
  { title: "추피와 두두 15권 - 추피가 자전거를 타요", description: "추피의 생활 동화 시리즈. 자전거 타기 도전.", category: "유아 > 그림책 > 생활동화" },
  { title: "응가하자 끙끙", description: "아이들의 배변 훈련을 돕는 그림책. 변기와 친해지기.", category: "유아 > 그림책 > 생활습관" },
  { title: "누가 내 머리에 똥 쌌어?", description: "두더지가 범인을 찾아나서는 유쾌한 이야기. 동물의 똥 모양을 관찰할 수 있다.", category: "유아 > 그림책 > 창작동화" },
  { title: "핑크퐁 상어가족 사운드북", description: "신나는 상어가족 노래가 나오는 사운드북. 버튼을 누르면 노래가 나와요.", category: "유아 > 유아놀이 > 사운드북" },
  { title: "어스본 요리조리 열어보는 우주", description: "플랩을 열면 우주의 신비가 펼쳐집니다. 60개의 플랩.", category: "유아 > 그림책 > 지식그림책" },
  { title: "기적의 한글 학습 1권", description: "체계적인 한글 학습 프로그램.", category: "유아 > 유아학습 > 한글" },
  { title: "창의력 쑥쑥 숨은그림찾기", description: "집중력을 키워주는 숨은그림찾기 놀이.", category: "어린이 > 퍼즐/퀴즈" },
  { title: "사랑해 사랑해 사랑해", description: "아기를 사랑하는 마음을 담은 그림책. 잠자리 독서 추천.", category: "유아 > 그림책 > 창작동화" },
  { title: "구름빵", description: "구름으로 빵을 만들어 먹고 하늘을 나는 고양이 남매 이야기.", category: "유아 > 그림책 > 창작동화" },
  { title: "수학 특공대 : 덧셈의 비밀", description: "재미있는 이야기로 배우는 수학 원리.", category: "유아 > 그림책 > 수학동화" },
  { title: "내 친구 과학공룡 - 전기가 찌릿찌릿", description: "전기의 원리를 쉽게 설명해주는 과학 그림책.", category: "유아 > 그림책 > 과학동화" },
  { title: "초등 1학년이 꼭 알아야 할 80가지", description: "학교 생활, 친구 관계, 공부 습관 등 초등 입학 준비를 위한 가이드.", category: "어린이 > 초등1~2학년 > 학교생활" },
  { title: "Why? 갯벌", description: "학습만화의 베스트셀러 Why 시리즈. 갯벌의 생태를 만화로 배운다.", category: "어린이 > 학습만화 > 과학" },
  { title: "엄마", description: "권정생 선생님의 그림책. 엄마를 부르는 아이의 마음.", category: "유아 > 그림책 > 한국창작" },
  { title: "자동차 박물관", description: "세상의 모든 자동차를 모아놓은 백과사전.", category: "유아 > 그림책 > 지식그림책" },
  { title: "뽀로로 에듀 사운드바", description: "동요와 한글, 영어를 배우는 사운드바 장난감.", category: "유아 > 유아놀이 > 사운드북" },
  { title: "흔한남매 1", description: "유튜브 인기 크리에이터 흔한남매의 코믹북.", category: "어린이 > 만화 > 명랑코믹" },

  // --- 추가 10개 (New Challenging Cases) ---
  {
    title: "Hi, Fly Guy! (Fly Guy #1)",
    description: "A boy has a pet fly named Fly Guy. They are best friends.",
    category: "Foreign Books > Children > Funny Stories"
  },
  {
    title: "수학도둑 88",
    description: "코믹 메이플스토리 수학대전. 재미있는 만화로 수학 원리를 배운다.",
    category: "어린이 > 학습만화 > 수학"
  },
  {
    title: "안녕 마음아 01권 - 엄마를 잠깐 잃어버렸어요",
    description: "국내 창작 인성 동화. 아이의 마음을 읽어주는 따뜻한 이야기.",
    category: "유아 > 전집 > 인성동화"
  },
  {
    title: "우리 아빠가 최고야",
    description: "앤서니 브라운의 명작. 아빠를 사랑하는 아이의 마음.",
    category: "유아 > 그림책 > 창작동화"
  },
  {
    title: "시크릿쥬쥬 별의 여신 색칠공부",
    description: "예쁜 공주님을 색칠하며 창의력을 키워요.",
    category: "유아 > 유아놀이 > 색칠북"
  },
  {
    title: "오케스트라 이야기",
    description: "다양한 악기 소리를 들어보아요. 바이올린, 첼로, 플루트.",
    category: "유아 > 그림책 > 예술"
  },
  {
    title: "Good Night, Gorilla",
    description: "A classic bedtime story. Zoo animals follow the zookeeper home.",
    category: "Foreign Books > Children > Bedtime"
  },
  {
    title: "엉덩이 탐정 1",
    description: "추리 천재 엉덩이 탐정의 사건 해결.",
    category: "어린이 > 동화 > 추리"
  },
  {
    title: "EBS 문해력 유치원",
    description: "EBS 방송 교재. 한글 읽기와 쓰기의 기초.",
    category: "유아 > 유아학습 > 한글"
  },
  {
    title: "튤립 사운드북 - 오감 놀이 동요",
    description: "국민 육아템 튤립 사운드북. 오감을 자극하는 동요 수록.",
    category: "유아 > 유아놀이 > 사운드북"
  }
];

console.log('🧪 Testing BookClassifier with 30 Tough Cases...\n');

TEST_CASES.forEach((book, index) => {
  const fullText = `${book.title} ${book.description}`;
  const result = BookClassifier.analyze(fullText, book.category);
  
  console.log(`[${index + 1}] ${book.title}`);
  console.log(`   📂 Areas: [${result.areas.join(', ')}]`);
  console.log(`   👶 Age: ${Math.floor(result.age.min/12)}~${Math.floor(result.age.max/12)}세 (${result.age.min}~${result.age.max}m)`);
  console.log(`   🏷️  Tags: [${result.tags.join(', ')}]`);
  console.log(`   ⚡ Energy: ${result.energyLevel}`);
  console.log(`   📚 Workbook? ${result.isWorkbook} | Form: ${result.formFactor}`);
  if (result.volume) console.log(`   🔢 Volume: ${result.volume}`);
  console.log('--------------------------------------------------');
});
