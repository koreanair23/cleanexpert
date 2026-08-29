import { Smartphone, MapPin, Clock, Phone, Menu, X, Trash2, Edit, Plus, LogIn } from 'lucide-react';

export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  category: 'sale' | 'rental' | 'premium';
  description?: string;
  additionalImages?: string[];
  createdAt?: any;
};

export type StorePhoto = {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  createdAt?: any;
};

export const DEFAULT_STORE_PHOTOS: StorePhoto[] = [
  {
    id: 'store-photo-1',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
    title: '매장 전경 및 안내 데스크',
    description: '김포시 통진읍에 위치한 쾌적하고 편리한 복지용구 전문 매장입니다.'
  },
  {
    id: 'store-photo-2',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
    title: '복지용구 & 전동침대 쇼룸',
    description: '전동침대, 휠체어, 목욕의자 등을 직접 눈으로 보고 체험하실 수 있습니다.'
  },
  {
    id: 'store-photo-3',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
    title: '1:1 맞춤 친절 상담 공간',
    description: '노인장기요양보험 혜택 및 본인부담금 감면 절차를 상세히 안내해 드립니다.'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: '전동 침대 (3모터)', imageUrl: 'https://picsum.photos/seed/bed/400/300', category: 'rental', description: '국민건강보험공단 급여 대여 품목으로 리모컨으로 상하체 각도 및 높낮이를 손쉽게 조절할 수 있는 전동 침대입니다.' },
  { id: '2', name: '수동 휠체어 (알루미늄형)', imageUrl: 'https://picsum.photos/seed/wheelchair/400/300', category: 'rental', description: '어르신의 이동 편의를 돕는 가볍고 견고한 접이식 수동 휠체어로 소독 및 정비가 완료된 대여 품목입니다.' },
  { id: '3', name: '욕창 예방 매트리스', imageUrl: 'https://picsum.photos/seed/mattress/400/300', category: 'rental', description: '공기압 자동 순환 방식으로 장시간 누워 계시는 어르신의 피부 압박을 분산해 욕창을 예방합니다.' },
  { id: '4', name: '허리 보호대 (의료용)', imageUrl: 'https://picsum.photos/seed/brace/400/300', category: 'sale', description: '요추 지지 프레임과 통기성 메쉬 원단으로 허리를 안정적으로 받쳐주는 일상 보호대입니다.' },
  { id: '5', name: '보행 보조기 (실버카)', imageUrl: 'https://picsum.photos/seed/walker/400/300', category: 'sale', description: '어르신의 안전한 외출과 보행을 돕는 브레이크 및 수납 바구니가 일체형으로 탑재된 보행차입니다.' },
  { id: '6', name: '디지털 자동 혈압계', imageUrl: 'https://picsum.photos/seed/bp/400/300', category: 'sale', description: '원터치 버튼과 넓은 액정 화면으로 어르신 혼자서도 매일 간편하게 혈압을 체크할 수 있습니다.' },
  { id: '7', name: '복지용구 이동 변기', imageUrl: 'https://picsum.photos/seed/toilet/400/300', category: 'premium', description: '비용 부담은 낮추고 보건복지부 장관이 정하여 고시하는 물품으로 침대 옆에 두고 편리하고 위생적으로 사용하는 변기입니다.' },
  { id: '8', name: '복지용구 목욕 의자', imageUrl: 'https://picsum.photos/seed/bath/400/300', category: 'premium', description: '비용 부담은 낮추고 보건복지부 장관이 정하여 고시하는 물품으로 물빠짐 구멍과 미끄럼 방지 패킹이 적용된 안전 목욕의자입니다.' },
  { id: '9', name: '안전 손잡이 & 미끄럼 방지용품', imageUrl: 'https://picsum.photos/seed/mat/400/300', category: 'premium', description: '보건복지부 고시 복지용구 품목으로 화장실 및 거실 낙상 사고를 방지하는 필수 안전 용품입니다.' }
];

export const CATEGORIES = {
  rental: {
    title: '대여용품',
    description: '국가지원 혜택으로 부담은 줄이고 삶의 질은 높이세요',
    details: '장기요양등급 어르신 85%~100% 국가지원, 전동침대/수동휠체어/욕창예방매트리스 등 소독 완료 대여 및 서류 절차 안내'
  },
  sale: {
    title: '일반용품',
    description: '일상의 불편함을 바꿔드립니다',
    details: '허리 보호대, 보행보조기(실버카), 가정용 혈압계 등 일상생활 건강과 편의를 돕는 다양한 의료/생활 보조용품'
  },
  premium: {
    title: '복지용구 판매용품',
    description: '비용 부담은 낮추고 보건복지부 장관이 정하여 고시하는 물품 구입',
    details: '장기요양 급여 대상 복지용구(이동변기, 목욕의자, 안전손잡이, 미끄럼방지매트 등) 국가지원 혜택 구입 및 상담'
  }
} as const;
