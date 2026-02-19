'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config'; 

// --- TIPE DATA ---
type Subscription = { 
    id: string; 
    plan_type: string; 
    start_time: string; 
    end_time: string; 
};

type User = { 
    id: string; 
    email: string; 
    role: string; 
    status: string; 
    last_order_info: string | null;
    registered_device_id: string | null; 
    Subscription: Subscription | null; 
};

type StreamSource = { name: string; url: string }; 

type Schedule = { 
    id: string; 
    title: string; 
    sources: StreamSource[]; 
    start_time: string; 
    is_active: boolean; 
    thumbnail: string | null; 
    price: number; 
};

type MediaFile = { name: string; url: string; time: number; };

type Package = { 
    id: string; 
    title: string; 
    price: number; 
    duration: number; 
    description: string | null; 
    topic?: string;
    is_limited?: boolean;
    stock?: number;
    is_active?: boolean;
    image_url?: string; 
};

// --- ICONS ---
const Icons = {
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Broadcast: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 5.1"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 5.1C23 8.8 23 15.2 19.1 19.1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
};

export default function AdminPage() {
  const { token, logout, isLoading } = useAuth();
  const router = useRouter();
  const backendUrl = getBackendUrl();
  
  // State Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'schedules' | 'offers'>('users');
  
  // --- STATE USERS ---
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // --- STATE SCHEDULES & OFFERS ---
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [qrisUrl, setQrisUrl] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [mediaMode, setMediaMode] = useState<'schedule' | 'qris' | 'package'>('schedule');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Forms
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormDuration, setUserFormDuration] = useState(30);
  const [bulkText, setBulkText] = useState('');
  const [bulkDuration, setBulkDuration] = useState(30);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleThumbnail, setNewScheduleThumbnail] = useState('');
  const [newSchedulePrice, setNewSchedulePrice] = useState('');
  const [streamSources, setStreamSources] = useState<StreamSource[]>([{ name: 'Server 1', url: '' }]);

  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDuration, setPkgDuration] = useState('');
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgTopic, setPkgTopic] = useState('');
  const [pkgIsLimited, setPkgIsLimited] = useState(false);
  const [pkgStock, setPkgStock] = useState('');
  const [pkgImage, setPkgImage] = useState('');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Logic Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- API FETCHERS ---
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsLoadingUsers(true);
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            search: debouncedSearch,
            status: userFilter
        });
        const res = await fetch(`${backendUrl}/api/v1/admin/users?${params.toString()}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            setUsers(data.data);
            setTotalPages(data.meta.totalPages);
            setTotalUsers(data.meta.total);
            setSelectedUserIds(new Set());
        }
    } catch (e) { showToast('Gagal load users', 'error'); }
    finally { setIsLoadingUsers(false); }
  }, [token, page, debouncedSearch, userFilter, backendUrl]);

  const fetchGlobalData = async () => {
     if (!token) return;
     try {
         const [resSched, resPkg] = await Promise.all([
             fetch(`${backendUrl}/api/v1/admin/schedules`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${backendUrl}/api/v1/admin/packages`, { headers: { 'Authorization': `Bearer ${token}` } })
         ]);
         if(resSched.ok) setSchedules(await resSched.json());
         if(resPkg.ok) {
             const data = await resPkg.json();
             setPackages(data.packages);
             setQrisUrl(data.qrisUrl);
         }
     } catch (e) { console.error(e); }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/admin/media`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMediaFiles(await res.json());
    } catch (err) { showToast('Gagal load media', 'error'); }
  };

  useEffect(() => {
    if (!isLoading && token) {
      if (activeTab === 'users') fetchUsers();
      else fetchGlobalData();
    }
  }, [token, activeTab, fetchUsers, isLoading]);

  // --- ACTIONS (INCLUDING MISSING HANDLERS) ---
  const isUserExpired = (user: User) => {
      if (user.status === 'PENDING') return false;
      if (!user.Subscription) return true;
      return new Date().getTime() > new Date(user.Subscription.end_time).getTime();
  };

  const handleSelectUser = (id: string) => {
      const newSet = new Set(selectedUserIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedUserIds(newSet);
  };

  const handleBulkDelete = async () => {
      if (!confirm(`Hapus ${selectedUserIds.size} user?`)) return;
      await fetch(`${backendUrl}/api/v1/admin/users/bulk`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedUserIds) })
      });
      fetchUsers();
  };

  const handleApproveClick = (user: User) => {
      setEditingUser(user);
      setUserFormDuration(30); 
      setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
      if (!editingUser) return;
      await fetch(`${backendUrl}/api/v1/admin/users/${editingUser.id}/approve`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationDays: userFormDuration })
      });
      setShowApproveModal(false);
      fetchUsers();
  };

  // HANDLER YANG TADI HILANG
  const handleResetDevice = async (id: string) => {
      if(!confirm('Reset kunci perangkat user ini?')) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/${id}/reset-device`, {
              method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { showToast('Device Reset!', 'success'); fetchUsers(); }
      } catch (e) { showToast('Gagal reset device', 'error'); }
  };

  const handleEditUserClick = (user: User) => {
      setEditingUser(user);
      setUserFormEmail(user.email);
      setUserFormDuration(0);
      setShowEditUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
      if(!confirm('Hapus user ini selamanya?')) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/${id}`, {
              method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { showToast('User Deleted', 'success'); fetchUsers(); }
      } catch (e) { showToast('Gagal hapus user', 'error'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userFormEmail, durationDays: Number(userFormDuration) })
          });
          if(res.ok) { showToast('User Created!', 'success'); setShowUserModal(false); fetchUsers(); }
      } catch (e) { showToast('Gagal membuat user', 'error'); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingUser) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/${editingUser.id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userFormEmail, durationDays: Number(userFormDuration) || undefined })
          });
          if(res.ok) { showToast('User Updated!', 'success'); setShowEditUserModal(false); fetchUsers(); }
      } catch (e) { showToast('Gagal update user', 'error'); }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
      e.preventDefault();
      setBulkLoading(true);
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/bulk`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ rawText: bulkText, durationDays: Number(bulkDuration) })
          });
          const data = await res.json();
          showToast(data.message, 'success');
          setBulkText('');
          setShowBulkModal(false);
          fetchUsers();
      } catch (e) { showToast('Gagal import bulk', 'error'); }
      finally { setBulkLoading(false); }
  };

  // --- DYNAMIC SOURCE LOGIC ---
  const addSourceField = () => {
    setStreamSources([...streamSources, { name: `Server ${streamSources.length + 1}`, url: '' }]);
  };

  const updateSourceField = (index: number, field: keyof StreamSource, value: string) => {
    const newSources = [...streamSources];
    newSources[index][field] = value;
    setStreamSources(newSources);
  };

  const removeSourceField = (index: number) => {
    if (streamSources.length > 1) {
      setStreamSources(streamSources.filter((_, i) => i !== index));
    }
  };

  // --- SCHEDULE CRUD ---
  const handleOpenScheduleModal = (s?: Schedule) => {
    if (s) {
      setEditingSchedule(s);
      setNewScheduleTitle(s.title);
      setNewScheduleTime(new Date(s.start_time).toISOString().slice(0, 16));
      setNewScheduleThumbnail(s.thumbnail || '');
      setNewSchedulePrice(s.price.toString());
      setStreamSources(s.sources && s.sources.length > 0 ? s.sources : [{ name: 'Server 1', url: '' }]);
    } else {
      setEditingSchedule(null);
      setNewScheduleTitle('');
      setNewScheduleTime('');
      setNewScheduleThumbnail('');
      setNewSchedulePrice('');
      setStreamSources([{ name: 'Server 1', url: '' }]);
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newScheduleTitle,
      start_time: newScheduleTime,
      thumbnail: newScheduleThumbnail,
      price: Number(newSchedulePrice),
      sources: streamSources
    };

    const url = editingSchedule 
      ? `${backendUrl}/api/v1/admin/schedules/${editingSchedule.id}`
      : `${backendUrl}/api/v1/admin/schedules`;
    
    const method = editingSchedule ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Schedule Saved!', 'success');
      setShowScheduleModal(false);
      fetchGlobalData();
    }
  };

  const handleToggleSchedule = async (s: Schedule) => {
    const action = s.is_active ? 'stop' : 'activate';
    await fetch(`${backendUrl}/api/v1/admin/schedules/${s.id}/${action}`, {
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchGlobalData();
  };

  // --- PACKAGE CRUD ---
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: pkgTitle, price: pkgPrice, duration: pkgDuration, description: pkgFeatures, topic: pkgTopic, is_limited: pkgIsLimited, stock: pkgStock, image_url: pkgImage };
    const url = editingPackage ? `${backendUrl}/api/v1/admin/packages/${editingPackage.id}` : `${backendUrl}/api/v1/admin/packages`;
    const res = await fetch(url, {
      method: editingPackage ? 'PUT' : 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if(res.ok) { setShowPackageModal(false); fetchGlobalData(); }
  };

  const handleTogglePackageStatus = async (pkg: Package) => {
    await fetch(`${backendUrl}/api/v1/admin/packages/${pkg.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active })
    });
    fetchGlobalData();
  };

  const handleDeletePackage = async (id: string) => {
    if(!confirm('Hapus paket?')) return;
    await fetch(`${backendUrl}/api/v1/admin/packages/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchGlobalData();
  };

  // --- MEDIA UPLOAD ---
  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append(mediaMode === 'qris' ? 'qrisFile' : 'file', e.target.files[0]);
    setUploading(true);
    const res = await fetch(`${backendUrl}/api/v1/admin/upload`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
    });
    if (res.ok) {
      const data = await res.json();
      if (mediaMode === 'qris') {
        await fetch(`${backendUrl}/api/v1/admin/settings/qris`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: data.url })
        });
        setQrisUrl(data.url);
      }
      fetchMedia();
    }
    setUploading(false);
  };

  const handleSelectMedia = (url: string) => {
    if (mediaMode === 'schedule') setNewScheduleThumbnail(url);
    else if (mediaMode === 'package') setPkgImage(url);
    setShowMediaModal(false);
  };

  if (isLoading || !token) return <div className="min-h-screen bg-black" />;

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-100 font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-black/50 backdrop-blur-xl fixed h-full z-20">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-xl font-black tracking-tighter text-yellow-500 uppercase">
            Control<br/><span className="text-white">Center</span>
          </h1>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'}`}><Icons.Users /> <span>Users</span></button>
          <button onClick={() => setActiveTab('schedules')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'schedules' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'}`}><Icons.Broadcast /> <span>Schedules</span></button>
          <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'offers' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'}`}><Icons.Gift /> <span>Settings</span></button>
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold"><Icons.Logout /> <span>Exit</span></button>
        </div>
      </aside>

      {/* --- MAIN --- */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
          <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                {activeTab === 'users' ? 'User Database' : activeTab === 'schedules' ? 'Stream Production' : 'Offers & QRIS'}
              </h2>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em]">Realtime48 Management</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
             {activeTab === 'users' && (
                <div className="relative flex-1 lg:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600"><Icons.Search /></div>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 text-white text-sm rounded-2xl block pl-12 p-3.5 w-full lg:w-72 outline-none focus:border-yellow-500 transition-all" />
                </div>
             )}
             <button onClick={() => {
                 if (activeTab === 'users') setShowUserModal(true);
                 else if (activeTab === 'schedules') handleOpenScheduleModal();
                 else setShowPackageModal(true);
             }} className="bg-yellow-500 text-black px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-yellow-500/20">
                <Icons.Plus /> <span className="uppercase text-[11px] tracking-widest">Add New</span>
            </button>
          </div>
        </header>

        {toast && <div className={`fixed top-10 right-10 z-[100] px-8 py-5 rounded-3xl shadow-2xl border animate-in slide-in-from-right-10 font-black text-[11px] uppercase tracking-widest ${toast.type === 'success' ? 'bg-green-500 text-black border-green-400' : 'bg-red-500 text-white border-red-400'}`}>{toast.msg}</div>}

        {/* --- USERS TABLE --- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                 {(['ALL', 'ACTIVE', 'PENDING', 'EXPIRED'] as const).map(f => (
                     <button key={f} onClick={() => { setUserFilter(f); setPage(1); }} className={`px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all border uppercase ${userFilter === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}>{f}</button>
                 ))}
             </div>

             <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#0a0a0a] shadow-2xl relative min-h-[400px]">
                {isLoadingUsers && <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-md flex items-center justify-center font-black text-yellow-500 animate-pulse uppercase tracking-[0.5em]">Syncing...</div>}
                <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-gray-500 uppercase tracking-[0.2em] text-[10px] font-black">
                    <tr>
                        <th className="p-6 w-4"><input type="checkbox" className="accent-yellow-500" /></th>
                        <th className="p-6">User Identity</th>
                        <th className="p-6">Plan Status</th>
                        <th className="p-6 text-center">Device Lock</th>
                        <th className="p-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.length > 0 ? users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-6"><input type="checkbox" checked={selectedUserIds.has(u.id)} onChange={() => handleSelectUser(u.id)} className="accent-yellow-500" /></td>
                            <td className="p-6"><div className="font-bold text-white mb-1">{u.email}</div><div className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">{u.status}</div></td>
                            <td className="p-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${u.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : isUserExpired(u) ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                    {u.status === 'PENDING' ? 'Pending' : isUserExpired(u) ? 'Expired' : u.Subscription?.plan_type || 'Active'}
                                </span>
                            </td>
                            <td className="p-6 text-center">{u.registered_device_id ? <button onClick={() => handleResetDevice(u.id)} className="text-[10px] font-black text-yellow-600 bg-yellow-500/5 px-3 py-1.5 rounded-full border border-yellow-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all uppercase tracking-widest">Locked</button> : <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Unlocked</span>}</td>
                            <td className="p-6 text-right">
                                {u.status === 'PENDING' ? (
                                    <button onClick={() => handleApproveClick(u)} className="bg-green-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Approve</button>
                                ) : (
                                    <div className="flex justify-end gap-3 text-gray-600"><button onClick={() => handleEditUserClick(u)} className="hover:text-yellow-500"><Icons.Edit /></button><button onClick={() => handleDeleteUser(u.id)} className="hover:text-red-500"><Icons.Trash /></button></div>
                                )}
                            </td>
                        </tr>
                    )) : <tr><td colSpan={5} className="p-20 text-center text-gray-700 font-black uppercase tracking-widest text-xs">No records available</td></tr>}
                </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- SCHEDULES TAB --- */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {schedules.map((s) => (
              <div key={s.id} className={`rounded-3xl border p-6 flex flex-col md:flex-row gap-6 transition-all ${s.is_active ? 'border-green-500/30 bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : 'border-white/5 bg-[#0a0a0a]'}`}>
                <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                   {s.thumbnail ? <img src={s.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-800"><Icons.Broadcast /></div>}
                </div>
                <div className="flex-1 flex flex-col">
                   <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-black text-white leading-tight">{s.title}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenScheduleModal(s)} className="text-gray-600 hover:text-yellow-500"><Icons.Edit /></button>
                        <button onClick={() => handleDeleteSchedule(s.id)} className="text-gray-600 hover:text-red-500"><Icons.Trash /></button>
                      </div>
                   </div>
                   <div className="flex-1 space-y-2 mb-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      <p>📅 {new Date(s.start_time).toLocaleString()}</p>
                      <p>📡 {s.sources?.length || 0} Servers Configured</p>
                   </div>
                   <button onClick={() => handleToggleSchedule(s)} className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase transition-all ${s.is_active ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:bg-yellow-500'}`}>{s.is_active ? 'Stop Siaran' : 'Mulai Siaran'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- OFFERS TAB --- */}
        {activeTab === 'offers' && (
          <div className="space-y-12">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8">
               <div className="w-32 h-32 bg-white rounded-2xl overflow-hidden relative group shrink-0 border border-white/10">
                  {qrisUrl ? <img src={qrisUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black font-black text-[10px]">NO QRIS</div>}
                  <div onClick={() => {setMediaMode('qris'); setShowMediaModal(true); fetchMedia();}} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all uppercase text-[9px] font-black">Ganti QRIS</div>
               </div>
               <div><h3 className="text-xl font-black text-white mb-2">QRIS Payment Gateway</h3><p className="text-gray-500 text-xs leading-relaxed max-w-md">Update gambar QRIS utama untuk memproses pembayaran manual dari user baru.</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {packages.map(p => (
                 <div key={p.id} className={`bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 relative flex flex-col group ${!p.is_active && 'opacity-40 grayscale'}`}>
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => {setEditingPackage(p); handleSavePackage(null as any);}} className="text-gray-500 hover:text-white"><Icons.Edit /></button>
                       <button onClick={() => handleDeletePackage(p.id)} className="text-gray-500 hover:text-red-500"><Icons.Trash /></button>
                    </div>
                    {p.image_url && <img src={p.image_url} className="h-16 w-16 rounded-xl object-cover mb-6" />}
                    <h3 className="text-lg font-black text-white mb-1">{p.title}</h3>
                    <div className="text-2xl font-black text-yellow-500 mb-6 font-mono">Rp {p.price.toLocaleString()}</div>
                    <button onClick={() => handleTogglePackageStatus(p)} className="mt-auto w-full py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">{p.is_active ? 'Disable' : 'Enable'}</button>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* CREATE/EDIT USER */}
      {(showUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2rem] p-10 relative">
                <button onClick={() => {setShowUserModal(false); setShowEditUserModal(false);}} className="absolute top-8 right-8 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">{showEditUserModal ? 'Update User' : 'New Access'}</h3>
                <form onSubmit={showEditUserModal ? handleUpdateUser : handleCreateUser} className="space-y-6">
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">User Email</label><input type="email" value={userFormEmail} onChange={e => setUserFormEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-yellow-500" required /></div>
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Duration (Days)</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-yellow-500" required /></div>
                    <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-yellow-500 transition-all uppercase text-xs tracking-widest">Process Data</button>
                </form>
            </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative">
                <button onClick={() => setShowApproveModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">Approve User</h3>
                <p className="text-xs text-gray-500 mb-8 font-mono">{editingUser.email}</p>
                {editingUser.last_order_info && (
                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-6 rounded-2xl mb-8 text-xs text-yellow-200 leading-relaxed italic">
                        <strong>Order Info:</strong><br/>{editingUser.last_order_info}
                    </div>
                )}
                <div className="space-y-6">
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Duration (Days)</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-green-500" /></div>
                    <button onClick={handleConfirmApprove} className="w-full bg-green-500 text-black font-black py-4 rounded-xl hover:scale-105 transition-all uppercase text-xs tracking-widest">Activate Access</button>
                </div>
            </div>
        </div>
      )}

      {/* SCHEDULE MODAL (Multi-Server) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-12 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setShowScheduleModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-3xl font-black text-white mb-10 tracking-tighter">Event Config</h3>
                <form onSubmit={handleSaveSchedule} className="space-y-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Judul Event</label><input type="text" value={newScheduleTitle} onChange={e => setNewScheduleTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none" required /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Time</label><input type="datetime-local" value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none" required /></div>
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Price</label><input type="number" value={newSchedulePrice} onChange={e => setNewSchedulePrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none" /></div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Sources</label><button type="button" onClick={addSourceField} className="bg-white/5 text-white text-[9px] font-black px-4 py-2 rounded-full border border-white/10 uppercase">+ Add</button></div>
                        <div className="space-y-4">
                          {streamSources.map((src, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex gap-4">
                               <div className="flex-1 space-y-2">
                                  <input placeholder="Server Name" value={src.name} onChange={e => updateSourceField(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-xs font-bold py-2 outline-none text-white" />
                                  <input placeholder="URL Link" value={src.url} onChange={e => updateSourceField(idx, 'url', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-[10px] py-2 outline-none text-gray-400" required />
                               </div>
                               {streamSources.length > 1 && <button type="button" onClick={() => removeSourceField(idx)} className="text-red-500/30 hover:text-red-500 transition-colors self-center"><Icons.Trash /></button>}
                            </div>
                          ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs">Save Schedule</button>
                </form>
            </div>
        </div>
      )}

      {/* MEDIA MODAL */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-12 relative h-[85vh] flex flex-col">
                <button onClick={() => setShowMediaModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase tracking-widest">Media Library</h3>
                <div className="mb-10 p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center relative bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                    <input type="file" accept="image/*" onChange={handleUploadMedia} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <div className="pointer-events-none flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-white/10 transition-all ${uploading ? 'animate-spin' : 'group-hover:scale-110'}`}>{uploading ? <Icons.Logout /> : <Icons.Upload />}</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{uploading ? 'Uploading...' : 'Click to Upload New Assets'}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                        {mediaFiles.map((file, idx) => (
                            <div key={idx} onClick={() => handleSelectMedia(file.url)} className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-yellow-500 cursor-pointer group relative transition-all">
                                <img src={file.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2" />
                                <div className="absolute inset-0 bg-yellow-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                    <span className="text-[10px] text-black font-black uppercase tracking-widest">Select</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* BULK IMPORT */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-12 relative">
                <button onClick={() => setShowBulkModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">Bulk Import</h3>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-10">Pemisah baris baru (\n) atau koma (,)</p>
                <form onSubmit={handleBulkImport} className="space-y-6">
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Duration (Days)</label><input type="number" value={bulkDuration} onChange={(e) => setBulkDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none" required /></div>
                    <textarea className="w-full h-56 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-xs font-mono outline-none focus:border-yellow-500" placeholder="user1@mail.com&#10;user2@mail.com" value={bulkText} onChange={(e) => setBulkText(e.target.value)} required />
                    <button type="submit" disabled={bulkLoading} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-yellow-500 transition-all uppercase text-xs tracking-widest disabled:opacity-50">{bulkLoading ? 'Processing...' : 'Start Injection'}</button>
                </form>
            </div>
        </div>
      )}

      {/* --- STYLE --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>
    </div>
  );
}