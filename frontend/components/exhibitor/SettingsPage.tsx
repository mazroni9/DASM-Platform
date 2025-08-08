'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSettings, FiBell, FiUser, FiGlobe, FiSave, FiCheckCircle, FiXCircle, FiMoon, FiSun
} from 'react-icons/fi'

const languages = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' }
]

export default function SettingsPage() {
  const [tab, setTab] = useState<'account' | 'notifications' | 'appearance'>('account')
  const [settings, setSettings] = useState({
    language: 'ar',
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    autoLogout: true,
    showProfile: true
  })
  const [saved, setSaved] = useState(false)

  // حفظ الإعدادات (محاكاة)
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    // هنا يمكنك إرسال الإعدادات للباك اند
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
          {/* العنوان */}
          <div className="flex items-center gap-2 mb-8">
            <FiSettings className="text-indigo-600 text-3xl" />
            <h1 className="text-3xl font-extrabold text-indigo-800">الإعدادات</h1>
          </div>
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'account' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700'
              }`}
              onClick={() => setTab('account')}
            >
              الحساب
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'notifications' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700'
              }`}
              onClick={() => setTab('notifications')}
            >
              الإشعارات
            </button>
            <button
              className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                tab === 'appearance' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700'
              }`}
              onClick={() => setTab('appearance')}
            >
              المظهر
            </button>
          </div>
          {/* Tab Content */}
          <div>
            <AnimatePresence mode="wait">
              {tab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-gray-700 mb-1">اللغة</label>
                    <div className="flex items-center gap-4">
                      <FiGlobe className="text-indigo-400" />
                      <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={settings.language}
                        onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">إظهار الملف الشخصي للآخرين</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={settings.showProfile}
                        onChange={e => setSettings(s => ({ ...s, showProfile: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="showProfile"
                      />
                      <label htmlFor="showProfile" className="text-gray-600">تفعيل</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">تسجيل الخروج التلقائي بعد فترة من عدم النشاط</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={settings.autoLogout}
                        onChange={e => setSettings(s => ({ ...s, autoLogout: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="autoLogout"
                      />
                      <label htmlFor="autoLogout" className="text-gray-600">تفعيل</label>
                    </div>
                  </div>
                </motion.div>
              )}
              {tab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-gray-700 mb-1">إشعارات البريد الإلكتروني</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={e => setSettings(s => ({ ...s, emailNotifications: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="emailNotifications"
                      />
                      <label htmlFor="emailNotifications" className="text-gray-600">تفعيل</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">إشعارات الرسائل النصية</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={e => setSettings(s => ({ ...s, smsNotifications: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="smsNotifications"
                      />
                      <label htmlFor="smsNotifications" className="text-gray-600">تفعيل</label>
                    </div>
                  </div>
                </motion.div>
              )}
              {tab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-gray-700 mb-1">الوضع الليلي</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={e => setSettings(s => ({ ...s, darkMode: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="darkMode"
                      />
                      <label htmlFor="darkMode" className="text-gray-600 flex items-center gap-2">
                        {settings.darkMode ? <FiMoon className="text-indigo-500" /> : <FiSun className="text-yellow-400" />}
                        {settings.darkMode ? 'مفعل' : 'غير مفعل'}
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* زر الحفظ */}
          <div className="flex justify-end mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-lg"
              onClick={handleSave}
            >
              <FiSave />
              حفظ الإعدادات
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1 ml-2 text-green-500"
                  >
                    <FiCheckCircle />
                    تم الحفظ
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}