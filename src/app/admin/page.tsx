'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config'; 

// --- TIPE DATA ---
type Subscription = { id: string; plan_type: string; start_time: string; end_time: string; };
type User = { id: string; email: string; role: string; registered_device_id: string | null; Subscription: Subscription | null; };
type Quality = { label: string; url: string }; 
type Schedule = { 
    id: string; 
    title: string; 
    stream_source: 'internal' | 'external' | 'youtube'; 
    stream_key: string | null; 
    custom_url: string | null; 
    qualities?: Quality[]; 
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
    image_url?: string; // NEW field
};

// --- ICONS ---
const Icons = {
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Broadcast: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 5.1"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 5.1C23 8.8 23 15.2 19.1 19.1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
  Youtube: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
};

export default function AdminPage() {
  const { token, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'users' | 'schedules' | 'offers'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [qrisUrl, setQrisUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & UI
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [mediaMode, setMediaMode] = useState<'schedule' | 'qris' | 'package'>('schedule');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  // Forms User
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormDuration, setUserFormDuration] = useState(30);

  // Form Bulk
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Forms Schedule
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleThumbnail, setNewScheduleThumbnail] = useState('');
  const [newSchedulePrice, setNewSchedulePrice] = useState('');
  const [streamSource, setStreamSource] = useState<'internal' | 'external' | 'youtube'>('internal');
  const [newScheduleUrl, setNewScheduleUrl] = useState(''); 
  
  // Multi Quality State
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [tempLabel, setTempLabel] = useState('');
  const [tempUrl, setTempUrl] = useState('');

  // OFFER FORMS
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDuration, setPkgDuration] = useState('');
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgTopic, setPkgTopic] = useState('');
  const [pkgIsLimited, setPkgIsLimited] = useState(false);
  const [pkgStock, setPkgStock] = useState('');
  const [pkgImage, setPkgImage] = useState(''); // NEW STATE
  
  const backendUrl = getBackendUrl();

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAllData = async () => {
     if (!token) return;
     try {
         const resUsers = await fetch(`${backendUrl}/api/v1/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
         if(resUsers.ok) setUsers(await resUsers.json());
         
         const resSched = await fetch(`${backendUrl}/api/v1/admin/schedules`, { headers: { 'Authorization': `Bearer ${token}` } });
         if(resSched.ok) setSchedules(await resSched.json());

         const resPkg = await fetch(`${backendUrl}/api/v1/admin/packages`, { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    if (mediaMode === 'qris') formData.append('qrisFile', e.target.files[0]);
    else formData.append('file', e.target.files[0]);
    
    setUploading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/admin/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      if (!res.ok) throw new Error('Gagal upload');
      
      if (mediaMode === 'qris') {
          const data = await res.json();
          await fetch(`${backendUrl}/api/v1/admin/settings/qris`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: data.url })
          });
          setQrisUrl(data.url);
          showToast('QRIS Updated!', 'success');
          setShowMediaModal(false);
      } else {
          showToast('Upload sukses!', 'success');
          fetchMedia();
      }
    } catch (err: any) { showToast(err.message, 'error'); } 
    finally { setUploading(false); }
  };

  const handleSelectMedia = async (url: string) => {
    if (mediaMode === 'schedule') {
        setNewScheduleThumbnail(url);
        setShowMediaModal(false);
    } else if (mediaMode === 'package') {
        setPkgImage(url); // Set Image untuk Paket
        setShowMediaModal(false);
    } else if (mediaMode === 'qris') {
        try {
            await fetch(`${backendUrl}/api/v1/admin/settings/qris`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ url })
            });
            setQrisUrl(url);
            showToast('QRIS Updated!', 'success');
            setShowMediaModal(false);
        } catch(e) {
            showToast('Failed to update QRIS', 'error');
        }
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => { e.preventDefault(); try { await fetch(`${backendUrl}/api/v1/admin/users`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userFormEmail, durationDays: Number(userFormDuration) }) }); showToast('User dibuat!', 'success'); setUserFormEmail(''); setShowUserModal(false); fetchAllData(); } catch(e:any){ showToast(e.message,'error');} };
  
  const handleBulkImport = async (e: React.FormEvent) => {
      e.preventDefault();
      setBulkLoading(true);
      try {
          const res = await fetch(`${backendUrl}/api/v1/admin/users/bulk`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ rawText: bulkText })
          });
          const data = await res.json();
          showToast(data.message, 'success');
          setBulkText('');
          setShowBulkModal(false);
          fetchAllData();
      } catch (e) {
          showToast('Import gagal', 'error');
      } finally {
          setBulkLoading(false);
      }
  };

  const handleEditUserClick = (user: User) => { setEditingUser(user); setUserFormEmail(user.email); setUserFormDuration(0); setShowEditUserModal(true); };
  
  const handleUpdateUser = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if(!editingUser) return; 
      await fetch(`${backendUrl}/api/v1/admin/users/${editingUser.id}`, { 
          method: 'PUT', 
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ email: userFormEmail, durationDays: Number(userFormDuration) || undefined }) 
      }); 
      showToast('Updated / Reactivated!', 'success'); 
      setShowEditUserModal(false); 
      fetchAllData(); 
  };

  const handleDeleteUser = async (id: string) => { if(!confirm('Del?')) return; await fetch(`${backendUrl}/api/v1/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); fetchAllData(); };
  const handleResetDevice = async (id: string) => { if(!confirm('Reset?')) return; await fetch(`${backendUrl}/api/v1/admin/users/${id}/reset-device`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); fetchAllData(); };
  
  const addQuality = () => {
      if(tempLabel && tempUrl) {
          setQualities([...qualities, { label: tempLabel, url: tempUrl }]);
          setTempLabel(''); setTempUrl('');
      }
  };
  const removeQuality = (idx: number) => {
      setQualities(qualities.filter((_, i) => i !== idx));
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${backendUrl}/api/v1/admin/schedules`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            title: newScheduleTitle, 
            start_time: new Date(newScheduleTime).toISOString(), 
            thumbnail: newScheduleThumbnail, 
            price: Number(newSchedulePrice), 
            stream_source: streamSource, 
            stream_key: streamSource === 'internal' ? 'DISABLED' : undefined, 
            custom_url: (streamSource === 'external' || streamSource === 'youtube') ? newScheduleUrl : undefined,
            qualities: streamSource === 'external' ? qualities : [] 
        }) 
    }); 
    showToast('Created!', 'success'); 
    setShowScheduleModal(false); 
    setQualities([]); 
    fetchAllData(); 
  };
  
  const handleActivateSchedule = async (schedule: Schedule) => { const action = schedule.is_active ? 'stop' : 'activate'; await fetch(`${backendUrl}/api/v1/admin/schedules/${schedule.id}/${action}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); fetchAllData(); };
  const handleDeleteSchedule = async (id: string) => { if(!confirm('Del?')) return; await fetch(`${backendUrl}/api/v1/admin/schedules/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); fetchAllData(); };

  const handleOpenPackageModal = (pkg?: Package) => {
      if (pkg) {
          setEditingPackage(pkg);
          setPkgTitle(pkg.title);
          setPkgPrice(pkg.price.toString());
          setPkgDuration(pkg.duration.toString());
          setPkgFeatures(pkg.description || '');
          setPkgTopic(pkg.topic || '');
          setPkgIsLimited(pkg.is_limited || false);
          setPkgStock(pkg.stock?.toString() || '');
          setPkgImage(pkg.image_url || ''); // Set image for edit
      } else {
          setEditingPackage(null);
          setPkgTitle(''); setPkgPrice(''); setPkgDuration(''); 
          setPkgFeatures(''); setPkgTopic(''); setPkgIsLimited(false); setPkgStock('');
          setPkgImage(''); // Clear image for create
      }
      setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      try { 
          const payload = { 
              title: pkgTitle, price: pkgPrice, duration: pkgDuration, description: pkgFeatures, 
              topic: pkgTopic, is_limited: pkgIsLimited, stock: pkgStock,
              image_url: pkgImage // Save Image
          };

          if (editingPackage) {
              await fetch(`${backendUrl}/api/v1/admin/packages/${editingPackage.id}`, { 
                  method: 'PUT', 
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                  body: JSON.stringify(payload) 
              }); 
              showToast('Package Updated', 'success');
          } else {
              await fetch(`${backendUrl}/api/v1/admin/packages`, { 
                  method: 'POST', 
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                  body: JSON.stringify(payload) 
              }); 
              showToast('Package Created', 'success'); 
          }
          
          setShowPackageModal(false); 
          fetchAllData(); 
      } catch(e) { showToast('Error saving package', 'error'); } 
  };

  const handleTogglePackageStatus = async (pkg: Package) => {
      try {
          await fetch(`${backendUrl}/api/v1/admin/packages/${pkg.id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_active: !pkg.is_active }) 
          });
          showToast(pkg.is_active ? 'Package Disabled' : 'Package Activated', 'success');
          fetchAllData();
      } catch(e) { showToast('Error update status', 'error'); }
  };

  const handleDeletePackage = async (id: string) => { if(!confirm('Delete package?')) return; await fetch(`${backendUrl}/api/v1/admin/packages/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); fetchAllData(); };

  useEffect(() => {
    if (!isLoading && token) { fetchAllData(); }
    if (!isLoading && !token) router.push('/login');
  }, [isLoading, token]);

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const getUserStatus = (user: User) => {
      if (!user.Subscription) return { label: 'NO PLAN', color: 'bg-gray-800 text-gray-400 border-gray-700', timeLeft: '' };
      
      const now = new Date().getTime();
      const end = new Date(user.Subscription.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
          return { label: 'EXPIRED', color: 'bg-red-900/30 text-red-500 border-red-900 font-bold animate-pulse', timeLeft: '0 Days' };
      }
      
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { 
          label: user.Subscription.plan_type, 
          color: 'bg-green-900/30 text-green-400 border-green-800',
          timeLeft: `${daysLeft} Days Left`
      };
  };

  if (isLoading || !token) return <div className="min-h-screen bg-black" />;

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-100 font-sans">
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-800 bg-black/50 backdrop-blur-xl fixed h-full z-20">
        <div className="p-6 border-b border-gray-800"><h1 className="text-xl font-bold tracking-widest text-yellow-500">COMMAND<br/>CENTER</h1></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'users' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}><Icons.Users /> <span>Users</span></button>
          <button onClick={() => setActiveTab('schedules')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'schedules' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}><Icons.Broadcast /> <span>Broadcast</span></button>
          <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'offers' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}><Icons.Gift /> <span>Settings & Offers</span></button>
        </nav>
        <div className="p-4 border-t border-gray-800"><button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-900/20"><Icons.Logout /> <span>Logout</span></button></div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t border-gray-800 z-50 flex justify-around p-3 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
         <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center gap-1 ${activeTab === 'users' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Users /> <span className="text-[9px] uppercase font-bold">Users</span></button>
         <button onClick={() => setActiveTab('schedules')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedules' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Broadcast /> <span className="text-[9px] uppercase font-bold">Stream</span></button>
         <button onClick={() => setActiveTab('offers')} className={`flex flex-col items-center gap-1 ${activeTab === 'offers' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Gift /> <span className="text-[9px] uppercase font-bold">Offers</span></button>
         <button onClick={logout} className="flex flex-col items-center gap-1 text-red-500"><Icons.Logout /> <span className="text-[9px] uppercase font-bold">Exit</span></button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-12 pb-24 max-w-full overflow-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{activeTab === 'users' ? 'User Database' : activeTab === 'schedules' ? 'Production Schedule' : 'Settings & Offers'}</h2>
              <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wider">Realtime48 Admin</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
             {activeTab === 'users' && (
                 <>
                    <div className="relative group flex-1 sm:flex-none min-w-[150px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Icons.Search /></div>
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#111] border border-gray-700 text-white text-sm rounded-lg block pl-10 p-2.5 w-full sm:w-64 outline-none focus:border-yellow-500 transition-colors" />
                    </div>
                    <button onClick={() => setShowBulkModal(true)} className="bg-gray-800 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shrink-0 border border-gray-700">
                        <Icons.Upload /> <span className="hidden sm:inline">Bulk Import</span>
                    </button>
                 </>
             )}
             <button onClick={() => {
                 if (activeTab === 'users') setShowUserModal(true);
                 else if (activeTab === 'schedules') setShowScheduleModal(true);
                 else handleOpenPackageModal(); 
             }} className="bg-white text-black hover:bg-yellow-500 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shrink-0">
                <Icons.Plus /> <span className="hidden sm:inline">{activeTab === 'users' ? 'Add User' : activeTab === 'schedules' ? 'New Stream' : 'Add Package'}</span>
            </button>
          </div>
        </header>

        {toast && <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl border animate-in slide-in-from-top-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-100' : 'bg-red-900/90 border-red-700 text-red-100'}`}>{toast.msg}</div>}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a] shadow-2xl pb-2">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] md:text-xs">
                  <tr><th className="p-3 md:p-4">Identity</th><th className="p-3 md:p-4">Plan & Time</th><th className="p-3 md:p-4 text-center">Device Status</th><th className="p-3 md:p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((u) => {
                    const status = getUserStatus(u);
                    return (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 md:p-4 font-medium text-white max-w-[120px] md:max-w-none truncate" title={u.email}>{u.email}</td>
                            <td className="p-3 md:p-4">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs border font-bold ${status.color}`}>
                                        {status.label}
                                    </span>
                                    {status.timeLeft && <span className="text-[10px] text-gray-400 font-mono pl-1">{status.timeLeft}</span>}
                                </div>
                            </td>
                            <td className="p-3 md:p-4 text-center">
                                {u.registered_device_id ? (
                                    <button onClick={() => handleResetDevice(u.id)} className="inline-flex items-center justify-center gap-1.5 text-green-500 bg-green-900/20 px-3 py-1.5 rounded border border-green-900/50 text-[10px] md:text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors">
                                        <Icons.Lock /> <span>Locked</span>
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 text-[10px] md:text-xs opacity-50">
                                        <Icons.Unlock /> <span>Free</span>
                                    </span>
                                )}
                            </td>
                            <td className="p-3 md:p-4 text-right">
                                <div className="flex justify-end gap-1 md:gap-2">
                                    <button onClick={() => handleEditUserClick(u)} className="text-gray-500 hover:text-yellow-500 p-1.5 md:p-2 hover:bg-yellow-500/10 rounded transition-colors"><Icons.Edit /></button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-gray-500 hover:text-red-500 p-1.5 md:p-2 hover:bg-red-500/10 rounded transition-colors"><Icons.Trash /></button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-600 text-sm">No users found.</div>}
          </div>
        )}

        {/* --- SCHEDULES TAB --- */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {schedules.map((s) => (
              <div key={s.id} className={`relative group rounded-xl border overflow-hidden transition-all ${s.is_active ? 'border-green-500/50 bg-green-950/10' : 'border-gray-800 bg-[#0a0a0a]'}`}>
                <div className="flex flex-col sm:flex-row h-full">
                  <div className="w-full sm:w-48 h-40 sm:h-auto bg-gray-900 relative overflow-hidden shrink-0">
                    {s.thumbnail ? <img src={s.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><Icons.Broadcast /></div>}
                    <div className="absolute top-2 left-2 flex gap-1">
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.is_active ? 'bg-red-600 text-white animate-pulse' : 'bg-black/80 text-gray-400'}`}>{s.is_active ? 'ON AIR' : 'OFFLINE'}</div>
                        {s.stream_source === 'youtube' && <div className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-700 text-white flex items-center gap-1"><Icons.Youtube /> YT</div>}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-base sm:text-lg text-white line-clamp-1">{s.title}</h3><button onClick={() => handleDeleteSchedule(s.id)} className="text-gray-600 hover:text-red-500"><Icons.Trash /></button></div>
                    <div className="flex flex-wrap gap-1 mb-2">{s.qualities?.map((q, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-gray-800 text-[9px] text-gray-400 border border-gray-700">{q.label}</span>)}</div>
                    <div className="space-y-1 mb-4 flex-1"><p className="text-[10px] sm:text-xs text-gray-400">📅 {new Date(s.start_time).toLocaleString('id-ID')}</p><p className="text-[10px] sm:text-xs text-yellow-600 font-mono">Rp {s.price.toLocaleString('id-ID')}</p></div>
                    <button onClick={() => handleActivateSchedule(s)} className={`py-2 rounded text-xs font-bold flex items-center justify-center gap-2 w-full ${s.is_active ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-white text-black hover:bg-green-500'}`}>{s.is_active ? <><Icons.Stop /> STOP</> : <><Icons.Play /> START</>}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- OFFERS TAB --- */}
        {activeTab === 'offers' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row gap-6 items-center col-span-2 md:col-span-1">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative group border border-gray-700">
                             {qrisUrl ? <img src={qrisUrl} className="w-full h-full object-cover" /> : <span className="text-black font-bold text-[10px]">NO QRIS</span>}
                             <div onClick={() => { setMediaMode('qris'); setShowMediaModal(true); fetchMedia(); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><span className="text-white text-[10px] font-bold">CHANGE</span></div>
                        </div>
                        <div className="flex-1 text-center sm:text-left"><h3 className="text-sm md:text-lg font-bold text-white mb-1">QRIS Payment</h3><p className="text-gray-500 text-[10px] md:text-xs">Upload gambar QRIS untuk halaman Offers.</p></div>
                    </div>
                </div>
                <div className="border-t border-gray-800 my-8"></div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Active Offers</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((p) => {
                        const isActive = p.is_active !== false; 
                        return (
                            <div key={p.id} className={`bg-[#0a0a0a] border rounded-xl p-6 relative group transition-all flex flex-col ${isActive ? 'border-gray-800 hover:border-yellow-500/50' : 'border-red-900/30 bg-red-950/5 opacity-75'}`}>
                                 <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleOpenPackageModal(p)} className="text-gray-500 hover:text-yellow-500"><Icons.Edit /></button>
                                    <button onClick={() => handleDeletePackage(p.id)} className="text-gray-500 hover:text-red-500"><Icons.Trash /></button>
                                 </div>

                                 {/* IMAGE PREVIEW IN CARD */}
                                 {p.image_url && (
                                     <div className="h-24 w-full mb-4 rounded-lg overflow-hidden relative">
                                         <img src={p.image_url} className="w-full h-full object-cover opacity-60" />
                                     </div>
                                 )}

                                 {p.topic && <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-yellow-500 uppercase tracking-wider self-start mb-2">{p.topic}</span>}
                                 <h3 className="text-lg md:text-xl font-bold text-white mb-1">{p.title}</h3>
                                 <div className="text-xl md:text-2xl font-mono text-yellow-500 mb-4">Rp {p.price.toLocaleString('id-ID')}</div>
                                 <div className="flex gap-4 text-xs text-gray-400 mb-6"><span className="uppercase tracking-widest">{p.duration} Days</span>{p.is_limited && <span className="text-red-500 font-bold">Stock: {p.stock}</span>}</div>
                                 <div className="space-y-2 mb-6 flex-1">{(p.description || "").split(',').map((f, i) => <div key={i} className="text-sm text-gray-300 flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"></div>{f.trim()}</div>)}</div>
                                 
                                 <button 
                                     onClick={() => handleTogglePackageStatus(p)} 
                                     className={`w-full py-2 rounded border text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 ${isActive ? 'bg-white/5 border-white/5 text-gray-500 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900' : 'bg-red-900/20 border-red-800 text-red-400 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800'}`}
                                 >
                                    {isActive ? <><Icons.EyeOff /> Disable</> : <><Icons.Eye /> Enable</>}
                                 </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </main>

      {/* --- MODAL BULK IMPORT --- */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-gray-800 w-full max-w-lg rounded-2xl p-6 relative">
                <button onClick={() => setShowBulkModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button>
                <h3 className="text-xl font-bold text-white mb-2">Bulk Import Users</h3>
                <p className="text-xs text-gray-500 mb-4">Paste email list here (one per line or comma separated). Each user will get <strong>30 Days</strong> access.</p>
                <form onSubmit={handleBulkImport}>
                    <textarea className="w-full h-48 bg-black border border-gray-700 rounded p-3 text-white text-xs font-mono outline-none focus:border-yellow-500" placeholder="user1@email.com&#10;user2@email.com" value={bulkText} onChange={(e) => setBulkText(e.target.value)} required />
                    <div className="mt-4 flex justify-end"><button type="submit" disabled={bulkLoading} className="bg-white text-black hover:bg-yellow-500 font-bold px-6 py-3 rounded disabled:opacity-50 transition-colors">{bulkLoading ? 'Processing...' : 'Start Import'}</button></div>
                </form>
            </div>
        </div>
      )}

      {/* MODALS SAMA SEPERTI SEBELUMNYA */}
      {showUserModal && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#111] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative"><button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button><h3 className="text-xl font-bold text-white mb-6">New Access</h3><form onSubmit={handleCreateUser} className="space-y-4"><div><label className="text-xs text-gray-500 uppercase">Email</label><input type="email" value={userFormEmail} onChange={e => setUserFormEmail(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required /></div><div><label className="text-xs text-gray-500 uppercase">Duration (Days)</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required /></div><button type="submit" className="w-full bg-white text-black hover:bg-yellow-500 font-bold py-3 rounded mt-2">Generate</button></form></div></div>)}
      {showEditUserModal && editingUser && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#111] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative"><button onClick={() => setShowEditUserModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button><h3 className="text-xl font-bold text-white mb-6">Edit / Reactivate User</h3><form onSubmit={handleUpdateUser} className="space-y-4"><div><label className="text-xs text-gray-500 uppercase">Email</label><input type="email" value={userFormEmail} onChange={e => setUserFormEmail(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required /></div><div><label className="text-xs text-gray-500 uppercase">Add Days / Reactivate</label><input type="number" value={userFormDuration} onChange={e => setUserFormDuration(Number(e.target.value))} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Enter days to reactivate" /><p className="text-[10px] text-gray-500 mt-1">Mengisi kolom ini akan me-reset masa aktif mulai dari <strong>HARI INI</strong>.</p></div><button type="submit" className="w-full bg-white text-black hover:bg-yellow-500 font-bold py-3 rounded mt-2">Update / Reactivate</button></form></div></div>)}

      {/* --- PACKAGE MODAL (UPDATED FOR IMAGE) --- */}
      {showPackageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#111] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <button onClick={() => setShowPackageModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button>
                  <h3 className="text-xl font-bold text-white mb-6">{editingPackage ? 'Edit Package' : 'Create Package'}</h3>
                  <form onSubmit={handleSavePackage} className="space-y-4">
                      <div><label className="text-xs text-gray-500 uppercase">Package Name</label><input type="text" value={pkgTitle} onChange={e => setPkgTitle(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required /></div>
                      <div><label className="text-xs text-gray-500 uppercase">Category</label><input type="text" value={pkgTopic} onChange={e => setPkgTopic(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" /></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 uppercase">Price</label><input type="number" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white" required /></div><div><label className="text-xs text-gray-500 uppercase">Duration</label><input type="number" value={pkgDuration} onChange={e => setPkgDuration(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white" required /></div></div>
                      
                      {/* IMAGE INPUT */}
                      <div><label className="text-xs text-gray-500 uppercase">Package Image</label><div className="flex gap-2"><input type="text" value={pkgImage} onChange={e => setPkgImage(e.target.value)} className="flex-1 bg-black border-gray-700 rounded p-3 text-white text-xs outline-none" placeholder="Image URL" /><button type="button" onClick={() => {setMediaMode('package'); setShowMediaModal(true); fetchMedia();}} className="bg-gray-800 text-white px-4 rounded border border-gray-600"><Icons.Image /></button></div></div>

                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded border border-white/10"><input type="checkbox" checked={pkgIsLimited} onChange={e => setPkgIsLimited(e.target.checked)} className="accent-yellow-500" /><label className="text-sm text-gray-300">Limited Stock?</label></div>
                      {pkgIsLimited && (<div><label className="text-xs text-gray-500 uppercase">Stock</label><input type="number" value={pkgStock} onChange={e => setPkgStock(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white" /></div>)}
                      <div><label className="text-xs text-gray-500 uppercase">Features</label><textarea value={pkgFeatures} onChange={e => setPkgFeatures(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white h-24" /></div>
                      <button type="submit" className="w-full bg-white text-black hover:bg-yellow-500 font-bold py-3 rounded mt-2">{editingPackage ? 'Update Package' : 'Save Package'}</button>
                  </form>
              </div>
          </div>
      )}
      
      {/* Schedule & Media Modal Tetap Sama */}
      {showScheduleModal && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#111] border border-gray-800 w-full max-w-lg rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar"><button onClick={() => setShowScheduleModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button><h3 className="text-xl font-bold text-white mb-6">New Stream</h3><form onSubmit={handleCreateSchedule} className="space-y-4"><div><label className="text-xs text-gray-500 uppercase">Title</label><input type="text" value={newScheduleTitle} onChange={e => setNewScheduleTitle(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 uppercase">Time</label><input type="datetime-local" value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white outline-none" required /></div><div><label className="text-xs text-gray-500 uppercase">Price</label><input type="number" value={newSchedulePrice} onChange={e => setNewSchedulePrice(e.target.value)} className="w-full bg-black border-gray-700 rounded p-3 text-white outline-none" /></div></div><div><label className="text-xs text-gray-500 uppercase">Thumbnail</label><div className="flex gap-2"><input type="text" value={newScheduleThumbnail} onChange={e => setNewScheduleThumbnail(e.target.value)} className="flex-1 bg-black border-gray-700 rounded p-3 text-white text-xs outline-none" /><button type="button" onClick={() => {setMediaMode('schedule'); setShowMediaModal(true); fetchMedia();}} className="bg-gray-800 text-white px-4 rounded border border-gray-600"><Icons.Image /></button></div></div><div className="bg-white/5 p-4 rounded-lg border border-gray-700/50 mt-2"><label className="block text-xs text-gray-400 mb-3 uppercase font-bold">Source Type</label><div className="flex flex-wrap gap-4 mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="source" checked={streamSource === 'internal'} onChange={() => setStreamSource('internal')} className="accent-yellow-500" /><span className="text-sm">Internal</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="source" checked={streamSource === 'external'} onChange={() => setStreamSource('external')} className="accent-yellow-500" /><span className="text-sm">External</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="source" checked={streamSource === 'youtube'} onChange={() => setStreamSource('youtube')} className="accent-yellow-500" /><span className="text-sm">YouTube</span></label></div>{streamSource === 'internal' && (<input type="text" value="TUTUP SEMENTARA" readOnly disabled className="w-full bg-red-950/20 border border-red-900/50 rounded p-3 text-red-500 font-bold text-center cursor-not-allowed outline-none" />)}{streamSource === 'youtube' && (<input type="text" value={newScheduleUrl} onChange={e => setNewScheduleUrl(e.target.value)} className="w-full bg-black border-green-900/50 rounded p-3 text-white outline-none" placeholder="Paste YouTube Link Here..." />)}{streamSource === 'external' && (<div className="space-y-3"><input type="text" value={newScheduleUrl} onChange={e => setNewScheduleUrl(e.target.value)} className="w-full bg-black border-blue-900/50 rounded p-3 text-white outline-none" placeholder="Paste Link IDN / M3U8 Here..." /><p className="text-xs text-gray-500 pt-2 border-t border-gray-800">Additional Resolutions (Optional)</p><div className="flex gap-2"><input type="text" placeholder="Label (e.g. 1080p)" value={tempLabel} onChange={e => setTempLabel(e.target.value)} className="w-24 bg-black border border-gray-700 rounded p-2 text-xs text-white" /><input type="text" placeholder="M3U8 URL" value={tempUrl} onChange={e => setTempUrl(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded p-2 text-xs text-white" /><button type="button" onClick={addQuality} className="bg-yellow-600 text-black px-3 rounded font-bold text-xs hover:bg-yellow-500">ADD</button></div><div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">{qualities.map((q, idx) => (<div key={idx} className="flex items-center justify-between bg-black/50 p-2 rounded border border-gray-800"><div className="text-xs overflow-hidden"><span className="font-bold text-yellow-500 mr-2">[{q.label}]</span><span className="text-gray-400 truncate">{q.url.substring(0, 25)}...</span></div><button type="button" onClick={() => removeQuality(idx)} className="text-red-500 hover:text-white"><Icons.X /></button></div>))}</div></div>)}</div><button type="submit" className="w-full bg-white text-black hover:bg-yellow-500 font-bold py-3 rounded mt-4">Create Stream</button></form></div></div>)}
      {showMediaModal && (<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"><div className="bg-[#111] border border-gray-800 w-full max-w-3xl rounded-2xl p-6 relative h-[80vh] flex flex-col"><div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4"><h3 className="text-xl font-bold text-white">Media</h3><button onClick={() => setShowMediaModal(false)}><Icons.X /></button></div><div className="mb-6 p-6 border-2 border-dashed border-gray-800 rounded-xl text-center relative bg-black/50"><input type="file" accept="image/*" onChange={handleUploadMedia} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" /><div className="pointer-events-none">{uploading ? <p className="text-yellow-500 animate-pulse">Uploading...</p> : <><div className="flex justify-center mb-2 text-gray-500"><Icons.Upload /></div><p className="text-sm text-gray-400">Upload Image</p></>}</div></div><div className="flex-1 overflow-y-auto custom-scrollbar"><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">{mediaFiles.map((file, idx) => (<div key={idx} onClick={() => handleSelectMedia(file.url)} className="aspect-square bg-gray-900 rounded overflow-hidden border border-gray-800 hover:border-yellow-500 cursor-pointer group relative"><img src={file.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><span className="text-xs text-white font-bold">SELECT</span></div></div>))}</div></div></div></div>)}
    </div>
  );
}