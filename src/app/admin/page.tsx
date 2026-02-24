'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config'; 

// --- DATA TYPES ---
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

type SpecialAccess = {
    id: string;
    token: string;
    label: string | null;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
};

// --- ICON COMPONENTS ---
const Icons = {
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Broadcast: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 5.1"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 5.1C23 8.8 23 15.2 19.1 19.1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
};

export default function AdminPage() {
  const { token, logout, isLoading, role } = useAuth();
  const router = useRouter();
  const backendUrl = getBackendUrl();
  
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<'users' | 'schedules' | 'offers' | 'links' | 'settings'>('users');
  
  // --- USERS DATA STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // --- GLOBAL DATA STATE ---
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [specialLinks, setSpecialLinks] = useState<SpecialAccess[]>([]);
  const [qrisUrl, setQrisUrl] = useState('');
  const [chatUrl, setChatUrl] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // --- MODALS STATE ---
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

  // --- EDITING OBJECTS ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // --- FORM INPUTS ---
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

  // [NEW FORM STATE]
  const [linkLabel, setLinkLabel] = useState('');
  const [linkDuration, setLinkDuration] = useState('1');

  // [HELPER PERMISSION]
  const checkPermission = (action: string) => {
    const restricted = ['offers', 'links', 'settings', 'manage_packages', 'manage_links', 'system_setup'];
    if (role !== 'SUPERADMIN' && restricted.includes(action)) {
      alert("⚠️ Izin Ditolak: Fitur ini hanya tersedia untuk Superadmin!");
      return false;
    }
    return true;
  };

  const handleTabChange = (tab: any) => {
    if (checkPermission(tab)) {
      setActiveTab(tab);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchTerm);
        setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
         const [resSched, resPkg, resLinks] = await Promise.all([
             fetch(`${backendUrl}/api/v1/admin/schedules`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${backendUrl}/api/v1/admin/packages`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${backendUrl}/api/v1/admin/access`, { headers: { 'Authorization': `Bearer ${token}` } })
         ]);
         if(resSched.ok) setSchedules(await resSched.json());
         if(resLinks.ok) setSpecialLinks(await resLinks.json());
         if(resPkg.ok) {
             const data = await resPkg.json();
             setPackages(data.packages);
             setQrisUrl(data.qrisUrl);
             setChatUrl(data.chatUrl || ''); 
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

  // --- ACTIONS: USER ---
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

  const handleSelectAll = () => {
      if (selectedUserIds.size === users.length) setSelectedUserIds(new Set());
      else setSelectedUserIds(new Set(users.map(u => u.id)));
  };

  const handleBulkDelete = async () => {
      if (!confirm(`Hapus ${selectedUserIds.size} user?`)) return;
      try {
          await fetch(`${backendUrl}/api/v1/admin/users/bulk`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: Array.from(selectedUserIds) })
          });
          showToast('Users deleted', 'success');
          fetchUsers();
      } catch (e) { showToast('Gagal hapus massal', 'error'); }
  };

  const handleApproveClick = (user: User) => {
      setEditingUser(user);
      setUserFormDuration(30); 
      setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
      if (!editingUser) return;
      try {
          await fetch(`${backendUrl}/api/v1/admin/users/${editingUser.id}/approve`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ durationDays: userFormDuration })
          });
          showToast('Approved!', 'success');
          setShowApproveModal(false);
          fetchUsers();
      } catch (e) { showToast('Gagal approve', 'error'); }
  };

  const handleResetDevice = async (id: string) => {
      if(!confirm('Reset kunci perangkat user?')) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/${id}/reset-device`, {
              method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { showToast('Device Reset!', 'success'); fetchUsers(); }
      } catch (e) { showToast('Gagal reset', 'error'); }
  };

  const handleEditUserClick = (user: User) => {
      setEditingUser(user);
      setUserFormEmail(user.email);
      setUserFormDuration(0);
      setShowEditUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
      if(!confirm('Hapus user selamanya?')) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/${id}`, {
              method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { showToast('Deleted!', 'success'); fetchUsers(); }
      } catch (e) { showToast('Gagal hapus', 'error'); }
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
      } catch (e) { showToast('Gagal buat user', 'error'); }
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
      } catch (e) { showToast('Gagal update', 'error'); }
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
      } catch (e) { showToast('Import gagal', 'error'); }
      finally { setBulkLoading(false); }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveChatUrl = async () => {
    if (!checkPermission('system_setup')) return;
    try {
        const res = await fetch(`${backendUrl}/api/v1/admin/settings/chat`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: chatUrl })
        });
        if (res.ok) showToast('Chat URL Updated!', 'success');
    } catch (err) { showToast('Gagal update chat', 'error'); }
  };

  // --- ACTIONS: MULTI-SERVER SOURCES ---
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

  // --- ACTIONS: SCHEDULE ---
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
    try {
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
        
        const res = await fetch(url, {
          method: editingSchedule ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Schedule Saved!', 'success');
          setShowScheduleModal(false);
          fetchGlobalData();
        }
    } catch (e) { showToast('Gagal simpan jadwal', 'error'); }
  };

  const handleDeleteSchedule = async (id: string) => {
      if(!confirm('Hapus jadwal ini?')) return;
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/schedules/${id}`, {
              method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) { showToast('Deleted!', 'success'); fetchGlobalData(); }
      } catch (e) { showToast('Gagal hapus', 'error'); }
  };

  const handleToggleSchedule = async (s: Schedule) => {
    try {
        const action = s.is_active ? 'stop' : 'activate';
        await fetch(`${backendUrl}/api/v1/admin/schedules/${s.id}/${action}`, {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchGlobalData();
    } catch (e) { showToast('Gagal update status', 'error'); }
  };

  // --- ACTIONS: PACKAGE ---
  const handleOpenPackageModal = (pkg?: Package) => {
      if (!checkPermission('manage_packages')) return;
      if (pkg) {
          setEditingPackage(pkg);
          setPkgTitle(pkg.title);
          setPkgPrice(pkg.price.toString());
          setPkgDuration(pkg.duration.toString());
          setPkgFeatures(pkg.description || '');
          setPkgTopic(pkg.topic || '');
          setPkgIsLimited(pkg.is_limited || false);
          setPkgStock(pkg.stock?.toString() || '');
          setPkgImage(pkg.image_url || '');
      } else {
          setEditingPackage(null);
          setPkgTitle(''); setPkgPrice(''); setPkgDuration(''); setPkgFeatures(''); setPkgTopic(''); setPkgIsLimited(false); setPkgStock(''); setPkgImage('');
      }
      setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    if(e) e.preventDefault();
    try {
        const payload = { title: pkgTitle, price: pkgPrice, duration: pkgDuration, description: pkgFeatures, topic: pkgTopic, is_limited: pkgIsLimited, stock: pkgStock, image_url: pkgImage };
        const url = editingPackage ? `${backendUrl}/api/v1/admin/packages/${editingPackage.id}` : `${backendUrl}/api/v1/admin/packages`;
        const res = await fetch(url, {
          method: editingPackage ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if(res.ok) { showToast('Package Saved!', 'success'); setShowPackageModal(false); fetchGlobalData(); }
    } catch (e) { showToast('Gagal simpan paket', 'error'); }
  };

  const handleTogglePackageStatus = async (pkg: Package) => {
    if (!checkPermission('manage_packages')) return;
    try {
        await fetch(`${backendUrl}/api/v1/admin/packages/${pkg.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !pkg.is_active })
        });
        fetchGlobalData();
    } catch (e) { showToast('Gagal update', 'error'); }
  };

  const handleDeletePackage = async (id: string) => {
    if (!checkPermission('manage_packages')) return;
    if(!confirm('Hapus paket?')) return;
    try {
        await fetch(`${backendUrl}/api/v1/admin/packages/${id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchGlobalData();
    } catch (e) { showToast('Gagal hapus', 'error'); }
  };

  // --- ACTIONS: MEDIA ---
  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append(mediaMode === 'qris' ? 'qrisFile' : 'file', e.target.files[0]);
    setUploading(true);
    try {
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
          showToast('Media Uploaded!', 'success');
        }
    } catch (e) { showToast('Gagal upload', 'error'); }
    finally { setUploading(false); }
  };

  const handleSelectMedia = (url: string) => {
    if (mediaMode === 'schedule') setNewScheduleThumbnail(url);
    else if (mediaMode === 'package') setPkgImage(url);
    else if (mediaMode === 'qris') {
        fetch(`${backendUrl}/api/v1/admin/settings/qris`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
        }).then(() => { setQrisUrl(url); showToast('QRIS Updated', 'success'); });
    }
    setShowMediaModal(false);
  };

  // [NEW ACTIONS: SPECIAL ACCESS LINKS]
  const handleGenerateLink = async () => {
    if (!checkPermission('manage_links')) return;
    try {
        const res = await fetch(`${backendUrl}/api/v1/admin/access/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                label: linkLabel, 
                durationDays: linkDuration === '0' ? null : Number(linkDuration) 
            })
        });
        if (res.ok) {
            showToast('Access Link Injected!', 'success');
            setLinkLabel('');
            fetchGlobalData();
        }
    } catch (e) { showToast('Gagal generate link', 'error'); }
  };

  const handleDeleteLink = async (id: string) => {
    if (!checkPermission('manage_links')) return;
    if(!confirm('Purge this access link?')) return;
    try {
        await fetch(`${backendUrl}/api/v1/admin/access/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchGlobalData();
    } catch (e) { showToast('Gagal hapus', 'error'); }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/watch/${token}`;
    navigator.clipboard.writeText(url);
    showToast('Link Copied to Matrix!', 'success');
  };

  if (isLoading || !token) return <div className="min-h-screen bg-black" />;

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-100 font-sans flex-col md:flex-row">
      
      {/* --- NAVBAR TOP --- */}
      <header className="h-16 px-4 md:px-8 flex justify-between items-center bg-black/60 backdrop-blur-xl border-b border-white/5 fixed top-0 left-0 right-0 z-[60]">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-tighter text-yellow-500 uppercase">
              Control<span className="text-white">Center</span>
            </h1>
            <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest text-gray-400">
              Role: <span className={role === 'SUPERADMIN' ? 'text-yellow-500' : 'text-blue-500'}>{role}</span>
            </span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="hidden md:block text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
              Back to View
            </button>
            <button onClick={logout} className="p-2.5 rounded-full bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 transition-all border border-white/5">
              <Icons.Logout />
            </button>
        </div>
      </header>

      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-black/50 backdrop-blur-xl fixed h-screen top-16 z-50">
        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => handleTabChange('users')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'}`}><Icons.Users /> <span>User Database</span></button>
          <button onClick={() => handleTabChange('schedules')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'schedules' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'}`}><Icons.Broadcast /> <span>Schedules</span></button>
          
          {/* Restricted Tabs */}
          <button onClick={() => handleTabChange('offers')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'offers' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Gift /> <span>Offer Settings</span></button>
          <button onClick={() => handleTabChange('links')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'links' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Link /> <span>Access Links</span></button>
          <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-yellow-500 text-black font-black' : 'text-gray-500 hover:bg-white/5'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Settings /> <span>System Setup</span></button>
        </nav>
      </aside>

      {/* --- BOTTOM NAVIGATION (MOBILE) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-[60] px-2">
        <button onClick={() => handleTabChange('users')} className={`flex flex-col items-center gap-1 ${activeTab === 'users' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Users /> <span className="text-[9px] font-bold uppercase">Users</span></button>
        <button onClick={() => handleTabChange('schedules')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedules' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Broadcast /> <span className="text-[9px] font-bold uppercase">Stream</span></button>
        <button onClick={() => handleTabChange('offers')} className={`flex flex-col items-center gap-1 ${activeTab === 'offers' ? 'text-yellow-500' : 'text-gray-500'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Gift /> <span className="text-[9px] font-bold uppercase">Offers</span></button>
        <button onClick={() => handleTabChange('links')} className={`flex flex-col items-center gap-1 ${activeTab === 'links' ? 'text-yellow-500' : 'text-gray-500'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Link /> <span className="text-[9px] font-bold uppercase">Links</span></button>
        <button onClick={() => handleTabChange('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-yellow-500' : 'text-gray-500'} ${role !== 'SUPERADMIN' ? 'opacity-30 cursor-not-allowed' : ''}`}><Icons.Settings /> <span className="text-[9px] font-bold uppercase">Setup</span></button>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-12 mt-20 mb-20 md:mb-0">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 md:mb-12 gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight uppercase">
                {activeTab === 'users' ? 'Database Access' : activeTab === 'schedules' ? 'Broadcast Nodes' : activeTab === 'offers' ? 'Revenue Config' : activeTab === 'links' ? 'VIP Access Nodes' : 'Master Setup'}
              </h2>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em]">
                {role === 'SUPERADMIN' ? 'Superuser Master Privilege Active' : 'Restricted Admin Operator Privilege Active'}
              </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
             {activeTab === 'users' && (
                <div className="relative flex-1 lg:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600"><Icons.Users /></div>
                    <input type="text" placeholder="Search Identity..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 text-white text-sm rounded-2xl block pl-12 p-3.5 w-full lg:w-72 outline-none focus:border-yellow-500 transition-all" />
                </div>
             )}
             {activeTab === 'users' && (
                <button onClick={() => setShowBulkModal(true)} className="flex-1 lg:flex-none bg-white/5 hover:bg-white/10 text-white px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all">
                    <Icons.Upload /> <span className="uppercase text-[10px] tracking-widest hidden sm:inline">Bulk Injection</span>
                </button>
             )}
             {activeTab === 'users' && (
             <button onClick={() => setShowUserModal(true)} className="flex-1 lg:flex-none bg-yellow-500 text-black px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
                <Icons.Plus /> <span className="uppercase text-[10px] tracking-widest">New Node</span>
            </button>
             )}
             {activeTab === 'schedules' && (
             <button onClick={() => handleOpenScheduleModal()} className="flex-1 lg:flex-none bg-yellow-500 text-black px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
                <Icons.Plus /> <span className="uppercase text-[10px] tracking-widest">New Node</span>
            </button>
             )}
          </div>
        </header>

        {toast && <div className={`fixed top-20 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-6 font-black text-[10px] uppercase tracking-widest ${toast.type === 'success' ? 'bg-green-500 text-black border-green-400' : 'bg-red-500 text-white border-red-400'}`}>{toast.msg}</div>}

        {/* --- USERS VIEW --- */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-wrap justify-between items-center gap-4">
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                     {(['ALL', 'ACTIVE', 'PENDING', 'EXPIRED'] as const).map(f => (
                         <button key={f} onClick={() => { setUserFilter(f); setPage(1); }} className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest transition-all border uppercase whitespace-nowrap ${userFilter === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}>{f}</button>
                     ))}
                 </div>
                 {selectedUserIds.size > 0 && (
                     <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"><Icons.Trash /> Purge ({selectedUserIds.size})</button>
                 )}
             </div>

             <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#0a0a0a] shadow-2xl relative min-h-[400px]">
                {isLoadingUsers && <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-md flex items-center justify-center font-black text-yellow-500 animate-pulse uppercase tracking-[0.5em]">Syncing Nodes...</div>}
                <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-gray-500 uppercase tracking-[0.2em] text-[9px] font-black">
                    <tr>
                        <th className="p-6 w-4"><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedUserIds.size === users.length} className="accent-yellow-500" /></th>
                        <th className="p-6">User Node</th>
                        <th className="p-6">Access State</th>
                        <th className="p-6 text-center">Security</th>
                        <th className="p-6 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.length > 0 ? users.map((u) => (
                        <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors ${selectedUserIds.has(u.id) ? 'bg-yellow-500/5' : ''}`}>
                            <td className="p-6"><input type="checkbox" checked={selectedUserIds.has(u.id)} onChange={() => handleSelectUser(u.id)} className="accent-yellow-500" /></td>
                            <td className="p-6"><div className="font-bold text-white mb-0.5">{u.email}</div><div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{u.status}</div></td>
                            <td className="p-6">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${u.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse' : isUserExpired(u) ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                    {u.status === 'PENDING' ? 'Verification' : isUserExpired(u) ? 'Expired' : u.Subscription?.plan_type || 'Authorized'}
                                </span>
                            </td>
                            <td className="p-6 text-center">{u.registered_device_id ? <button onClick={() => handleResetDevice(u.id)} className="text-[9px] font-black text-yellow-600 bg-yellow-500/5 px-3 py-1.5 rounded-full border border-yellow-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all uppercase tracking-widest"><Icons.Lock /> Key Locked</button> : <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">No Lock</span>}</td>
                            <td className="p-6 text-right">
                                <div className="flex justify-end gap-3">
                                    {u.status === 'PENDING' ? (
                                        <button onClick={() => handleApproveClick(u)} className="bg-green-500 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Authorize</button>
                                    ) : (
                                        <div className="flex gap-2.5 text-gray-600">
                                            <button onClick={() => handleEditUserClick(u)} className="hover:text-yellow-500 transition-colors"><Icons.Edit /></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="hover:text-red-500 transition-colors"><Icons.Trash /></button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={5} className="p-20 text-center text-gray-700 font-black uppercase tracking-widest text-xs">Zero nodes detected</td></tr>}
                </tbody>
                </table>
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-white/5 gap-4">
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Matrix: {totalUsers} Entities</div>
                    <div className="flex items-center gap-4">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white disabled:opacity-20 transition-all"><Icons.ChevronLeft /></button>
                        <span className="text-[10px] font-black text-yellow-500 tracking-widest uppercase">Page {page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white disabled:opacity-20 transition-all"><Icons.ChevronRight /></button>
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* --- SCHEDULES VIEW --- */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 animate-in fade-in duration-500">
            {schedules.map((s) => (
              <div key={s.id} className={`rounded-[2rem] border p-5 md:p-6 flex flex-col md:flex-row gap-6 transition-all ${s.is_active ? 'border-green-500/30 bg-green-500/5 shadow-[0_0_50px_rgba(34,197,94,0.05)]' : 'border-white/5 bg-[#0a0a0a]'}`}>
                <div className="w-full md:w-52 h-44 md:h-auto rounded-3xl overflow-hidden shrink-0 border border-white/5 relative bg-black/40">
                   {s.thumbnail ? <img src={s.thumbnail} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center text-gray-800"><Icons.Broadcast /></div>}
                   {s.is_active && <div className="absolute top-4 left-4 bg-red-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-lg">TRANSMITTING</div>}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4 gap-2">
                      <h3 className="text-lg md:text-xl font-black text-white leading-tight uppercase tracking-tight line-clamp-2">{s.title}</h3>
                      <div className="flex gap-2.5 shrink-0 pt-1">
                        <button onClick={() => handleOpenScheduleModal(s)} className="text-gray-600 hover:text-yellow-500 transition-colors"><Icons.Edit /></button>
                        <button onClick={() => handleDeleteSchedule(s.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Icons.Trash /></button>
                      </div>
                   </div>
                   <div className="space-y-2 mb-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <p className="flex items-center gap-2">📅 {new Date(s.start_time).toLocaleString()}</p>
                      <p className="flex items-center gap-2">🔗 {s.sources?.length || 0} Parallel Servers</p>
                      <p className="text-yellow-600/80">💰 Rp {s.price.toLocaleString()}</p>
                   </div>
                   <button onClick={() => handleToggleSchedule(s)} className={`w-full py-4 rounded-2xl text-[9px] font-black tracking-[0.3em] uppercase transition-all ${s.is_active ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:bg-yellow-500 shadow-xl shadow-white/5'}`}>{s.is_active ? 'Stop Link' : 'Initialize link'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- OFFERS VIEW --- */}
        {activeTab === 'offers' && (
          <div className="space-y-10 md:space-y-12 animate-in fade-in duration-500">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
               <div className="w-32 md:w-40 h-32 md:h-40 bg-white rounded-3xl overflow-hidden relative group shrink-0 border border-white/10 shadow-2xl">
                  {qrisUrl ? <img src={qrisUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black font-black text-[10px]">NO ASSET</div>}
                  <div onClick={() => {setMediaMode('qris'); setShowMediaModal(true); fetchMedia();}} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all uppercase text-[9px] font-black text-white">Overwrite</div>
               </div>
               <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Gateway Config</h3>
                  <p className="text-gray-600 text-[11px] font-medium leading-relaxed max-w-md mb-6 uppercase tracking-wider">Primary QRIS asset for manual verification system.</p>
                  <button onClick={() => {setMediaMode('qris'); setShowMediaModal(true); fetchMedia();}} className="text-[10px] font-black uppercase tracking-widest text-yellow-500 border-b-2 border-yellow-500/20 pb-1.5 hover:border-yellow-500 transition-all">Synchronize Gateway Asset</button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
               {packages.map(p => (
                 <div key={p.id} className={`bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col group transition-all hover:border-white/10 ${!p.is_active && 'opacity-30 grayscale'}`}>
                    <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => handleOpenPackageModal(p)} className="text-gray-500 hover:text-white"><Icons.Edit /></button>
                       <button onClick={() => handleDeletePackage(p.id)} className="text-gray-500 hover:text-red-500"><Icons.Trash /></button>
                    </div>
                    {p.image_url ? (
                        <img src={p.image_url} className="h-14 w-14 rounded-2xl object-cover mb-8 shadow-2xl border border-white/5" />
                    ) : (
                        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8"><Icons.Gift /></div>
                    )}
                    {p.topic && <span className="text-[9px] font-black text-yellow-600/80 uppercase tracking-[0.2em] mb-2">{p.topic}</span>}
                    <h3 className="text-xl font-black text-white mb-2 leading-tight uppercase tracking-tight">{p.title}</h3>
                    <div className="text-2xl font-black text-yellow-500 mb-8 font-mono tracking-tighter">Rp {p.price.toLocaleString()}</div>
                    <button onClick={() => handleTogglePackageStatus(p)} className={`mt-auto w-full py-4 rounded-2xl border font-black text-[9px] uppercase tracking-[0.2em] transition-all ${p.is_active ? 'border-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-500' : 'border-green-500/20 text-green-500 hover:bg-green-500/10'}`}>{p.is_active ? 'Offline Plan' : 'Go Online'}</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* --- ACCESS LINKS VIEW --- */}
        {activeTab === 'links' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase tracking-[0.1em]">Access Node Injection</h3>
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-10">Generate unique bypass tokens for VIP nodes.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Node Designation</label>
                      <input type="text" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Node Name (e.g. VIP-GUEST)" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-yellow-500 text-xs" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Transmission Life</label>
                      <select value={linkDuration} onChange={e => setLinkDuration(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-yellow-500 text-xs appearance-none">
                         <option value="1">24 HOURS LIFE</option>
                         <option value="7">1 WEEK LIFE</option>
                         <option value="30">1 MONTH LIFE</option>
                         <option value="0">PERMANENT NODE</option>
                      </select>
                   </div>
                   <div className="flex items-end">
                      <button onClick={handleGenerateLink} className="w-full bg-yellow-500 text-black px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 transition-all">Inject New Node</button>
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] shadow-2xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-gray-500 uppercase tracking-[0.2em] text-[9px] font-black">
                    <tr>
                        <th className="p-8">Designation</th>
                        <th className="p-8">Node Life</th>
                        <th className="p-8 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {specialLinks.map((link) => (
                        <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-8">
                                <div className="font-bold text-white mb-1 uppercase tracking-tight">{link.label || 'UNKNOWN NODE'}</div>
                                <div className="text-[9px] text-gray-600 font-mono">{link.token}</div>
                            </td>
                            <td className="p-8">
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${!link.expires_at ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                    {link.expires_at ? `Expires: ${new Date(link.expires_at).toLocaleDateString()}` : 'Permanent Access'}
                                </span>
                            </td>
                            <td className="p-8 text-right">
                                <div className="flex justify-end gap-4">
                                    <button onClick={() => copyToClipboard(link.token)} className="p-3 bg-white/5 text-gray-400 hover:text-yellow-500 rounded-2xl border border-white/5 transition-all"><Icons.Copy /></button>
                                    <button onClick={() => handleDeleteLink(link.id)} className="p-3 bg-white/5 text-gray-400 hover:text-red-500 rounded-2xl border border-white/5 transition-all"><Icons.Trash /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {specialLinks.length === 0 && (
                        <tr><td colSpan={3} className="p-20 text-center text-gray-700 font-black uppercase tracking-widest text-[10px]">No active VIP access nodes</td></tr>
                    )}
                </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- SYSTEM SETTINGS VIEW --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 md:p-12 space-y-12">
                <div>
                   <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase tracking-[0.1em]">Interaction Node Setup</h3>
                   <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-8">Override the live chat URL globally across all active broadcast nodes.</p>
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Live Chat Embed Source</label>
                         <input 
                            type="text" 
                            value={chatUrl} 
                            onChange={(e) => setChatUrl(e.target.value)} 
                            placeholder="https://chat.restream.io/embed?token=..." 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-yellow-500 transition-all text-xs"
                         />
                      </div>
                      <button 
                        onClick={handleSaveChatUrl}
                        className="bg-yellow-500 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         Sync System Link
                      </button>
                   </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                   <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase tracking-[0.1em]">Static Matrix Config</h3>
                   <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-4">Manual QRIS sync is currently pointing to:</p>
                   <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <code className="text-[9px] text-gray-400 truncate max-w-[70%]">{qrisUrl || 'Unassigned'}</code>
                      <button onClick={() => { if(checkPermission('manage_packages')) setActiveTab('offers'); }} className="text-[9px] font-black text-yellow-500 uppercase hover:underline">Change Asset</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* MODAL USER */}
      {(showUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl">
                <button onClick={() => {setShowUserModal(false); setShowEditUserModal(false);}} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all hover:rotate-90"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">{showEditUserModal ? 'Modify Node' : 'Register Entity'}</h3>
                <form onSubmit={showEditUserModal ? handleUpdateUser : handleCreateUser} className="space-y-8">
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Entity Email</label><input type="email" value={userFormEmail} onChange={e => setUserFormEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 transition-all" required /></div>
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Access Life (Days)</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 transition-all" required /></div>
                    <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-yellow-500 transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl">Execute Transaction</button>
                </form>
            </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 md:p-12 relative shadow-2xl">
                <button onClick={() => setShowApproveModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all hover:rotate-90"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Authorize node</h3>
                <p className="text-[10px] text-gray-600 mb-8 font-mono tracking-tighter">{editingUser.email}</p>
                {editingUser.last_order_info && (
                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-6 rounded-3xl mb-8 text-[11px] text-yellow-200/60 leading-relaxed italic border-dashed uppercase tracking-tight">
                        <strong>Node Metadata:</strong><br/>{editingUser.last_order_info}
                    </div>
                )}
                <div className="space-y-8">
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Authorize Life Duration</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-green-500 transition-all" /></div>
                    <button onClick={handleConfirmApprove} className="w-full bg-green-500 text-black font-black py-5 rounded-2xl hover:scale-105 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-green-500/20">Verify & Authorize</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL SCHEDULE */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in duration-300">
                <button onClick={() => setShowScheduleModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all"><Icons.X /></button>
                <h3 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase">Node Configuration</h3>
                <form onSubmit={handleSaveSchedule} className="space-y-10">
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Broadcast Title</label><input type="text" value={newScheduleTitle} onChange={e => setNewScheduleTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-yellow-500" required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Transmission Time</label><input type="datetime-local" value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required /></div>
                        <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Acess Price (Matrix)</label><input type="number" value={newSchedulePrice} onChange={e => setNewSchedulePrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" /></div>
                    </div>
                    
                    <div className="space-y-6 pt-10 border-t border-white/5">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Multi-Parallel Management</label><button type="button" onClick={addSourceField} className="bg-white/5 text-white text-[9px] font-black px-5 py-2.5 rounded-full border border-white/10 uppercase hover:bg-white/10 transition-all">+ Inject Server</button></div>
                        <div className="space-y-4">
                          {streamSources.map((src, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row gap-6 relative group transition-all hover:bg-white/[0.04]">
                               <div className="flex-1 space-y-4">
                                  <input placeholder="Server Designation" value={src.name} onChange={e => updateSourceField(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-[11px] font-black py-2 outline-none text-white focus:border-yellow-500" />
                                  <input placeholder="Matrix URL" value={src.url} onChange={e => updateSourceField(idx, 'url', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-[9px] py-2 outline-none text-gray-500 focus:border-yellow-500" required />
                               </div>
                               {streamSources.length > 1 && <button type="button" onClick={() => removeSourceField(idx)} className="text-red-500/30 hover:text-red-500 transition-all self-end md:self-center p-2"><Icons.Trash /></button>}
                            </div>
                          ))}
                        </div>
                    </div>
                    
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Thumbnail Metadata</label><div className="flex gap-4"><input type="text" value={newScheduleThumbnail} onChange={e => setNewScheduleThumbnail(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-xs outline-none" /><button type="button" onClick={() => {setMediaMode('schedule'); setShowMediaModal(true); fetchMedia();}} className="bg-white/5 text-white px-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"><Icons.Image /></button></div></div>
                    
                    <button type="submit" className="w-full bg-yellow-500 text-black font-black py-6 rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-yellow-500/20 hover:scale-[1.02] transition-all">Synchronize Nodes</button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL PACKAGE */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[3rem] p-10 md:p-12 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in duration-300">
                <button onClick={() => setShowPackageModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-all"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-10 tracking-tighter uppercase">{editingPackage ? 'Reconfig Plan' : 'Initialize Plan'}</h3>
                <form onSubmit={handleSavePackage} className="space-y-8">
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Offer Identity</label><input type="text" value={pkgTitle} onChange={e => setPkgTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Node Price</label><input type="number" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required /></div>
                        <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Life Days</label><input type="number" value={pkgDuration} onChange={e => setPkgDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required /></div>
                    </div>
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Icon Source</label><div className="flex gap-4"><input type="text" value={pkgImage} onChange={e => setPkgImage(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[10px] outline-none" /><button type="button" onClick={() => {setMediaMode('package'); setShowMediaModal(true); fetchMedia();}} className="bg-white/5 text-white px-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"><Icons.Image /></button></div></div>
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Capabilities Metadata</label><textarea value={pkgFeatures} onChange={e => setPkgFeatures(e.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[10px] outline-none" /></div>
                    <button type="submit" className="w-full bg-white text-black font-black py-6 rounded-3xl uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-yellow-500 transition-all">Execute Plan Finalization</button>
                </form>
            </div>
        </div>
      )}

      {/* MEDIA LIBRARY MODAL */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-5xl rounded-[3rem] p-8 md:p-12 relative h-[85vh] flex flex-col shadow-2xl">
                <button onClick={() => setShowMediaModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-10 tracking-tighter uppercase tracking-[0.3em]">Asset Library</h3>
                <div className="mb-10 md:mb-12 p-10 md:p-16 border-2 border-dashed border-white/5 rounded-[3rem] text-center relative bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                    <input type="file" accept="image/*" onChange={handleUploadMedia} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <div className="pointer-events-none flex flex-col items-center">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 border border-white/10 bg-black transition-all ${uploading ? 'animate-spin border-yellow-500' : 'group-hover:border-yellow-500/50'}`}>
                            {uploading ? <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div> : <Icons.Upload />}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 group-hover:text-yellow-500 transition-colors">{uploading ? 'Transferring assets...' : 'Upload New Asset'}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-8">
                        {mediaFiles.map((file, idx) => (
                            <div key={idx} onClick={() => handleSelectMedia(file.url)} className="aspect-square bg-white/[0.02] rounded-3xl overflow-hidden border border-white/5 hover:border-yellow-500/50 cursor-pointer group relative transition-all shadow-lg">
                                <img src={file.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-yellow-500/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                    <span className="text-[9px] text-black font-black uppercase tracking-widest">Inject</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* BULK MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-lg rounded-[3rem] p-10 md:p-12 relative shadow-2xl animate-in zoom-in duration-300">
                <button onClick={() => setShowBulkModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Mass Injection</h3>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-10">Matrix delimiters: \n or comma (,)</p>
                <form onSubmit={handleBulkImport} className="space-y-8">
                    <div><label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Duration Offset</label><input type="number" value={bulkDuration} onChange={(e) => setBulkDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-yellow-500" required /></div>
                    <textarea className="w-full h-64 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-white text-[11px] font-mono outline-none focus:border-yellow-500 transition-all custom-scrollbar" placeholder="email@node.com, email2@node.com" value={bulkText} onChange={(e) => setBulkText(e.target.value)} required />
                    <button type="submit" disabled={bulkLoading} className="w-full bg-white text-black font-black py-6 rounded-3xl hover:bg-yellow-500 transition-all uppercase text-[10px] tracking-[0.3em] disabled:opacity-30 shadow-xl">{bulkLoading ? 'Processing...' : 'Execute Injection'}</button>
                </form>
            </div>
        </div>
      )}

      {/* --- STYLES --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.5; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}