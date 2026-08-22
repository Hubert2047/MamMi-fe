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
  vi: { createCategory: 'Tạo danh mục', editCategory: 'Sửa danh mục', categoryName: 'Tên danh mục', categoryNamePlaceholder: 'Nhập tên danh mục', categoryList: 'Danh sách danh mục', emptyCategories: 'Chưa có danh mục nào', save: 'Lưu', savingCategory: 'Đang lưu...', deletingCategory: 'Đang xóa...', cancel: 'Hủy', name: 'Tên', actions: 'Thao tác', loading: 'Đang tải...', requiredCategoryName: 'Vui lòng nhập tên danh mục', confirmDeleteCategory: 'Bạn có chắc muốn xóa danh mục này không?', createCategorySuccess: 'Đã tạo danh mục', updateCategorySuccess: 'Đã cập nhật danh mục', deleteCategorySuccess: 'Đã xóa danh mục', categorySaveError: 'Không thể lưu danh mục', categoryDeleteError: 'Không thể xóa danh mục' },
  en: { createCategory: 'Create category', editCategory: 'Edit category', categoryName: 'Category name', categoryNamePlaceholder: 'Enter category name', categoryList: 'Category list', emptyCategories: 'No categories yet', save: 'Save', savingCategory: 'Saving...', deletingCategory: 'Deleting...', cancel: 'Cancel', name: 'Name', actions: 'Actions', loading: 'Loading...', requiredCategoryName: 'Please enter a category name', confirmDeleteCategory: 'Are you sure you want to delete this category?', createCategorySuccess: 'Category created', updateCategorySuccess: 'Category updated', deleteCategorySuccess: 'Category deleted', categorySaveError: 'Unable to save category', categoryDeleteError: 'Unable to delete category' },
  'zh-TW': { createCategory: '\u65b0\u589e\u5206\u985e', editCategory: '\u7de8\u8f2f\u5206\u985e', categoryName: '\u5206\u985e\u540d\u7a31', categoryNamePlaceholder: '\u8acb\u8f38\u5165\u5206\u985e\u540d\u7a31', categoryList: '\u5206\u985e\u6e05\u55ae', emptyCategories: '\u5c1a\u7121\u5206\u985e', save: '\u5132\u5b58', savingCategory: '\u5132\u5b58\u4e2d...', deletingCategory: '\u522a\u9664\u4e2d...', cancel: '\u53d6\u6d88', name: '\u540d\u7a31', actions: '\u64cd\u4f5c', loading: '\u8f09\u5165\u4e2d...', requiredCategoryName: '\u8acb\u8f38\u5165\u5206\u985e\u540d\u7a31', confirmDeleteCategory: '\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u5206\u985e\u55ce\uff1f', createCategorySuccess: '\u5206\u985e\u5df2\u5efa\u7acb', updateCategorySuccess: '\u5206\u985e\u5df2\u66f4\u65b0', deleteCategorySuccess: '\u5206\u985e\u5df2\u522a\u9664', categorySaveError: '\u7121\u6cd5\u5132\u5b58\u5206\u985e', categoryDeleteError: '\u7121\u6cd5\u522a\u9664\u5206\u985e' },
} as const

const commonMessages = {
  vi: { confirm: '\u0058\u00e1c nh\u1eadn', confirmDeleteTitle: '\u0058\u00e1c nh\u1eadn x\u00f3a' },
  en: { confirm: 'Confirm', confirmDeleteTitle: 'Confirm deletion' },
  'zh-TW': { confirm: '\u78ba\u5b9a', confirmDeleteTitle: '\u78ba\u5b9a\u522a\u9664' },
} as const

