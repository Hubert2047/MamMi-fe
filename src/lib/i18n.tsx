'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const locales = ['vi', 'en', 'zh-TW'] as const
export type Locale = (typeof locales)[number]

const messages = {
  vi: { language: 'Ngôn ngữ', login: 'Đăng nhập', account: 'Tài khoản', password: 'Mật khẩu', accountPlaceholder: 'Tên tài khoản', passwordPlaceholder: 'Nhập mật khẩu', loginDescription: 'Nhập thông tin tài khoản của bạn để tiếp tục', loginLoading: 'Đang xử lý…', loginSubmit: 'Đăng nhập', invalidCredentials: 'Sai tài khoản hoặc mật khẩu', requiredAccount: 'Vui lòng nhập tài khoản', requiredPassword: 'Vui lòng nhập mật khẩu', products: 'Sản phẩm', categories: 'Danh mục', addons: 'Topping / Addon', discounts: 'Khuyến mãi', employees: 'Nhân viên', expenses: 'Chi phí', revenues: 'Doanh thu khác', orders: 'Đơn hàng', dailyClosing: 'Kết sổ', logout: 'Đăng xuất', backToPos: 'Quay lại POS', admin: 'POS Admin', selling: 'Đang bán' },
  en: { language: 'Language', login: 'Sign in', account: 'Account', password: 'Password', accountPlaceholder: 'Account name', passwordPlaceholder: 'Enter password', loginDescription: 'Enter your account information to continue', loginLoading: 'Signing in…', loginSubmit: 'Sign in', invalidCredentials: 'Invalid account or password', requiredAccount: 'Please enter your account', requiredPassword: 'Please enter your password', products: 'Products', categories: 'Categories', addons: 'Topping / Addons', discounts: 'Discounts', employees: 'Employees', expenses: 'Expenses', revenues: 'Other revenue', orders: 'Orders', dailyClosing: 'Daily closing', logout: 'Log out', backToPos: 'Back to POS', admin: 'POS Admin', selling: 'Active' },
  'zh-TW': { language: '語言', login: '登入', account: '帳號', password: '密碼', accountPlaceholder: '輸入帳號', passwordPlaceholder: '輸入密碼', loginDescription: '請輸入帳號資訊以繼續', loginLoading: '登入中…', loginSubmit: '登入', invalidCredentials: '帳號或密碼錯誤', requiredAccount: '請輸入帳號', requiredPassword: '請輸入密碼', products: '商品', categories: '分類', addons: '加料 / 配料', discounts: '優惠活動', employees: '員工', expenses: '支出', revenues: '其他收入', orders: '訂單', dailyClosing: '日結', logout: '登出', backToPos: '返回 POS', admin: 'POS 管理', selling: '販售中' },
} as const

const categoryMessages = {
  vi: { createCategory: 'Tạo danh mục', editCategory: 'Sửa danh mục', categoryName: 'Tên danh mục', categoryList: 'Danh sách danh mục', save: 'Lưu', cancel: 'Hủy', name: 'Tên', actions: 'Thao tác', loading: 'Đang tải...', createCategorySuccess: 'Đã tạo danh mục', updateCategorySuccess: 'Đã cập nhật danh mục', deleteCategorySuccess: 'Đã xóa danh mục', categorySaveError: 'Không thể lưu danh mục', categoryDeleteError: 'Không thể xóa danh mục' },
  en: { createCategory: 'Create category', editCategory: 'Edit category', categoryName: 'Category name', categoryList: 'Category list', save: 'Save', cancel: 'Cancel', name: 'Name', actions: 'Actions', loading: 'Loading...', createCategorySuccess: 'Category created', updateCategorySuccess: 'Category updated', deleteCategorySuccess: 'Category deleted', categorySaveError: 'Unable to save category', categoryDeleteError: 'Unable to delete category' },
  'zh-TW': { createCategory: '\u65b0\u589e\u5206\u985e', editCategory: '\u7de8\u8f2f\u5206\u985e', categoryName: '\u5206\u985e\u540d\u7a31', categoryList: '\u5206\u985e\u6e05\u55ae', save: '\u5132\u5b58', cancel: '\u53d6\u6d88', name: '\u540d\u7a31', actions: '\u64cd\u4f5c', loading: '\u8f09\u5165\u4e2d...', createCategorySuccess: '\u5206\u985e\u5df2\u5efa\u7acb', updateCategorySuccess: '\u5206\u985e\u5df2\u66f4\u65b0', deleteCategorySuccess: '\u5206\u985e\u5df2\u522a\u9664', categorySaveError: '\u7121\u6cd5\u5132\u5b58\u5206\u985e', categoryDeleteError: '\u7121\u6cd5\u522a\u9664\u5206\u985e' },
} as const

