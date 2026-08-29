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

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: '수동 휠체어', imageUrl: 'https://picsum.photos/seed/wheelchair/400/300', category: 'sale' },
  { id: '2', name: '전동 침대', imageUrl: 'https://picsum.photos/seed/bed/400/300', category: 'rental' },
  { id: '3', name: '허리 보호대', imageUrl: 'https://picsum.photos/seed/brace/400/300', category: 'sale' },
  { id: '4', name: '욕창 예방 매트리스', imageUrl: 'https://picsum.photos/seed/mattress/400/300', category: 'rental' },
  { id: '5', name: '수입 프리미엄 휠체어', imageUrl: 'https://picsum.photos/seed/premium1/400/300', category: 'premium' },
  { id: '6', name: '고급 안마기', imageUrl: 'https://picsum.photos/seed/massager/400/300', category: 'premium' },
  { id: '7', name: '보행 보조기 (실버카)', imageUrl: 'https://picsum.photos/seed/walker/400/300', category: 'sale' },
  { id: '8', name: '이동 변기', imageUrl: 'https://picsum.photos/seed/toilet/400/300', category: 'sale' },
];

export const CATEGORIES = {
  sale: {
    title: '판매 용품',
    description: '일상의 불편함을 바꿔드립니다',
    details: '휠체어, 전동침대 구매 및 허리 보호대, 혈압계 등 다양한 제품 구비 및 사용법 교육 서비스'
  },
  rental: {
    title: '복지용구 대여',
    description: '국가지원 혜택으로 부담은 줄이고 삶의 질은 높이세요',
    details: '장기요양등급 보유 시 15%~0% 이용 가능, 위생 소독된 제품 대여 및 서류 절차 안내'
  },
  premium: {
    title: '비급여/프리미엄',
    description: '더 특별한 케어를 위한 맞춤형 솔루션',
    details: '개인 체형과 목적에 맞는 프리미엄 제품군 및 수입 휠체어, 안마기 등 선택지 제공'
  }
} as const;