const addonMessages = {
  vi: { createAddon: 'Tạo addon', editAddon: 'Sửa addon', addonName: 'Tên addon', addonNamePlaceholder: 'Nhập tên addon', extraPrice: 'Giá cộng thêm', addonList: 'Danh sách addon', emptyAddons: 'Chưa có addon nào', savingAddon: 'Đang lưu...', deletingAddon: 'Đang xóa...', requiredAddonName: 'Vui lòng nhập tên addon', confirmDeleteAddon: 'Bạn có chắc muốn xóa addon này không?', createAddonSuccess: 'Đã tạo addon', updateAddonSuccess: 'Đã cập nhật addon', deleteAddonSuccess: 'Đã xóa addon', addonSaveError: 'Không thể lưu addon', addonDeleteError: 'Không thể xóa addon' },
  en: { createAddon: 'Create addon', editAddon: 'Edit addon', addonName: 'Addon name', addonNamePlaceholder: 'Enter addon name', extraPrice: 'Extra price', addonList: 'Addon list', emptyAddons: 'No addons yet', savingAddon: 'Saving...', deletingAddon: 'Deleting...', requiredAddonName: 'Please enter an addon name', confirmDeleteAddon: 'Are you sure you want to delete this addon?', createAddonSuccess: 'Addon created', updateAddonSuccess: 'Addon updated', deleteAddonSuccess: 'Addon deleted', addonSaveError: 'Unable to save addon', addonDeleteError: 'Unable to delete addon' },
  'zh-TW': { createAddon: '\u65b0\u589e\u914d\u6599', editAddon: '\u7de8\u8f2f\u914d\u6599', addonName: '\u914d\u6599\u540d\u7a31', addonNamePlaceholder: '\u8acb\u8f38\u5165\u914d\u6599\u540d\u7a31', extraPrice: '\u52a0\u50f9', addonList: '\u914d\u6599\u6e05\u55ae', emptyAddons: '\u5c1a\u7121\u914d\u6599', savingAddon: '\u5132\u5b58\u4e2d...', deletingAddon: '\u522a\u9664\u4e2d...', requiredAddonName: '\u8acb\u8f38\u5165\u914d\u6599\u540d\u7a31', confirmDeleteAddon: '\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u914d\u6599\u55ce\uff1f', createAddonSuccess: '\u914d\u6599\u5df2\u5efa\u7acb', updateAddonSuccess: '\u914d\u6599\u5df2\u66f4\u65b0', deleteAddonSuccess: '\u914d\u6599\u5df2\u522a\u9664', addonSaveError: '\u7121\u6cd5\u5132\u5b58\u914d\u6599', addonDeleteError: '\u7121\u6cd5\u522a\u9664\u914d\u6599' },
} as const

const discountMessages = {
  vi: { createDiscount: 'Tạo khuyến mãi', editDiscount: 'Sửa khuyến mãi', discountNamePlaceholder: 'Nhập tên khuyến mãi', discountType: 'Loại', discountPercent: 'Phần trăm', discountValue: 'Số tiền', discountAmount: 'Giá trị', discountNote: 'Ghi chú', discountNotePlaceholder: 'Nhập ghi chú', discountActive: 'Đang áp dụng', discountList: 'Danh sách khuyến mãi', emptyDiscounts: 'Chưa có khuyến mãi nào', currency: '₫', savingDiscount: 'Đang lưu...', deletingDiscount: 'Đang xóa...', requiredDiscountName: 'Vui lòng nhập tên khuyến mãi', confirmDeleteDiscount: 'Bạn có chắc muốn xóa khuyến mãi này không?', createDiscountSuccess: 'Đã tạo khuyến mãi', updateDiscountSuccess: 'Đã cập nhật khuyến mãi', deleteDiscountSuccess: 'Đã xóa khuyến mãi', discountSaveError: 'Không thể lưu khuyến mãi', discountDeleteError: 'Không thể xóa khuyến mãi' },
  en: { createDiscount: 'Create discount', editDiscount: 'Edit discount', discountNamePlaceholder: 'Enter discount name', discountType: 'Type', discountPercent: 'Percentage', discountValue: 'Fixed amount', discountAmount: 'Value', discountNote: 'Note', discountNotePlaceholder: 'Enter a note', discountActive: 'Active', discountList: 'Discount list', emptyDiscounts: 'No discounts yet', currency: '', savingDiscount: 'Saving...', deletingDiscount: 'Deleting...', requiredDiscountName: 'Please enter a discount name', confirmDeleteDiscount: 'Are you sure you want to delete this discount?', createDiscountSuccess: 'Discount created', updateDiscountSuccess: 'Discount updated', deleteDiscountSuccess: 'Discount deleted', discountSaveError: 'Unable to save discount', discountDeleteError: 'Unable to delete discount' },
  'zh-TW': { createDiscount: '\u65b0\u589e\u512a\u60e0', editDiscount: '\u7de8\u8f2f\u512a\u60e0', discountNamePlaceholder: '\u8acb\u8f38\u5165\u512a\u60e0\u540d\u7a31', discountType: '\u985e\u578b', discountPercent: '\u767e\u5206\u6bd4', discountValue: '\u91d1\u984d', discountAmount: '\u6578\u503c', discountNote: '\u5099\u8a3b', discountNotePlaceholder: '\u8acb\u8f38\u5165\u5099\u8a3b', discountActive: '\u555f\u7528\u4e2d', discountList: '\u512a\u60e0\u6e05\u55ae', emptyDiscounts: '\u5c1a\u7121\u512a\u60e0', currency: '\u5143', savingDiscount: '\u5132\u5b58\u4e2d...', deletingDiscount: '\u522a\u9664\u4e2d...', requiredDiscountName: '\u8acb\u8f38\u5165\u512a\u60e0\u540d\u7a31', confirmDeleteDiscount: '\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u512a\u60e0\u55ce\uff1f', createDiscountSuccess: '\u512a\u60e0\u5df2\u5efa\u7acb', updateDiscountSuccess: '\u512a\u60e0\u5df2\u66f4\u65b0', deleteDiscountSuccess: '\u512a\u60e0\u5df2\u522a\u9664', discountSaveError: '\u7121\u6cd5\u5132\u5b58\u512a\u60e0', discountDeleteError: '\u7121\u6cd5\u522a\u9664\u512a\u60e0' },
} as const

