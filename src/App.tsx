import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  LogIn, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Package, 
  ShoppingBag, 
  Heart, 
  X, 
  Edit2, 
  Image as ImageIcon, 
  ExternalLink, 
  KeyRound, 
  ShieldCheck, 
  RotateCcw,
  Camera,
  UploadCloud,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, Product, INITIAL_PRODUCTS, StorePhoto, DEFAULT_STORE_PHOTOS } from './constants';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout 
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showEmergencyPassword, setShowEmergencyPassword] = useState(false);
  const [emergencyPasswordInput, setEmergencyPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'sale' | 'premium'>('all');
  
  // 매장 사진 상태 관리
  const [storePhotos, setStorePhotos] = useState<StorePhoto[]>(DEFAULT_STORE_PHOTOS);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [selectedStorePhotoModal, setSelectedStorePhotoModal] = useState<StorePhoto | null>(null);
  const [showStorePhotoAdminModal, setShowStorePhotoAdminModal] = useState(false);
  const [storePhotoForm, setStorePhotoForm] = useState({
    title: '',
    imageUrl: '',
    description: ''
  });
  const [isUploadingStorePhoto, setIsUploadingStorePhoto] = useState(false);
  const [deletingStorePhotoId, setDeletingStorePhotoId] = useState<string | null>(null);
  const storePhotoFileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState({ 
    name: '', 
    imageUrl: '', 
    category: 'rental' as 'rental' | 'sale' | 'premium', 
    description: '', 
    additionalImages: [] as string[] 
  });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_PASSWORDS = ['01087857295*', '7295', 'hana7295', '01087857295'];

  useEffect(() => {
    // Check saved local admin session
    const savedAdmin = localStorage.getItem('jeil_hana_admin_active');
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(true);
        localStorage.setItem('jeil_hana_admin_active', 'true');
      } else if (savedAdmin !== 'true') {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // 상품 목록 실시간 리스너
    const productsCollection = collection(db, 'products');
    const unsubscribeFirestore = onSnapshot(productsCollection, (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is completely empty, populate with default catalog
        setProducts(INITIAL_PRODUCTS);
      } else {
        const prods = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // Client-side robust sorting by createdAt
        prods.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setProducts(prods);
      }
    }, (error) => {
      console.error('Firestore listener error:', error);
      setProducts(INITIAL_PRODUCTS);
    });

    // 매장 사진 실시간 리스너
    const storePhotosCollection = collection(db, 'store_photos');
    const unsubscribeStorePhotos = onSnapshot(storePhotosCollection, (snapshot) => {
      if (snapshot.empty) {
        setStorePhotos(DEFAULT_STORE_PHOTOS);
      } else {
        const photos = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as StorePhoto[];

        photos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setStorePhotos(photos);
      }
    }, (err) => {
      console.error('Store photos listener error:', err);
      setStorePhotos(DEFAULT_STORE_PHOTOS);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
      unsubscribeStorePhotos();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      setIsLoggingIn(true);
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setIsAdmin(true);
        localStorage.setItem('jeil_hana_admin_active', 'true');
        alert(`Google 계정(${loggedInUser.email || loggedInUser.displayName || '인증 완료'})으로 로그인되었습니다.\n이제 새 상품 등록 및 삭제, 수정이 가능합니다.`);
      }
      setShowLogin(false);
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMsg = 'Google 로그인 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMsg = '배포된 도메인이 Firebase 승인 도메인에 등록되지 않았습니다. 하단의 비상 비밀번호로 즉시 로그인하실 수 있습니다.';
        setShowEmergencyPassword(true);
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = '브라우저 팝업이 차단되었습니다. 주소창의 팝업 차단을 해제하거나 하단의 비상 비밀번호로 로그인해주세요.';
        setShowEmergencyPassword(true);
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMsg = '로그인이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message) {
        errorMsg = `로그인 오류: ${error.message}`;
        setShowEmergencyPassword(true);
      }
      
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmergencyPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = emergencyPasswordInput.trim();
    if (ADMIN_PASSWORDS.includes(entered)) {
      setIsAdmin(true);
      localStorage.setItem('jeil_hana_admin_active', 'true');
      setShowLogin(false);
      setEmergencyPasswordInput('');
      setLoginError(null);
      alert('관리자 인증이 완료되었습니다. 상품 등록, 수정, 삭제가 가능합니다.');
    } else {
      alert('비밀번호가 일치하지 않습니다. (기본 비밀번호: 7295)');
    }
  };

  const handleLogout = async () => {
    try {
      await logout().catch(() => {});
    } finally {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('jeil_hana_admin_active');
      alert('로그아웃 되었습니다.');
    }
  };

  // Seed default products to Firestore if needed
  const seedDefaultProducts = async () => {
    if (!window.confirm('기본 의료기기 8개 상품을 데이터베이스에 일괄 등록하시겠습니까?')) return;
    try {
      setIsSeeding(true);
      for (const item of INITIAL_PRODUCTS) {
        await addDoc(collection(db, 'products'), {
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          description: `${item.name} - 어르신 케어 및 복지용구 전문 제품입니다. 방문 및 전화 상담 가능합니다.`,
          additionalImages: [],
          createdAt: serverTimestamp()
        });
      }
      alert('기본 상품이 성공적으로 데이터베이스에 등록되었습니다.');
    } catch (error: any) {
      console.error('Seed error:', error);
      alert('상품 등록 중 오류: ' + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Helper to compress images to prevent document size limits in Firestore
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isGallery) {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(fileArray.map(f => compressImageFile(f, 1000, 0.8)));
      const validImages = compressedList.filter(Boolean);
      setFormState(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, ...validImages]
      }));
    } else {
      const compressed = await compressImageFile(files[0], 1200, 0.85);
      if (compressed) {
        setFormState(prev => ({ ...prev, imageUrl: compressed }));
      }
    }
  };

  // 매장 사진 파일 선택 및 압축 처리
  const handleStorePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const compressed = await compressImageFile(file, 1400, 0.85);
    if (compressed) {
      const defaultName = file.name.replace(/\.[^/.]+$/, '').slice(0, 25) || '매장 실물 사진';
      setStorePhotoForm(prev => ({
        ...prev,
        imageUrl: compressed,
        title: prev.title || defaultName
      }));
    }
  };

  // 매장 사진 신규 등록 (관리자 전용)
  const handleAddStorePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('매장 사진 관리는 관리자 로그인 후 가능합니다.');
      setShowLogin(true);
      return;
    }

    if (!storePhotoForm.imageUrl) {
      alert('매장 사진을 업로드하거나 이미지 URL을 입력해주세요.');
      return;
    }

    try {
      setIsUploadingStorePhoto(true);
      const photoTitle = storePhotoForm.title.trim() || '김포 제일하나의료기 매장 사진';
      const photoDesc = storePhotoForm.description.trim() || '김포 제일하나의료기 매장 실물 모습입니다.';

      await addDoc(collection(db, 'store_photos'), {
        imageUrl: storePhotoForm.imageUrl,
        title: photoTitle,
        description: photoDesc,
        createdAt: serverTimestamp()
      });

      alert('새 매장 사진이 등록되었습니다.');
      setStorePhotoForm({ title: '', imageUrl: '', description: '' });
      setShowStorePhotoAdminModal(false);
    } catch (err: any) {
      console.error('Add store photo error:', err);
      // Fallback local update if offline
      const newLocalPhoto: StorePhoto = {
        id: 'local-' + Date.now(),
        imageUrl: storePhotoForm.imageUrl,
        title: storePhotoForm.title.trim() || '김포 제일하나의료기 매장 사진',
        description: storePhotoForm.description.trim() || '김포 제일하나의료기 매장 실물 모습입니다.'
      };
      setStorePhotos(prev => [newLocalPhoto, ...prev]);
      alert('매장 사진이 등록되었습니다.');
      setStorePhotoForm({ title: '', imageUrl: '', description: '' });
      setShowStorePhotoAdminModal(false);
    } finally {
      setIsUploadingStorePhoto(false);
    }
  };

  // 매장 사진 삭제 (관리자 전용)
  const handleDeleteStorePhoto = async (id: string, title: string) => {
    if (!isAdmin) {
      alert('관리자 로그인 후 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm(`'${title}' 매장 사진을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDeletingStorePhotoId(id);
      await deleteDoc(doc(db, 'store_photos', id)).catch(() => {});
      setStorePhotos(prev => prev.filter(p => p.id !== id));
      setActivePhotoIdx(prev => Math.max(0, Math.min(prev, storePhotos.length - 2)));
      alert('매장 사진이 삭제되었습니다.');
    } catch (err: any) {
      console.error('Delete photo error:', err);
      setStorePhotos(prev => prev.filter(p => p.id !== id));
      alert('매장 사진이 삭제되었습니다.');
    } finally {
      setDeletingStorePhotoId(null);
    }
  };

  const addOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('상품 관리는 관리자 인증 후 가능합니다.');
      setShowLogin(true);
      return;
    }

    if (!formState.name || !formState.imageUrl) {
      alert('상품명과 이미지는 필수 항목입니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const productRef = doc(db, 'products', isEditing);
        await updateDoc(productRef, {
          name: formState.name.trim(),
          imageUrl: formState.imageUrl,
          category: formState.category,
          description: formState.description.trim(),
          additionalImages: formState.additionalImages
        }).catch(async () => {
          // If updateDoc failed because it was a fallback ID, create as new doc
          await setDoc(productRef, {
            name: formState.name.trim(),
            imageUrl: formState.imageUrl,
            category: formState.category,
            description: formState.description.trim(),
            additionalImages: formState.additionalImages,
            createdAt: serverTimestamp()
          });
        });
        alert('상품 정보가 성공적으로 수정되었습니다.');
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'products'), {
          name: formState.name.trim(),
          imageUrl: formState.imageUrl,
          category: formState.category,
          description: formState.description.trim(),
          additionalImages: formState.additionalImages,
          createdAt: serverTimestamp(),
        });
        alert('새 상품이 성공적으로 등록되었습니다.');
      }
      setFormState({ name: '', imageUrl: '', category: 'rental', description: '', additionalImages: [] });
    } catch (error: any) {
      console.error('Save product error:', error);
      alert('상품 저장 중 오류가 발생했습니다: ' + (error.message || '다시 시도해주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id: string, name?: string) => {
    if (!isAdmin) {
      alert('상품 삭제는 관리자 인증 후 가능합니다.');
      setShowLogin(true);
      return;
    }

    const targetName = name ? `"${name}"` : '이 상품';
    if (!window.confirm(`${targetName}을(를) 정말 삭제하시겠습니까?\n삭제된 상품 정보는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setDeletingId(id);

      // Optimistically remove from state immediately
      setProducts(prev => prev.filter(p => p.id !== id));

      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      if (isEditing === id) {
        setIsEditing(null);
        setFormState({ name: '', imageUrl: '', category: 'rental', description: '', additionalImages: [] });
      }

      // Delete from Firestore
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.warn('Firestore doc delete note:', err);
      }

      alert(`${targetName} 상품이 삭제되었습니다.`);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`상품 삭제 중 오류가 발생했습니다: ${error?.message || '다시 시도해주세요.'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (product: Product) => {
    setIsEditing(product.id);
    setFormState({
      name: product.name,
      imageUrl: product.imageUrl,
      category: product.category as any,
      description: product.description || '',
      additionalImages: product.additionalImages || []
    });
    document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#000F1D]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#C29B2C] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-[#F4E8C8] selection:text-[#000F1D] bg-slate-50 font-sans">
      {/* 내비게이션 */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 h-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[#000F1D] font-display font-black text-xl md:text-2xl tracking-tighter leading-none">
              김포 제일하나의료기
            </span>
            <span className="text-[10px] text-[#C29B2C] uppercase tracking-widest font-bold mt-1">
              당신의 건강을 지켜드리는 제일하나의료기
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 상단 관리자 모드 상태 (로그인된 경우에만 표시) */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span>{user?.displayName || user?.email || '관리자 모드'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-full transition-all active:scale-95"
                >
                  <LogOut size={14} /> 로그아웃
                </button>
              </div>
            )}

            <a 
              href="tel:031-989-7295" 
              className="hidden md:flex items-center gap-2 bg-[#000F1D] text-[#D4AF37] px-6 py-2.5 rounded-full font-bold hover:bg-[#001A33] transition-all shadow-lg hover:shadow-[#C29B2C]/20 active:scale-95"
            >
              <Phone size={18} />
              상담 전화 연결
            </a>
            <a 
              href="tel:031-989-7295" 
              className="md:hidden p-3 bg-[#000F1D] text-[#D4AF37] rounded-full shadow-lg shadow-[#C29B2C]/20"
            >
              <Phone size={20} />
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 메인 배너 */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center overflow-hidden bg-[#000F1D]">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000F1D] via-[#000F1D]/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000" 
              alt="의료기기 매장" 
              className="w-full h-full object-cover opacity-60 scale-105"
            />
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-4 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <span className="inline-block px-4 py-1.5 bg-[#C29B2C]/20 text-[#D4AF37] border border-[#C29B2C]/30 rounded-full text-sm font-semibold mb-6 tracking-normal">
                김포 어르신의 건강한 내일
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-extrabold leading-[1.2] mb-6 tracking-tight">
                김포 제일하나의료기가 <br />
                <span className="text-[#D4AF37] font-black not-italic inline-block mt-1">함께합니다.</span>
              </h1>
              <p className="text-slate-100 text-lg md:text-xl mb-10 leading-relaxed font-normal drop-shadow-sm">
                당신의 건강을 지켜드리는 김포 제일하나의료기입니다.<br />
                노인 장기 요양 보험 등급을 받으신 어르신들을 위해<br />
                다양한 복지용구를 전문적으로 취급하고 있습니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#catalog" className="bg-[#C29B2C] text-[#000F1D] px-8 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-all shadow-xl shadow-[#C29B2C]/30 hover:-translate-y-1">
                  복지용구 물품 구경하기 <ChevronRight size={20} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3대 핵심 프로그램 */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-black text-[#000F1D] mb-4 tracking-tighter">
                핵심 서비스 안내
              </h2>
              <p className="text-slate-900 font-extrabold text-lg">
                고객님의 상황에 가장 적합한 최선의 솔루션을 제안해 드립니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['rental', 'sale', 'premium'] as Array<keyof typeof CATEGORIES>).map((key, i) => {
                const cat = CATEGORIES[key];
                const icons = [Package, ShoppingBag, Heart];
                const Icon = icons[i];
                return (
                  <motion.div 
                    key={key}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 md:p-12 rounded-[32px] bg-slate-50 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group"
                  >
                    <div className="w-16 h-16 bg-[#000F1D] rounded-2xl flex items-center justify-center text-[#D4AF37] mb-8 group-hover:scale-110 transition-transform shadow-xl">
                      <Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-[#000F1D] mb-4">{cat.title}</h3>
                    <p className="text-[#000F1D] font-extrabold text-lg leading-snug mb-6 border-l-4 border-[#C29B2C] pl-4">
                      "{cat.description}"
                    </p>
                    <p className="text-slate-900 text-base leading-relaxed font-medium">
                      {cat.details}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 물품 카탈로그 */}
        <section id="catalog" className="py-24 bg-slate-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
              <div className="max-w-2xl text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-[#000F1D] mb-6 tracking-tight">
                  주요 취급 물품 <span className="text-[#C29B2C]">목록</span>
                </h2>
                <p className="text-slate-800 text-lg font-medium mb-3">
                  매장에서 직접 보시고 선택하실 수 있는 믿을 수 있는 제품들입니다. 클릭하여 상세 정보를 확인하세요.
                </p>
                <div className="inline-flex items-start sm:items-center gap-2.5 p-3.5 sm:px-4 sm:py-3 bg-white border border-[#C29B2C]/40 rounded-2xl shadow-sm text-left">
                  <span className="shrink-0 px-2.5 py-1 bg-[#C29B2C] text-[#000F1D] rounded-full text-xs font-black">
                    안내
                  </span>
                  <p className="text-slate-700 text-sm sm:text-base font-semibold leading-relaxed">
                    김포에서 가장 크고 오래 의료기 판매 및 병원소모품을 취급합니다. <span className="text-[#000F1D] font-bold">사진 이외의 물품을 원하시면 연락부탁드립니다.</span>
                  </p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#edit-section"
                    className="flex items-center gap-2 px-5 py-3 bg-[#000F1D] text-[#D4AF37] rounded-2xl font-black hover:bg-[#001A33] transition-all shadow-md active:scale-95"
                  >
                    <Plus size={18} /> 새 상품 등록하기
                  </a>
                  <a
                    href="#admin-product-list"
                    className="flex items-center gap-2 px-5 py-3 bg-slate-200 text-slate-800 rounded-2xl font-black hover:bg-slate-300 transition-all shadow-sm active:scale-95"
                  >
                    전체 목록 관리 ({products.length}개)
                  </a>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all border border-red-100 active:scale-95"
                  >
                    <LogOut size={18} /> 로그아웃
                  </button>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="mb-8 p-5 bg-[#C29B2C]/10 border-2 border-[#C29B2C]/30 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
                <div className="flex items-center gap-3 text-[#000F1D] font-black text-sm md:text-base">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    <strong>[관리자 모드 활성]</strong> 각 상품 카드의 <strong>[수정]</strong> 및 <strong className="text-red-600">[삭제]</strong> 버튼으로 즉시 관리할 수 있습니다.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={seedDefaultProducts}
                    disabled={isSeeding}
                    className="text-xs font-bold bg-white text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <RotateCcw size={13} /> {isSeeding ? '등록 중...' : '기본 샘플 복구/등록'}
                  </button>
                  <a 
                    href="#admin-product-list" 
                    className="text-xs font-black text-[#C29B2C] hover:underline"
                  >
                    상품 전체 리스트 보기 ({products.length}개) ↓
                  </a>
                </div>
              </div>
            )}

            {/* 카테고리 탭 네비게이션 */}
            <div className="flex flex-wrap items-center gap-2.5 md:gap-3 mb-10">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-5 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-[#000F1D] text-[#D4AF37] shadow-lg shadow-navy-900/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                전체보기
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                  activeTab === 'all' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-slate-100 text-slate-600'
                }`}>
                  {products.length}
                </span>
              </button>

              {(['rental', 'sale', 'premium'] as Array<keyof typeof CATEGORIES>).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const count = products.filter(p => p.category === catKey).length;
                const isActive = activeTab === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setActiveTab(catKey)}
                    className={`px-5 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#000F1D] text-[#D4AF37] shadow-lg shadow-navy-900/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat.title}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3대 카테고리별 분할 영역 */}
            <div className="space-y-14">
              {(['rental', 'sale', 'premium'] as Array<keyof typeof CATEGORIES>)
                .filter(catKey => activeTab === 'all' || activeTab === catKey)
                .map((catKey) => {
                  const cat = CATEGORIES[catKey];
                  const catProducts = products.filter(p => p.category === catKey);

                  return (
                    <div key={catKey} className="bg-white p-6 md:p-10 rounded-[36px] border border-slate-200/90 shadow-sm">
                      {/* 카테고리 헤더 */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 bg-[#000F1D] text-[#D4AF37] rounded-2xl text-base font-black tracking-tight shadow-md">
                            {cat.title}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                            총 {catProducts.length}개 물품
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 border-l-4 border-[#C29B2C] pl-3 py-0.5">
                          {cat.description}
                        </p>
                      </div>

                      {/* 카테고리 물품 그리드 */}
                      {catProducts.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-500 font-bold text-sm">등록된 {cat.title}이 없습니다.</p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormState(prev => ({ ...prev, category: catKey }));
                                document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="mt-3 text-xs font-black text-[#C29B2C] hover:underline inline-block"
                            >
                              + 이 카테고리에 새 상품 등록하기
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                          <AnimatePresence mode="popLayout">
                            {catProducts.map((product) => (
                              <motion.div 
                                layout
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                onClick={() => setSelectedProduct(product)}
                                className="group relative bg-slate-50/70 hover:bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-200 cursor-pointer flex flex-col justify-between"
                              >
                                <div>
                                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {isAdmin && (
                                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                                        <button 
                                          title="상품 수정"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(product);
                                          }}
                                          className="p-2 bg-[#000F1D]/90 text-[#D4AF37] rounded-xl shadow-lg hover:bg-[#000F1D] transition-all active:scale-90 backdrop-blur-sm"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button 
                                          title="상품 삭제"
                                          disabled={deletingId === product.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteProduct(product.id, product.name);
                                          }}
                                          className="p-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all active:scale-90 disabled:opacity-50"
                                        >
                                          <Trash2 size={14} className={deletingId === product.id ? 'animate-spin' : ''} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4 md:p-5">
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C29B2C] font-black mb-1 block">
                                      {CATEGORIES[product.category]?.title || '의료기기'}
                                    </span>
                                    <h4 className="text-[#000F1D] font-extrabold text-base md:text-lg truncate mb-1">
                                      {product.name}
                                    </h4>
                                  </div>
                                </div>

                                {isAdmin && (
                                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(product);
                                      }}
                                      className="flex-1 py-2 text-xs font-black bg-slate-200/80 text-slate-800 rounded-xl hover:bg-slate-300 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                      <Edit2 size={12} /> 수정
                                    </button>
                                    <button
                                      type="button"
                                      disabled={deletingId === product.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteProduct(product.id, product.name);
                                      }}
                                      className="flex-1 py-2 text-xs font-black bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                                    >
                                      <Trash2 size={12} className={deletingId === product.id ? 'animate-spin' : ''} />
                                      {deletingId === product.id ? '삭제 중...' : '삭제'}
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* 관리자 물품 등록 및 전체 관리 구역 */}
            {isAdmin && (
              <div id="edit-section" className="mt-24 bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-10 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#000F1D] text-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg">
                      <Plus size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-[#000F1D]">{isEditing ? '물품 정보 수정' : '새 상품 등록'}</h3>
                      <p className="text-slate-500 font-bold">매장 쇼룸에 표시될 상품 정보를 입력하세요.</p>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(null);
                        setFormState({ name: '', imageUrl: '', category: 'rental', description: '', additionalImages: [] });
                      }}
                      className="px-4 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                    >
                      새 상품 등록으로 전환
                    </button>
                  )}
                </div>

                <form onSubmit={addOrUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">물품 이름 *</label>
                      <input 
                        type="text" 
                        placeholder="예: 수동 휠체어 A형" 
                        required
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] bg-slate-50 font-bold"
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">카테고리 *</label>
                      <select 
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] appearance-none bg-slate-50 font-bold cursor-pointer"
                        value={formState.category}
                        onChange={e => setFormState({...formState, category: e.target.value as any})}
                      >
                        <option value="rental">대여용품</option>
                        <option value="sale">일반용품</option>
                        <option value="premium">복지용구 판매용품</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">상세 설명</label>
                      <textarea 
                        rows={5}
                        placeholder="물품의 특징이나 장점을 적어주세요."
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] bg-slate-50 font-bold resize-none"
                        value={formState.description}
                        onChange={e => setFormState({...formState, description: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">대표 이미지 *</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center cursor-pointer hover:border-[#C29B2C] transition-all bg-slate-50 relative group overflow-hidden"
                      >
                        {formState.imageUrl ? (
                          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden">
                            <img src={formState.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-bold text-sm">이미지 변경</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12">
                            <ImageIcon className="mx-auto text-slate-400 mb-2" size={40} />
                            <p className="text-slate-600 font-bold text-sm">클릭하여 대표 이미지 업로드</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => handleFileChange(e, false)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">추가 상세 이미지들 (선택)</label>
                      <div 
                        onClick={() => multiFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-[#C29B2C] bg-slate-50"
                      >
                        <p className="text-slate-500 font-bold text-xs">+ 여러 장 추가하기</p>
                        <input 
                          type="file" 
                          ref={multiFileInputRef} 
                          className="hidden" 
                          multiple 
                          accept="image/*"
                          onChange={e => handleFileChange(e, true)}
                        />
                      </div>
                      {formState.additionalImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-4">
                          {formState.additionalImages.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                              <img src={img} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormState(prev => ({
                                    ...prev,
                                    additionalImages: prev.additionalImages.filter((_, idx) => idx !== i)
                                  }));
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex gap-4">
                      {isEditing && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditing(null);
                            setFormState({ name: '', imageUrl: '', category: 'rental', description: '', additionalImages: [] });
                          }}
                          className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black hover:bg-slate-300 active:scale-95 transition-all"
                        >
                          수정 취소
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-[2] bg-[#000F1D] text-[#D4AF37] py-4 rounded-2xl font-black hover:bg-[#001A33] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? '저장 중...' : (isEditing ? '상품 정보 수정 완료' : '새 상품 등록 완료')}
                      </button>
                    </div>
                  </div>
                </form>

                {/* 등록된 상품 리스트 및 일괄 관리/삭제 */}
                <div id="admin-product-list" className="mt-16 pt-12 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                      <h4 className="text-2xl font-black text-[#000F1D] tracking-tight">
                        등록된 상품 목록 관리 ({products.length}개)
                      </h4>
                      <p className="text-sm text-slate-500 font-bold mt-1">
                        등록된 모든 상품을 실시간으로 수정하거나 삭제할 수 있습니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={seedDefaultProducts}
                      disabled={isSeeding}
                      className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={14} /> 기본 8종 상품 불러오기
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold">
                      등록된 상품이 없습니다. 위 양식에서 새 상품을 등록하거나 기본 상품을 불러오세요.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
                      {products.map((p) => (
                        <div 
                          key={p.id} 
                          className="p-4 flex items-center justify-between gap-4 hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <img 
                              src={p.imageUrl} 
                              alt={p.name} 
                              className="w-16 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-[#C29B2C] uppercase tracking-wider block">
                                {CATEGORIES[p.category]?.title}
                              </span>
                              <p className="font-extrabold text-[#000F1D] text-base truncate">
                                {p.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                startEdit(p);
                              }}
                              className="px-3.5 py-2 text-xs font-black bg-[#000F1D] text-[#D4AF37] rounded-xl hover:bg-[#001A33] transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Edit2 size={13} /> 수정
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === p.id}
                              onClick={() => deleteProduct(p.id, p.name)}
                              className="px-3.5 py-2 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm disabled:opacity-50"
                            >
                              <Trash2 size={13} className={deletingId === p.id ? 'animate-spin' : ''} />
                              {deletingId === p.id ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 매장 위치 및 오시는 길 */}
        <section id="location" className="py-24 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="mb-12">
                  <h2 className="text-3xl md:text-5xl font-display font-black text-[#000F1D] mb-6 tracking-tighter">
                    매장 안내 및 <span className="text-[#C29B2C] italic">오시는 길</span>
                  </h2>
                  <p className="text-slate-900 text-lg font-bold leading-relaxed">
                    경기도 김포시 통진읍에 위치한 복지용구 전문 매장입니다. <br />
                    어르신들이 불편함 없이 방문하실 수 있도록 쾌적한 환경을 조성하였습니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 bg-slate-50 text-[#C29B2C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#000F1D] text-lg mb-2 italic">매장 주소</h4>
                      <p className="text-slate-900 font-bold leading-snug">경기도 김포시 통진읍 흥신로 320-8</p>
                      <a 
                        href="https://map.naver.com/p/search/%EA%B9%80%ED%8F%AC%ED%95%98%EB%82%98%EC%9D%98%EB%A3%8C%EA%B8%B0/place/58423783" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-600 font-bold text-sm flex items-center gap-1 mt-2 hover:underline"
                      >
                        네이버 지도로 보기 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 bg-slate-50 text-[#C29B2C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Clock size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#000F1D] text-lg mb-2 italic">운영 시간</h4>
                      <div className="text-slate-900 font-bold leading-relaxed text-sm">
                        <div className="flex justify-between gap-4 border-b border-slate-100 pb-1"><span>월 ~ 금</span> <span>10:00 - 18:00</span></div>
                        <div className="flex justify-between gap-4 border-b border-slate-100 py-1"><span>토요일</span> <span>10:00 - 14:00</span></div>
                        <div className="flex justify-between gap-4 pt-1 text-red-600"><span>일요일</span> <span>정기휴무</span></div>
                        
                        <div className="mt-5 p-4 bg-[#C29B2C]/5 border border-[#C29B2C]/20 rounded-2xl text-center">
                          <p className="text-[#C29B2C] font-black text-[14px] leading-relaxed">
                            오시기 전에<br />
                            연락주시면<br />
                            감사하겠습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-[#000F1D] text-white rounded-3xl relative overflow-hidden shadow-2xl mt-10">
                  <p className="text-lg font-bold leading-relaxed relative z-10">
                    "매장 앞 <span className="text-[#D4AF37]">대형 주차 공간</span> 완비! <br /> 방문 전 전화 주시면 필요한 서류나 절차를 미리 안내해 드립니다."
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-square sm:aspect-[4/3] bg-slate-200 rounded-[40px] overflow-hidden shadow-2xl relative border-8 border-white">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3161.424458428589!2d126.6025!3d37.6975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca656789abcd!2z6rK96riw64-EIOq5gO2PrOyLnCDthrXKeOyneOydvSDtnaTsi6BybyAzMjAtOA!5e0!3m2!1sko!2skr!4v1714704000000!5m2!1sko!2skr"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map"
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C29B2C] rounded-full flex items-center justify-center text-[#000F1D] font-black shadow-2xl rotate-12 group-hover:rotate-0 transition-transform">
                  <div className="text-center">
                    <span className="block text-4xl mb-1">P</span>
                    <span className="text-xs uppercase font-black tracking-widest">주차 가능</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 매장 실물 사진 갤러리 섹션 (오시는 길 하단) */}
            <div className="mt-20 pt-16 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-black text-[#C29B2C] uppercase tracking-widest block mb-1">
                    Store Gallery
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#000F1D] tracking-tight flex items-center gap-2.5">
                    <Camera className="text-[#C29B2C]" size={26} /> 매장 실물 둘러보기
                  </h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    김포 제일하나의료기 매장의 전시관, 상담 공간 및 실제 제품 전시 모습입니다.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowStorePhotoAdminModal(true)}
                    className="px-4 py-2.5 bg-[#000F1D] text-[#D4AF37] hover:bg-[#001A33] rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-md shrink-0 active:scale-95"
                  >
                    <Plus size={15} /> 매장 사진 올리기 / 관리
                  </button>
                )}
              </div>

              {storePhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storePhotos.map((photo, index) => (
                    <motion.div
                      key={photo.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => setSelectedStorePhotoModal(photo)}
                      className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-[#C29B2C]/50 hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-3 bg-white/90 text-slate-900 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                            <Maximize2 size={18} />
                          </span>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStorePhoto(photo.id, photo.title);
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-md text-xs"
                            title="사진 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-[#C29B2C] uppercase tracking-wider block mb-1">
                            김포 제일하나의료기
                          </span>
                          <h4 className="font-extrabold text-base text-[#000F1D] group-hover:text-[#C29B2C] transition-colors">
                            {photo.title}
                          </h4>
                          {photo.description && (
                            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium">
                              {photo.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                          <span>매장 방문 시 확인 가능</span>
                          <span className="text-[#C29B2C] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            확대보기 <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Camera size={36} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-600 font-bold text-sm">등록된 매장 사진이 없습니다.</p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowStorePhotoAdminModal(true)}
                      className="mt-4 px-4 py-2 bg-[#000F1D] text-[#D4AF37] text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} /> 매장 사진 올리기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-[#000F1D] text-white py-16 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 border-b border-white/10 pb-12 mb-8">
            <div className="max-w-md">
              <span className="text-2xl sm:text-3xl font-black text-[#D4AF37] block mb-4 tracking-tight">
                김포 제일하나의료기
              </span>
              <p className="text-slate-300 text-base leading-relaxed font-normal opacity-90">
                "어르신의 더 나은 일상을 디자인합니다." <br />
                함께하면 건강한 미래가 열립니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div>
                <h4 className="text-[#D4AF37] font-bold text-lg mb-4 border-b border-[#D4AF37]/20 pb-2 inline-block">고객지원</h4>
                <ul className="space-y-3 text-slate-300 text-sm font-medium">
                  <li className="flex gap-2 items-center">대표번호: 031-989-7295</li>
                  <li className="flex gap-2 items-center">상담문의: 010-3637-7295</li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-bold text-lg mb-4 border-b border-[#D4AF37]/20 pb-2 inline-block">매장 정보</h4>
                <ul className="space-y-2 text-slate-300 text-xs font-medium">
                  <li>사업자등록번호: 137-20-93978</li>
                  <li>대표: 전대운</li>
                  <li className="pt-1">
                    <span className="bg-[#C29B2C]/10 text-[#D4AF37] px-2.5 py-1 rounded text-xs inline-block">김포 페이 가맹점</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 맨 마지막 영역: 저작권 및 우측 최하단 초소형 관리자 로그인 */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-white/30">
            <p className="uppercase tracking-[0.15em] font-medium">© 2024 KIMPO JEIL HANA MEDICAL. ALL RIGHTS RESERVED.</p>
            
            <div>
              {!isAdmin ? (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="text-[11px] text-white/20 hover:text-white/60 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded hover:bg-white/5 font-medium"
                >
                  <LogIn size={11} /> 관리자 로그인
                </button>
              ) : (
                <div className="flex items-center gap-2 text-white/50">
                  <span className="text-[11px] text-[#D4AF37]/80 font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> {user?.displayName || user?.email || '관리자'}
                  </span>
                  <span>·</span>
                  <button 
                    onClick={handleLogout}
                    className="text-[11px] text-red-400/80 hover:text-red-400 transition-colors underline cursor-pointer"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* 상품 상세 모달 */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[40px] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-1/2 bg-slate-100 overflow-y-auto max-h-[40vh] md:max-h-full scrollbar-hide">
                <img src={selectedProduct.imageUrl} className="w-full aspect-[4/3] object-cover" />
                <div className="grid grid-cols-2 gap-1 p-1">
                  {selectedProduct.additionalImages?.map((img, i) => (
                    <img key={i} src={img} className="w-full aspect-square object-cover" />
                  ))}
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="self-end p-2 text-slate-400 hover:text-[#000F1D] mb-4"
                >
                  <X size={32} />
                </button>
                
                <span className="text-sm text-[#C29B2C] font-black tracking-widest mb-2">
                  {CATEGORIES[selectedProduct.category]?.title}
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-[#000F1D] mb-6 tracking-tighter">
                  {selectedProduct.name}
                </h2>
                
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-lg font-black text-[#000F1D] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#C29B2C] rounded-full" />
                      제품 상세 정보
                    </h4>
                    <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedProduct.description || '상세 정보가 준비 중입니다. 매장으로 문의해 주시면 친절히 안내 도와드리겠습니다.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button 
                    onClick={() => {
                       window.location.href = "tel:031-989-7295";
                    }}
                    className="w-full bg-[#000F1D] text-[#D4AF37] py-4 rounded-2xl font-black shadow-xl hover:bg-[#001A33] transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Phone size={18} /> 전화 상담 문의
                  </button>

                  {isAdmin && (
                    <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          const prod = selectedProduct;
                          setSelectedProduct(null);
                          startEdit(prod);
                        }}
                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Edit2 size={16} /> 상품 정보 수정
                      </button>
                      <button 
                        type="button"
                        disabled={deletingId === selectedProduct.id}
                        onClick={() => {
                          deleteProduct(selectedProduct.id, selectedProduct.name);
                        }}
                        className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 size={16} className={deletingId === selectedProduct.id ? 'animate-spin' : ''} />
                        {deletingId === selectedProduct.id ? '삭제 중...' : '이 상품 삭제'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 관리자 로그인 모달 (비밀번호 / Google 계정) */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#000F1D]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 md:p-12 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-[#000F1D] transition-all hover:rotate-90"
              >
                <X size={32} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#000F1D] text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <KeyRound size={26} />
                </div>
                <h3 className="text-2xl font-black text-[#000F1D] mb-1 tracking-tight">관리자 로그인</h3>
                <p className="text-slate-500 font-medium text-xs">Google 계정으로 관리자 인증을 진행합니다</p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium">
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-3.5 rounded-2xl font-bold text-slate-800 hover:bg-slate-50 hover:border-[#C29B2C] transition-all shadow-sm active:scale-95 px-5 group disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  {isLoggingIn ? 'Google 로그인 진행 중...' : 'Google 계정으로 로그인'}
                </button>
                
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  로그인 완료 시 상품 등록, 수정 및 삭제 권한이 활성화됩니다.
                </p>

                {/* 비상 백업 로그인 (도메인/팝업 차단 발생 시 사용) */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  {!showEmergencyPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowEmergencyPassword(true)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium"
                    >
                      Google 로그인 오류 또는 팝업 차단 시 비밀번호로 인증
                    </button>
                  ) : (
                    <form onSubmit={handleEmergencyPasswordLogin} className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="관리자 비상 비밀번호 입력"
                          value={emergencyPasswordInput}
                          onChange={(e) => setEmergencyPasswordInput(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#C29B2C] text-center"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-[#000F1D] text-[#D4AF37] text-xs font-bold rounded-xl hover:bg-[#001A33] transition-all"
                        >
                          인증
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 매장 사진 확대 모달 */}
      <AnimatePresence>
        {selectedStorePhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedStorePhotoModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#000F1D] border border-[#C29B2C]/30 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedStorePhotoModal(null)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-black">
                <img
                  src={selectedStorePhotoModal.imageUrl}
                  alt={selectedStorePhotoModal.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6 bg-[#000F1D] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#C29B2C] text-[#000F1D] text-xs font-black">
                      김포 제일하나의료기
                    </span>
                    <h3 className="text-xl font-black text-white">{selectedStorePhotoModal.title}</h3>
                  </div>
                  {selectedStorePhotoModal.description && (
                    <p className="text-slate-300 text-sm font-medium">
                      {selectedStorePhotoModal.description}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedStorePhotoModal.id;
                      const title = selectedStorePhotoModal.title;
                      setSelectedStorePhotoModal(null);
                      handleDeleteStorePhoto(id, title);
                    }}
                    className="px-4 py-2.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    <Trash2 size={14} /> 이 사진 삭제
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 관리자 매장 사진 등록 및 관리 모달 */}
      <AnimatePresence>
        {showStorePhotoAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#000F1D]/95 backdrop-blur-md"
            onClick={() => setShowStorePhotoAdminModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[36px] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="p-6 md:p-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#000F1D] text-[#D4AF37] flex items-center justify-center shadow-lg">
                    <Camera size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-[#000F1D]">매장 실물 사진 관리</h3>
                    <p className="text-xs text-slate-500 font-medium">상단 배너에 노출될 매장 실물 사진을 업로드하고 관리합니다.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStorePhotoAdminModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={26} />
                </button>
              </div>

              {/* 모달 본문 */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {/* 사진 업로드 폼 */}
                <form onSubmit={handleAddStorePhoto} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-black text-[#000F1D] flex items-center gap-2">
                    <Plus size={16} className="text-[#C29B2C]" /> 새 매장 사진 추가
                  </h4>

                  {/* 사진 선택 / 미리보기 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">사진 이미지 *</label>
                    <input
                      ref={storePhotoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleStorePhotoFileChange}
                      className="hidden"
                    />

                    {storePhotoForm.imageUrl ? (
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border-2 border-[#C29B2C] group">
                        <img
                          src={storePhotoForm.imageUrl}
                          alt="업로드 미리보기"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => storePhotoFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow hover:bg-slate-100"
                          >
                            사진 변경
                          </button>
                          <button
                            type="button"
                            onClick={() => setStorePhotoForm(prev => ({ ...prev, imageUrl: '' }))}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => storePhotoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-[#C29B2C] rounded-2xl p-6 text-center cursor-pointer transition-all bg-white hover:bg-[#C29B2C]/5"
                      >
                        <UploadCloud size={32} className="mx-auto mb-2 text-[#C29B2C]" />
                        <p className="text-xs font-bold text-slate-700">기기에서 매장 사진 선택 (클릭)</p>
                        <p className="text-[11px] text-slate-400 mt-1">스마트폰 사진, 카메라 앨범에서 직접 선택 가능</p>
                      </div>
                    )}

                    {/* 또는 URL 직접 입력 */}
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="또는 이미지 웹 URL 주소 직접 입력"
                        value={storePhotoForm.imageUrl}
                        onChange={(e) => setStorePhotoForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C29B2C]"
                      />
                    </div>
                  </div>

                  {/* 사진 제목 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">사진 명칭 / 위치 *</label>
                    <input
                      type="text"
                      placeholder="예: 매장 입구 및 안내 데스크, 복지용구 전시장, 상담실"
                      value={storePhotoForm.title}
                      onChange={(e) => setStorePhotoForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C29B2C]"
                    />
                  </div>

                  {/* 상세 설명 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">간단 소개 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 전동침대 및 휠체어를 직접 체험해보실 수 있는 쾌적한 공간입니다."
                      value={storePhotoForm.description}
                      onChange={(e) => setStorePhotoForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C29B2C]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingStorePhoto || !storePhotoForm.imageUrl}
                    className="w-full py-3 bg-[#000F1D] hover:bg-[#001A33] text-[#D4AF37] font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {isUploadingStorePhoto ? '사진 저장 중...' : '매장 사진 등록 완료'}
                  </button>
                </form>

                {/* 현재 등록된 사진 목록 */}
                <div>
                  <h4 className="text-sm font-black text-[#000F1D] mb-3 flex items-center justify-between">
                    <span>현재 등록된 매장 사진 ({storePhotos.length}장)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {storePhotos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{photo.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{photo.description || '김포 제일하나의료기'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={deletingStorePhotoId === photo.id}
                          onClick={() => handleDeleteStorePhoto(photo.id, photo.title)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowStorePhotoAdminModal(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
