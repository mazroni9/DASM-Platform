'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiLock, FiEye, FiEyeOff, FiCamera
} from 'react-icons/fi'

const initialProfile = {
  name: 'محمد علي',
  email: 'mohamed@example.com',
  phone: '0501234567',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  role: 'مدير معرض',
  address: 'الرياض - حي العليا'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile)
  const [editMode, setEditMode] = useState(false)
  const [tab, setTab] = useState<'info' | 'password'>('info')
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // حفظ التعديلات
  const handleSave = () => {
    setEditMode(false)
    // هنا يمكنك إرسال البيانات للباك اند
  }

  // تغيير كلمة المرور
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      setPasswordError('جميع الحقول مطلوبة')
      return
    }
    if (passwords.new.length < 6) {
      setPasswordError('كلمة المرور الجديدة قصيرة جداً')
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('كلمتا المرور غير متطابقتين')
      return
    }
    // هنا يمكنك إرسال كلمة المرور الجديدة للباك اند
    setPasswords({ old: '', new: '', confirm: '' })
    setPasswordError('')
    alert('تم تغيير كلمة المرور بنجاح (محاكاة)')
  }

  // تغيير الصورة الشخصية
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      setProfile(p => ({ ...p, avatar: url }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* صورة واسم */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img
                src={profile.avatar}
                alt="الصورة الشخصية"
                className="w-32 h-32 rounded-full border-4 border-indigo-200 object-cover shadow-lg"
              />
              {editMode && (
                <>
                  <button
                    className="absolute bottom-2 left-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition"
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
              <span className="text-2xl font-bold text-indigo-800">{profile.name}</span>
              <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{profile.role}</span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'info' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700'
              }`}
              onClick={() => setTab('info')}
            >
              المعلومات الشخصية
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'password' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700'
              }`}
              onClick={() => setTab('password')}
            >
              تغيير كلمة المرور
            </button>
          </div>
          {/* Tab Content */}
          <div>
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
                    <div>
                      <label className="block text-gray-700 mb-1">الاسم الكامل</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={profile.name}
                          disabled={!editMode}
                          onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        />
                        {!editMode && (
                          <FiUser className="text-indigo-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">البريد الإلكتروني</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={profile.email}
                          disabled={!editMode}
                          onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                        />
                        {!editMode && (
                          <FiMail className="text-indigo-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">رقم الجوال</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={profile.phone}
                          disabled={!editMode}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        />
                        {!editMode && (
                          <FiPhone className="text-indigo-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">العنوان</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={profile.address}
                        disabled={!editMode}
                        onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                      {!editMode ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={passwords.new}
                        onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FiLock />
                        تغيير كلمة المرور
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}