const extraMessages = {
  vi: { createProduct: 'Tạo sản phẩm', editProduct: 'Sửa sản phẩm', productName: 'Tên sản phẩm', chooseCategory: 'Chọn danh mục', variants: 'Biến thể', commaSeparated: '(phân cách bằng dấu phẩy)', notes: 'Ghi chú món', variantPlaceholder: 'Nhỏ, Vừa, Lớn', notePlaceholder: 'Ít cay, Không hành', saving: 'Đang lưu...', update: 'Cập nhật', cancel: 'Hủy', productList: 'Danh sách sản phẩm', name: 'Tên', price: 'Giá cơ bản', status: 'Trạng thái', actions: 'Thao tác', loading: 'Đang tải...', hidden: 'Tạm ẩn', edit: 'Sửa', delete: 'Xóa', validationProduct: 'Vui lòng nhập tên và danh mục', saveError: 'Không thể lưu sản phẩm', createSuccess: 'Đã tạo sản phẩm', updateSuccess: 'Đã cập nhật sản phẩm', deleteSuccess: 'Đã xóa sản phẩm', deleteError: 'Không thể xóa sản phẩm' },
  en: { createProduct: 'Create product', editProduct: 'Edit product', productName: 'Product name', chooseCategory: 'Choose category', variants: 'Variants', commaSeparated: '(comma separated)', notes: 'Item notes', variantPlaceholder: 'Small, Medium, Large', notePlaceholder: 'Less spicy, No onion', saving: 'Saving...', update: 'Update', cancel: 'Cancel', productList: 'Product list', name: 'Name', price: 'Base price', status: 'Status', actions: 'Actions', loading: 'Loading...', hidden: 'Hidden', edit: 'Edit', delete: 'Delete', validationProduct: 'Please enter a product name and category', saveError: 'Unable to save product', createSuccess: 'Product created', updateSuccess: 'Product updated', deleteSuccess: 'Product deleted', deleteError: 'Unable to delete product' },
  'zh-TW': { createProduct: '\u65b0\u589e\u5546\u54c1', editProduct: '\u7de8\u8f2f\u5546\u54c1', productName: '\u5546\u54c1\u540d\u7a31', chooseCategory: '\u9078\u64c7\u5206\u985e', variants: '\u898f\u683c', commaSeparated: '(\u8acb\u4ee5\u9017\u865f\u5206\u9694)', notes: '\u5546\u54c1\u5099\u8a3b', variantPlaceholder: '\u5c0f\u3001\u4e2d\u3001\u5927', notePlaceholder: '\u5c11\u8fa3\u3001\u4e0d\u8981\u8525', saving: '\u5132\u5b58\u4e2d...', update: '\u66f4\u65b0', cancel: '\u53d6\u6d88', productList: '\u5546\u54c1\u6e05\u55ae', name: '\u540d\u7a31', price: '\u57fa\u672c\u50f9\u683c', status: '\u72c0\u614b', actions: '\u64cd\u4f5c', loading: '\u8f09\u5165\u4e2d...', hidden: '\u96b1\u85cf', edit: '\u7de8\u8f2f', delete: '\u522a\u9664', validationProduct: '\u8acb\u8f38\u5165\u5546\u54c1\u540d\u7a31\u548c\u5206\u985e', saveError: '\u7121\u6cd5\u5132\u5b58\u5546\u54c1', createSuccess: '\u5546\u54c1\u5df2\u5efa\u7acb', updateSuccess: '\u5546\u54c1\u5df2\u66f4\u65b0', deleteSuccess: '\u5546\u54c1\u5df2\u522a\u9664', deleteError: '\u7121\u6cd5\u522a\u9664\u5546\u54c1' },
} as const

