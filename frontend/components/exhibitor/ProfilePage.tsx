'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiLock, FiEye, FiEyeOff, FiCamera
} from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

type Tab = 'info' | 'password'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [editMode, setEditMode] = useState(false)
  const [tab, setTab] = useState<Tab>('info')
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    venue_name: '',
    venue_address: '',
    description: '',
    rating: '',
    avatar: 'https://saraahah.com/images/profile.png',
  })

  // حمّل بيانات المستخدم من الـ store
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        venue_name: (user as any).venue_name || '',
        venue_address: (user as any).venue_address || (user as any).address || '',
        description: (user as any).description || '',
        rating: (user as any).rating ?? '',
        avatar: 'https://saraahah.com/images/profile.png',
      })
    }
  }, [user])

  // حفظ التعديلات للباك-إند
  const handleSave = async () => {
    try {
      const payload: Record<string, any> = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        venue_name: profile.venue_name,
        venue_address: profile.venue_address,
        description: profile.description,
      }

      const res = await api.put('/api/user/profile', payload)

      // حدّث الستور محليًا عشان باقي الواجهة تتزامن فورًا
      const fresh = res.data?.data ?? {}
      useAuthStore.setState({
        user: { ...(useAuthStore.getState().user ?? {}), ...fresh },
        lastProfileFetch: Date.now(),
      })

      setEditMode(false)
      // يمكنك استبدال هذا بـ toast لو حابب
      // eslint-disable-next-line no-alert
      alert('تم حفظ البيانات بنجاح ✅')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Update profile error:', err?.response?.data || err)
      // eslint-disable-next-line no-alert
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.first_error ||
          'فشل في حفظ البيانات ❌'
      )
    }
  }

  // تغيير كلمة المرور (واجهة فقط)
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      setPasswordError('جميع الحقول مطلوبة')
      return
    }
    if (passwords.new.length < 8) {
      setPasswordError('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف')
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('كلمتا المرور غير متطابقتين')
      return
    }
    setPasswords({ old: '', new: '', confirm: '' })
    // eslint-disable-next-line no-alert
    alert('تم تغيير كلمة المرور (نموذج تجريبي)')
  }

  // تغيير الصورة المحلية (بدون رفع)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      setProfile(p => ({ ...p, avatar: url }))
    }
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* الصورة والاسم */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img
                src={profile.avatar}
                alt="الصورة الشخصية"
                className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover shadow-lg"
              />
              {editMode && (
                <>
                  <button
                    className="absolute bottom-2 left-2 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-black/80 transition"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="تغيير الصورة"
                  >
                    <FiCamera size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-800">
                {profile.first_name} {profile.last_name}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {user?.role === 'venue_owner' ? 'صاحب معرض' : user?.role || 'مستخدم'}
              </span>
            </div>
            {(profile.rating ?? '') !== '' && (
              <div className="mt-2 text-sm text-gray-500">
                التقييم: <span className="font-semibold">{profile.rating}</span>
              </div>
            )}
          </div>

          {/* التابات */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'info' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setTab('info')}
            >
              المعلومات الشخصية
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'password' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setTab('password')}
            >
              تغيير كلمة المرور
            </button>
          </div>

          {/* المحتوى */}
          <AnimatePresence mode="wait">
            {tab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1">الاسم الأول</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                        value={profile.first_name}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">الاسم الأخير</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                        value={profile.last_name}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">البريد الإلكتروني</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        dir="ltr"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                        value={profile.email}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      />
                      {!editMode && <FiMail className="text-gray-400" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">رقم الجوال</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                        value={profile.phone}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      />
                      {!editMode && <FiPhone className="text-gray-400" />}
                    </div>
                  </div>

                  {/* حقول صاحب المعرض */}
                  <div>
                    <label className="block text-gray-700 mb-1">اسم المعرض</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                        value={profile.venue_name}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, venue_name: e.target.value }))}
                      />
                      {!editMode && <FiUser className="text-gray-400" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">عنوان المعرض</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                      value={profile.venue_address}
                      disabled={!editMode}
                      onChange={e => setProfile(p => ({ ...p, venue_address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">وصف المعرض</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 disabled:bg-gray-100"
                      value={profile.description}
                      disabled={!editMode}
                      onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>

                  {/* أزرار الحفظ */}
                  <div className="flex justify-end gap-4 mt-8">
                    {!editMode ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black/90 transition-colors"
                        onClick={() => setEditMode(true)}
                      >
                        <FiEdit2 />
                        تعديل البيانات
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={handleSave}
                      >
                        <FiSave />
                        حفظ التعديلات
                      </motion.button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {tab === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form className="space-y-6" onSubmit={handleChangePassword}>
                  <div>
                    <label className="block text-gray-700 mb-1">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700"
                        value={passwords.old}
                        onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(s => !s)}
                        tabIndex={-1}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700"
                      value={passwords.new}
                      onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                  {passwordError && (
                    <div className="text-red-500 text-sm">{passwordError}</div>
                  )}
                  <div className="flex justify-end mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black/90 transition-colors"
                    >
                      <FiLock />
                      تغيير كلمة المرور
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