const extraMessages = {
  vi: { createProduct: 'Tạo sản phẩm', editProduct: 'Sửa sản phẩm', productName: 'Tên sản phẩm', chooseCategory: 'Chọn danh mục', variants: 'Biến thể', commaSeparated: '(phân cách bằng dấu phẩy)', notes: 'Ghi chú món', variantPlaceholder: 'Nhỏ, Vừa, Lớn', notePlaceholder: 'Ít cay, Không hành', saving: 'Đang lưu...', update: 'Cập nhật', cancel: 'Hủy', productList: 'Danh sách sản phẩm', name: 'Tên', price: 'Giá cơ bản', status: 'Trạng thái', actions: 'Thao tác', loading: 'Đang tải...', hidden: 'Tạm ẩn', edit: 'Sửa', delete: 'Xóa', validationProduct: 'Vui lòng nhập tên và danh mục', saveError: 'Không thể lưu sản phẩm', createSuccess: 'Đã tạo sản phẩm', updateSuccess: 'Đã cập nhật sản phẩm', deleteSuccess: 'Đã xóa sản phẩm', deleteError: 'Không thể xóa sản phẩm' },
  en: { createProduct: 'Create product', editProduct: 'Edit product', productName: 'Product name', chooseCategory: 'Choose category', variants: 'Variants', commaSeparated: '(comma separated)', notes: 'Item notes', variantPlaceholder: 'Small, Medium, Large', notePlaceholder: 'Less spicy, No onion', saving: 'Saving...', update: 'Update', cancel: 'Cancel', productList: 'Product list', name: 'Name', price: 'Base price', status: 'Status', actions: 'Actions', loading: 'Loading...', hidden: 'Hidden', edit: 'Edit', delete: 'Delete', validationProduct: 'Please enter a product name and category', saveError: 'Unable to save product', createSuccess: 'Product created', updateSuccess: 'Product updated', deleteSuccess: 'Product deleted', deleteError: 'Unable to delete product' },
  'zh-TW': { createProduct: '\u65b0\u589e\u5546\u54c1', editProduct: '\u7de8\u8f2f\u5546\u54c1', productName: '\u5546\u54c1\u540d\u7a31', chooseCategory: '\u9078\u64c7\u5206\u985e', variants: '\u898f\u683c', commaSeparated: '(\u8acb\u4ee5\u9017\u865f\u5206\u9694)', notes: '\u5546\u54c1\u5099\u8a3b', variantPlaceholder: '\u5c0f\u3001\u4e2d\u3001\u5927', notePlaceholder: '\u5c11\u8fa3\u3001\u4e0d\u8981\u8525', saving: '\u5132\u5b58\u4e2d...', update: '\u66f4\u65b0', cancel: '\u53d6\u6d88', productList: '\u5546\u54c1\u6e05\u55ae', name: '\u540d\u7a31', price: '\u57fa\u672c\u50f9\u683c', status: '\u72c0\u614b', actions: '\u64cd\u4f5c', loading: '\u8f09\u5165\u4e2d...', hidden: '\u96b1\u85cf', edit: '\u7de8\u8f2f', delete: '\u522a\u9664', validationProduct: '\u8acb\u8f38\u5165\u5546\u54c1\u540d\u7a31\u548c\u5206\u985e', saveError: '\u7121\u6cd5\u5132\u5b58\u5546\u54c1', createSuccess: '\u5546\u54c1\u5df2\u5efa\u7acb', updateSuccess: '\u5546\u54c1\u5df2\u66f4\u65b0', deleteSuccess: '\u5546\u54c1\u5df2\u522a\u9664', deleteError: '\u7121\u6cd5\u522a\u9664\u5546\u54c1' },
} as const

type MessageKey = keyof typeof messages.vi | keyof typeof extraMessages.vi | keyof typeof categoryMessages.vi
type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string }
const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi')
  useEffect(() => {
    const saved = window.localStorage.getItem('pos-locale')
    if (saved && locales.includes(saved as Locale)) { setLocaleState(saved as Locale); return }
    const browserLocale = window.navigator.language.toLowerCase()
    setLocaleState(browserLocale.startsWith('zh') ? 'zh-TW' : browserLocale.startsWith('en') ? 'en' : 'vi')
  }, [])
  const setLocale = (next: Locale) => { setLocaleState(next); window.localStorage.setItem('pos-locale', next) }
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => key in messages[locale] ? messages[locale][key as keyof typeof messages.vi] : key in extraMessages[locale] ? extraMessages[locale][key as keyof typeof extraMessages.vi] : categoryMessages[locale][key as keyof typeof categoryMessages.vi] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() { const context = useContext(I18nContext); if (!context) throw new Error('useI18n must be used inside I18nProvider'); return context }