const productActionMessages = {
  vi: { copy: 'Sao chép', allCategories: 'Tất cả danh mục', productTotal: 'Tổng sản phẩm', posAddItem: 'Thêm món', posEditItem: 'Chỉnh sửa món', cancelPosItemBeforeCategory: 'Vui lòng hủy thao tác hiện tại trước khi chuyển danh mục', confirmCreateProduct: 'Bạn có chắc muốn tạo sản phẩm này không?', confirmUpdateProduct: 'Bạn có chắc muốn cập nhật sản phẩm này không?', confirmDeleteProduct: 'Bạn có chắc muốn xóa sản phẩm này không?' },
  en: { copy: 'Copy', allCategories: 'All categories', productTotal: 'Total products', posAddItem: 'Add item', posEditItem: 'Edit item', cancelPosItemBeforeCategory: 'Please cancel the current action before switching categories', confirmCreateProduct: 'Are you sure you want to create this product?', confirmUpdateProduct: 'Are you sure you want to update this product?', confirmDeleteProduct: 'Are you sure you want to delete this product?' },
  'zh-TW': { copy: '複製', allCategories: '所有分類', productTotal: '商品總數', posAddItem: '新增商品', posEditItem: '編輯商品', cancelPosItemBeforeCategory: '切換分類前請先取消目前的操作', confirmCreateProduct: '確定要建立此商品嗎？', confirmUpdateProduct: '確定要更新此商品嗎？', confirmDeleteProduct: '確定要刪除此商品嗎？' },
} as const

const productDescriptionMessages = {
  vi: { description: 'Mô tả món ăn', descriptionPlaceholder: 'Mô tả thành phần hoặc đặc điểm món ăn' },
  en: { description: 'Description', descriptionPlaceholder: 'Describe the ingredients or dish details' },
  'zh-TW': { description: '商品描述', descriptionPlaceholder: '描述食材或商品特色' },
} as const

const orderMessages = {
  vi: { allOrders: 'Tất cả', pendingPayment: 'Chờ thanh toán', paidOrders: 'Đã thanh toán' },
  en: { allOrders: 'All', pendingPayment: 'Pending payment', paidOrders: 'Paid' },
  'zh-TW': { allOrders: '全部', pendingPayment: '待付款', paidOrders: '已付款' },
} as const

const dailyClosingMessages = {
  vi: { closingReasonRequired: 'Có chênh lệch nên phải điền nguyên nhân mới kết toán được' },
  en: { closingReasonRequired: 'A reason is required for the difference before closing the day' },
  'zh-TW': { closingReasonRequired: '有差異時必須填寫原因才能結算' },
} as const

type MessageKey = keyof typeof messages.vi | keyof typeof extraMessages.vi | keyof typeof productActionMessages.vi | keyof typeof productDescriptionMessages.vi | keyof typeof orderMessages.vi | keyof typeof dailyClosingMessages.vi | keyof typeof categoryMessages.vi | keyof typeof addonMessages.vi | keyof typeof discountMessages.vi | keyof typeof commonMessages.vi
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
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => key in messages[locale] ? messages[locale][key as keyof typeof messages.vi] : key in extraMessages[locale] ? extraMessages[locale][key as keyof typeof extraMessages.vi] : key in productActionMessages[locale] ? productActionMessages[locale][key as keyof typeof productActionMessages.vi] : key in productDescriptionMessages[locale] ? productDescriptionMessages[locale][key as keyof typeof productDescriptionMessages.vi] : key in orderMessages[locale] ? orderMessages[locale][key as keyof typeof orderMessages.vi] : key in dailyClosingMessages[locale] ? dailyClosingMessages[locale][key as keyof typeof dailyClosingMessages.vi] : key in commonMessages[locale] ? commonMessages[locale][key as keyof typeof commonMessages.vi] : key in categoryMessages[locale] ? categoryMessages[locale][key as keyof typeof categoryMessages.vi] : key in addonMessages[locale] ? addonMessages[locale][key as keyof typeof addonMessages.vi] : discountMessages[locale][key as keyof typeof discountMessages.vi] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() { const context = useContext(I18nContext); if (!context) throw new Error('useI18n must be used inside I18nProvider'); return context }
