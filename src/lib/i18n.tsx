"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const locales = ["vi", "en", "zh-TW"] as const;
export type Locale = (typeof locales)[number];

const messages: Record<Locale, Record<string, string>> = {
  vi: {
    language: "Ngôn ngữ",
    login: "Đăng nhập",
    account: "Tài khoản",
    password: "Mật khẩu",
    accountPlaceholder: "Tên tài khoản",
    passwordPlaceholder: "Nhập mật khẩu",
    loginDescription: "Nhập thông tin tài khoản của bạn để tiếp tục",
    loginLoading: "Đang xử lý…",
    loginSubmit: "Đăng nhập",
    invalidCredentials: "Sai tài khoản hoặc mật khẩu",
    requiredAccount: "Vui lòng nhập tài khoản",
    requiredPassword: "Vui lòng nhập mật khẩu",
    products: "Sản phẩm",
    categories: "Danh mục",
    addons: "Topping",
    discounts: "Khuyến mãi",
    employees: "Nhân viên",
    expenses: "Chi phí",
    inventory: "Kho nguyên liệu",
    revenues: "Doanh thu khác",
    orders: "Đơn Hàng",
    dailyClosing: "Kết Sổ",
    closingLineGroupConfig: "Cấu hình LINE kết toán",
    closingLineGroupConfigDescription: "Chọn group LINE nhận thông báo khi kết toán hoàn tất.",
    closingLineGroupEnabled: "Gửi thông báo kết toán qua LINE",
    closingLineGroupSelect: "Group LINE",
    closingLineGroupNone: "Không chọn group",
    closingLineGroupSaved: "Đã lưu cấu hình LINE kết toán",
    closingLineGroupSaveError: "Không thể lưu cấu hình LINE kết toán",
    closingLineGroupRequired: "Vui lòng chọn group LINE khi bật gửi thông báo.",
    lineGroups: "Nhóm LINE",
    lineGroupConfiguredTab: "Đã cấu hình",
    lineGroupPendingTab: "Chờ cấu hình",
    lineGroupConfiguredEmpty: "Chưa có group LINE đã cấu hình.",
    lineGroupPendingEmpty: "Không có group LINE chờ cấu hình.",
    lineGroupTotal: "Tổng group",
    lineGroupUsageStatus: "Tình trạng sử dụng",
    lineGroupUsageAvailable: "Chưa sử dụng",
    lineGroupUsageAssigned: "Đã được sử dụng",
    lineGroupEdit: "Sửa cấu hình group LINE",
    lineGroupUpdated: "Đã cập nhật group LINE",
    lineGroupSaveError: "Không thể cập nhật group LINE",
    lineGroupNameExists: "Tên group LINE đã tồn tại.",
    lineGroupDeleteError: "Không thể xóa group LINE",
    lineGroupInUse: "Group đang được sử dụng, cần release trước khi sửa hoặc xóa.",
    lineGroupsRefresh: "Làm mới",
    lineGroupsEmpty: "Chưa phát hiện group LINE nào.",
    lineGroupId: "Group ID",
    lineGroupName: "Tên hiển thị",
    lineGroupUnassigned: "Chưa gán cửa hàng",
    lineGroupEnabled: "Bật nhận thông báo",
    lineGroupNotificationType: "Loại thông báo",
    lineGroupNoNotification: "Không nhận thông báo",
    lineGroupTest: "Gửi thử",
    lineGroupTestConfirmTitle: "Gửi tin nhắn kiểm tra?",
    lineGroupTestConfirmDescription:
      "MamMi sẽ gửi một tin nhắn thử vào group LINE này.",
    lineGroupSaveConfirmTitle: "Lưu cấu hình LINE Group?",
    lineGroupSaveConfirmDescription:
      "MamMi sẽ cập nhật cửa hàng, loại thông báo và trạng thái của group này.",
    lineGroupTestSuccess: "Đã gửi tin nhắn kiểm tra",
    lineGroupTestError: "Không thể gửi tin nhắn kiểm tra",
    confirmDeleteLineGroup: "Bạn có chắc muốn xóa nhóm LINE này không?",
    lineNotificationDailyClosing: "Kết toán",
    lineGroupStatus_pending: "Chờ cấu hình",
    lineGroupStatus_active: "Đang hoạt động",
    lineGroupStatus_disabled: "Đã tắt",
    logout: "Đăng xuất",
    backToPos: "Quay lại POS",
    admin: "POS Admin",
    selling: "Đang bán",
  },
  en: {
    language: "Language",
    login: "Sign in",
    account: "Account",
    password: "Password",
    accountPlaceholder: "Account name",
    passwordPlaceholder: "Enter password",
    loginDescription: "Enter your account information to continue",
    loginLoading: "Signing in…",
    loginSubmit: "Sign in",
    invalidCredentials: "Invalid account or password",
    requiredAccount: "Please enter your account",
    requiredPassword: "Please enter your password",
    products: "Products",
    categories: "Categories",
    addons: "Topping / Addons",
    discounts: "Discounts",
    employees: "Employees",
    expenses: "Expenses",
    inventory: "Inventory",
    revenues: "Other revenue",
    orders: "Orders",
    dailyClosing: "Daily closing",
    closingLineGroupConfig: "Closing LINE configuration",
    closingLineGroupConfigDescription: "Choose the LINE group that receives closing notifications.",
    closingLineGroupEnabled: "Send closing notifications through LINE",
    closingLineGroupSelect: "LINE group",
    closingLineGroupNone: "No group selected",
    closingLineGroupSaved: "Closing LINE configuration saved",
    closingLineGroupSaveError: "Unable to save closing LINE configuration",
    closingLineGroupRequired: "Choose a LINE group when notifications are enabled.",
    lineGroups: "LINE groups",
    lineGroupConfiguredTab: "Configured",
    lineGroupPendingTab: "Pending setup",
    lineGroupConfiguredEmpty: "No configured LINE groups.",
    lineGroupPendingEmpty: "No LINE groups are waiting for setup.",
    lineGroupTotal: "Total groups",
    lineGroupUsageStatus: "Usage status",
    lineGroupUsageAvailable: "Available",
    lineGroupUsageAssigned: "In use",
    lineGroupEdit: "Edit LINE group configuration",
    lineGroupUpdated: "LINE group updated",
    lineGroupSaveError: "Unable to update LINE group",
    lineGroupNameExists: "This LINE group name already exists.",
    lineGroupDeleteError: "Unable to delete LINE group",
    lineGroupInUse: "This group is in use. Release it before editing or deleting.",
    lineGroupsRefresh: "Refresh",
    lineGroupsEmpty: "No LINE groups discovered yet.",
    lineGroupId: "Group ID",
    lineGroupName: "Display name",
    lineGroupUnassigned: "Unassigned",
    lineGroupEnabled: "Enable notifications",
    lineGroupNotificationType: "Notification type",
    lineGroupNoNotification: "No notifications",
    lineGroupTest: "Send test",
    lineGroupTestConfirmTitle: "Send a test message?",
    lineGroupTestConfirmDescription:
      "MamMi will send a test message to this LINE group.",
    lineGroupSaveConfirmTitle: "Save LINE group configuration?",
    lineGroupSaveConfirmDescription:
      "MamMi will update this group's store, notification type, and status.",
    lineGroupTestSuccess: "Test message sent",
    lineGroupTestError: "Unable to send test message",
    confirmDeleteLineGroup: "Are you sure you want to delete this LINE group?",
    lineNotificationDailyClosing: "Daily closing",
    lineGroupStatus_pending: "Pending setup",
    lineGroupStatus_active: "Active",
    lineGroupStatus_disabled: "Disabled",
    logout: "Log out",
    backToPos: "Back to POS",
    admin: "POS Admin",
    selling: "Active",
  },
  "zh-TW": {
    language: "語言",
    login: "登入",
    account: "帳號",
    password: "密碼",
    accountPlaceholder: "輸入帳號",
    passwordPlaceholder: "輸入密碼",
    loginDescription: "請輸入帳號資訊以繼續",
    loginLoading: "登入中…",
    loginSubmit: "登入",
    invalidCredentials: "帳號或密碼錯誤",
    requiredAccount: "請輸入帳號",
    requiredPassword: "請輸入密碼",
    products: "商品",
    categories: "分類",
    addons: "加料 / 配料",
    discounts: "優惠活動",
    employees: "員工",
    expenses: "支出",
    inventory: "原料庫存",
    revenues: "其他收入",
    orders: "訂單",
    dailyClosing: "日結",
    closingLineGroupConfig: "結算 LINE 設定",
    closingLineGroupConfigDescription: "選擇接收結算通知的 LINE 群組。",
    closingLineGroupEnabled: "透過 LINE 發送結算通知",
    closingLineGroupSelect: "LINE 群組",
    closingLineGroupNone: "不選擇群組",
    closingLineGroupSaved: "結算 LINE 設定已儲存",
    closingLineGroupSaveError: "無法儲存結算 LINE 設定",
    closingLineGroupRequired: "啟用通知時請選擇 LINE 群組。",
    lineGroups: "LINE 群組",
    lineGroupConfiguredTab: "已設定",
    lineGroupPendingTab: "待設定",
    lineGroupConfiguredEmpty: "尚無已設定的 LINE 群組。",
    lineGroupPendingEmpty: "沒有等待設定的 LINE 群組。",
    lineGroupTotal: "群組總數",
    lineGroupUsageStatus: "使用狀態",
    lineGroupUsageAvailable: "尚未使用",
    lineGroupUsageAssigned: "已使用",
    lineGroupEdit: "編輯 LINE 群組設定",
    lineGroupUpdated: "LINE 群組已更新",
    lineGroupSaveError: "無法更新 LINE 群組",
    lineGroupNameExists: "此 LINE 群組名稱已存在。",
    lineGroupDeleteError: "無法刪除 LINE 群組",
    lineGroupInUse: "此群組正在使用中，請先釋放後再編輯或刪除。",
    lineGroupsRefresh: "重新整理",
    lineGroupsEmpty: "尚未發現 LINE 群組。",
    lineGroupId: "群組 ID",
    lineGroupName: "顯示名稱",
    lineGroupUnassigned: "尚未指派分店",
    lineGroupEnabled: "啟用通知",
    lineGroupNotificationType: "通知類型",
    lineGroupNoNotification: "不接收通知",
    lineGroupTest: "發送測試",
    lineGroupTestConfirmTitle: "要發送測試訊息嗎？",
    lineGroupTestConfirmDescription: "MamMi 將向此 LINE 群組發送測試訊息。",
    lineGroupSaveConfirmTitle: "要儲存 LINE 群組設定嗎？",
    lineGroupSaveConfirmDescription:
      "MamMi 將更新此群組的分店、通知類型與狀態。",
    lineGroupTestSuccess: "測試訊息已發送",
    lineGroupTestError: "無法發送測試訊息",
    confirmDeleteLineGroup: "確定要刪除此 LINE 群組嗎？",
    lineNotificationDailyClosing: "日結",
    lineGroupStatus_pending: "待設定",
    lineGroupStatus_active: "使用中",
    lineGroupStatus_disabled: "已停用",
    logout: "登出",
    backToPos: "返回 POS",
    admin: "POS 管理",
    selling: "販售中",
  },
} as const;

Object.assign(messages.vi, {
  units: "Đơn Vị",
  createUnit: "Thêm đơn vị",
  unitCode: "Mã đơn vị",
  unitNameVi: "Tên tiếng Việt",
  unitNameEn: "Tên tiếng Anh",
  unitNameZh: "Tên tiếng Trung",
  unitCategory: "Nhóm",
  unitCount: "Số lượng",
  unitWeight: "Khối lượng",
  unitVolume: "Thể tích",
  unitBase: "Đơn vị cơ sở",
  requiredUnit: "Vui lòng nhập mã và tên đơn vị",
  active: "Đang dùng",
  inactive: "Đã tắt",
  enable: "Bật",
  disable: "Tắt",
});
Object.assign(messages.en, {
  units: "Units",
  createUnit: "Add unit",
  unitCode: "Unit code",
  unitNameVi: "Vietnamese name",
  unitNameEn: "English name",
  unitNameZh: "Chinese name",
  unitCategory: "Group",
  unitCount: "Count",
  unitWeight: "Weight",
  unitVolume: "Volume",
  unitBase: "Base unit",
  requiredUnit: "Enter a unit code and name",
  active: "Active",
  inactive: "Inactive",
  enable: "Enable",
  disable: "Disable",
});
Object.assign(messages["zh-TW"], {
  units: "單位",
  createUnit: "新增單位",
  unitCode: "單位代碼",
  unitNameVi: "越南文名稱",
  unitNameEn: "英文名稱",
  unitNameZh: "中文名稱",
  unitCategory: "類別",
  unitCount: "數量",
  unitWeight: "重量",
  unitVolume: "體積",
  unitBase: "基礎單位",
  requiredUnit: "請輸入單位代碼與名稱",
  active: "啟用",
  inactive: "停用",
  enable: "啟用",
  disable: "停用",
});

Object.assign(messages.vi, {
  suppliers: "Nhà cung ứng",
  supplierTotal: "Tổng nhà cung ứng",
  supplierAdd: "Thêm nhà cung ứng",
  supplierEdit: "Sửa nhà cung ứng",
  supplierList: "Danh sách nhà cung ứng",
  supplierEmpty: "Chưa có nhà cung ứng",
  supplierName: "Tên nhà cung ứng",
  supplierContact: "Người liên hệ",
  supplierPhone: "Số điện thoại",
  supplierAddress: "Địa chỉ",
  supplierNote: "Ghi chú",
  supplierLineGroup: "LINE Group nhà cung ứng",
  supplierLineGroupNone: "Không gửi thông báo qua LINE",
  supplierStore: "Cửa hàng",
  supplierCreated: "Đã tạo nhà cung ứng",
  supplierUpdated: "Đã cập nhật nhà cung ứng",
  supplierDeleted: "Đã xóa nhà cung ứng",
  supplierSaveError: "Không thể lưu nhà cung ứng",
  supplierDeleteError: "Không thể xóa nhà cung ứng",
});
Object.assign(messages.en, {
  suppliers: "Suppliers",
  supplierTotal: "Total suppliers",
  supplierAdd: "Add supplier",
  supplierEdit: "Edit supplier",
  supplierList: "Supplier list",
  supplierEmpty: "No suppliers yet",
  supplierName: "Supplier name",
  supplierContact: "Contact person",
  supplierPhone: "Phone",
  supplierAddress: "Address",
  supplierNote: "Note",
  supplierLineGroup: "Supplier LINE group",
  supplierLineGroupNone: "Do not send notifications through LINE",
  supplierStore: "Store",
  supplierCreated: "Supplier created",
  supplierUpdated: "Supplier updated",
  supplierDeleted: "Supplier deleted",
  supplierSaveError: "Unable to save supplier",
  supplierDeleteError: "Unable to delete supplier",
});
Object.assign(messages["zh-TW"], {
  suppliers: "供應商",
  supplierTotal: "供應商總數",
  supplierAdd: "新增供應商",
  supplierEdit: "編輯供應商",
  supplierList: "供應商清單",
  supplierEmpty: "尚無供應商",
  supplierName: "供應商名稱",
  supplierContact: "聯絡人",
  supplierPhone: "電話",
  supplierAddress: "地址",
  supplierNote: "備註",
  supplierLineGroup: "供應商 LINE 群組",
  supplierLineGroupNone: "不透過 LINE 發送通知",
  supplierStore: "分店",
  supplierCreated: "供應商已建立",
  supplierUpdated: "供應商已更新",
  supplierDeleted: "供應商已刪除",
  supplierSaveError: "無法儲存供應商",
  supplierDeleteError: "無法刪除供應商",
});
Object.assign(messages.vi, {
  settingsTitle: "Cài đặt",
  displayLanguage: "Ngôn ngữ hiển thị",
  languageDescription: "",
  currentLanguage: "Hiện tại",
});
Object.assign(messages.en, {
  settingsTitle: "Settings",
  displayLanguage: "Display language",
  languageDescription: "",
  currentLanguage: "Current",
});
Object.assign(messages["zh-TW"], {
  settingsTitle: "設定",
  displayLanguage: "顯示語言",
  languageDescription: "",
  currentLanguage: "目前",
});
Object.assign(messages.vi, {
  noNoteSelected: "Chưa chọn ghi chú",
  printAgents: "Máy in",
  printAgentTitle: "Print agent",
  printAgentCreateDescription:
    "Tạo một agent cho cửa hàng, sau đó thêm nhiều máy in và chọn máy in cho từng loại đơn.",
  printAgentName: "Tên máy in",
  printAgentNamePlaceholder: "Bếp 1",
  printAgentWindowsName: "Tên printer trên Windows",
  printAgentWindowsNamePlaceholder: "Xprinter XP-246B",
  printAgentProfile: "Profile",
  printAgentKitchenProfile: "Kitchen label (TSPL)",
  printAgentReceiptProfile: "Receipt (ESC/POS)",
  printAgentDpi: "DPI",
  printAgentLabelSize: "Khổ label (mm)",
  printAgentWidth: "Rộng",
  printAgentHeight: "Cao",
  printAgentGap: "Khoảng cách",
  printAgentEditPrinter: "Sửa",
  printAgentSavePrinter: "Lưu máy in",
  printAgentCreate: "Tạo cấu hình",
  printAgentTokenTitle: "Token mới — hãy lưu lại ngay",
  printAgentTokenDescription:
    "Token này không được hiển thị lại sau khi rời trang. Dán nội dung dưới đây vào file print-agent/.env.",
  printAgentCopyConfig: "Copy cấu hình agent",
  printAgentList: "Danh sách máy in",
  printAgentLoading: "Đang tải...",
  printAgentEmpty: "Chưa có agent.",
  printAgentEnabled: "Đang bật",
  printAgentDisabled: "Đã tắt",
  printAgentTokenLabel: "Token",
  printAgentRotateToken: "Cấp lại token",
  printAgentDisable: "Tắt",
  printAgentEnable: "Bật",
  printAgentAgentName: "Tên agent",
  printAgentAgentNamePlaceholder: "Máy bếp cửa hàng 1",
  printAgentCreateAgent: "Tạo agent",
  printAgentAddPrinter: "Thêm máy in",
  printAgentNoPrinters: "Agent này chưa có máy in.",
  printAgentRoutingTitle: "Định tuyến in",
  printAgentRoutingDescription:
    "Chọn máy in sẽ nhận từng loại đơn. Cấu hình này được lưu theo cửa hàng.",
  printAgentKitchenRoute: "In bếp",
  printAgentReceiptRoute: "In hóa đơn",
  printAgentFapiaoRoute: "In fapiao",
  printAgentRouteUnset: "Chưa chọn máy in",
});
Object.assign(messages.en, {
  noNoteSelected: "No note selected",
  printAgents: "Printers",
  printAgentTitle: "Print agent",
  printAgentCreateDescription:
    "Create one store agent, then add multiple printers and route each print type to a printer.",
  printAgentName: "Printer name",
  printAgentNamePlaceholder: "Kitchen 1",
  printAgentWindowsName: "Windows printer name",
  printAgentWindowsNamePlaceholder: "Xprinter XP-246B",
  printAgentProfile: "Profile",
  printAgentKitchenProfile: "Kitchen label (TSPL)",
  printAgentReceiptProfile: "Receipt (ESC/POS)",
  printAgentDpi: "DPI",
  printAgentLabelSize: "Label size (mm)",
  printAgentWidth: "Width",
  printAgentHeight: "Height",
  printAgentGap: "Gap",
  printAgentEditPrinter: "Edit",
  printAgentSavePrinter: "Save printer",
  printAgentCreate: "Create configuration",
  printAgentTokenTitle: "New token — save it now",
  printAgentTokenDescription:
    "This token will not be shown again after leaving this page. Paste the content below into print-agent/.env.",
  printAgentCopyConfig: "Copy agent config",
  printAgentList: "Print agents",
  printAgentLoading: "Loading...",
  printAgentEmpty: "No agents configured.",
  printAgentEnabled: "Enabled",
  printAgentDisabled: "Disabled",
  printAgentTokenLabel: "Token",
  printAgentRotateToken: "Rotate token",
  printAgentDisable: "Disable",
  printAgentEnable: "Enable",
  printAgentAgentName: "Agent name",
  printAgentAgentNamePlaceholder: "Store 1 kitchen agent",
  printAgentCreateAgent: "Create agent",
  printAgentAddPrinter: "Add printer",
  printAgentNoPrinters: "No printers configured for this agent.",
  printAgentRoutingTitle: "Print routing",
  printAgentRoutingDescription:
    "Choose which printer receives each print type. This is saved for the store.",
  printAgentKitchenRoute: "Kitchen print",
  printAgentReceiptRoute: "Receipt print",
  printAgentFapiaoRoute: "Fapiao print",
  printAgentRouteUnset: "No printer selected",
});
Object.assign(messages["zh-TW"], {
  noNoteSelected: "尚未選擇備註",
  printAgents: "印表機",
  printAgentTitle: "Print agent",
  printAgentCreateDescription:
    "建立一個分店 agent，再新增多台印表機並為各種列印類型指定印表機。",
  printAgentName: "印表機名稱",
  printAgentNamePlaceholder: "廚房 1",
  printAgentWindowsName: "Windows 印表機名稱",
  printAgentWindowsNamePlaceholder: "Xprinter XP-246B",
  printAgentProfile: "Profile",
  printAgentKitchenProfile: "廚房標籤（TSPL）",
  printAgentReceiptProfile: "收據（ESC/POS）",
  printAgentDpi: "DPI",
  printAgentLabelSize: "標籤尺寸（mm）",
  printAgentWidth: "寬",
  printAgentHeight: "高",
  printAgentGap: "間距",
  printAgentEditPrinter: "編輯",
  printAgentSavePrinter: "儲存印表機",
  printAgentCreate: "建立設定",
  printAgentTokenTitle: "新 Token — 請立即保存",
  printAgentTokenDescription:
    "離開此頁面後將無法再次查看 Token。請將以下內容貼到 print-agent/.env。",
  printAgentCopyConfig: "複製 agent 設定",
  printAgentList: "Print agent 清單",
  printAgentLoading: "載入中...",
  printAgentEmpty: "尚未設定 agent。",
  printAgentEnabled: "啟用中",
  printAgentDisabled: "已停用",
  printAgentTokenLabel: "Token",
  printAgentRotateToken: "重新產生 Token",
  printAgentDisable: "停用",
  printAgentEnable: "啟用",
  printAgentAgentName: "Agent 名稱",
  printAgentAgentNamePlaceholder: "分店 1 廚房 agent",
  printAgentCreateAgent: "建立 agent",
  printAgentAddPrinter: "新增印表機",
  printAgentNoPrinters: "此 agent 尚未設定印表機。",
  printAgentRoutingTitle: "列印路由",
  printAgentRoutingDescription:
    "選擇每種列印類型要使用的印表機，設定會儲存在分店。",
  printAgentKitchenRoute: "廚房列印",
  printAgentReceiptRoute: "收據列印",
  printAgentFapiaoRoute: "發票列印",
  printAgentRouteUnset: "尚未選擇印表機",
});

const loginMessages = {
  vi: {
    loginStore: "Chọn cửa hàng",
    selectStore: "Chọn cửa hàng",
    requiredStoreSelection: "Vui lòng chọn cửa hàng",
    loginPosDevice: "Đăng ký thiết bị POS",
    backToLogin: "Quay lại đăng nhập",
  },
  en: {
    loginStore: "Select store",
    selectStore: "Select store",
    requiredStoreSelection: "Please select a store",
    loginPosDevice: "Register POS device",
    backToLogin: "Back to login",
  },
  "zh-TW": {
    loginStore: "選擇分店",
    selectStore: "選擇分店",
    requiredStoreSelection: "請選擇分店",
    loginPosDevice: "註冊 POS 裝置",
    backToLogin: "返回登入",
  },
} as const;

const userMessages = {
  vi: {
    userAccounts: "Tài khoản cửa hàng",
    accountPageHint:
      "Super Admin tạo tài khoản Admin và Employee theo từng cửa hàng.",
    accountSuperAdminHint: "Chỉ Super Admin được quản lý tài khoản cửa hàng.",
    createAccount: "Tạo tài khoản",
    editAccount: "Sửa",
    saveChanges: "Lưu thay đổi",
    accountList: "Danh sách tài khoản",
    accountNamePlaceholder: "Nhập tên tài khoản",
    accountPasswordPlaceholder: "Nhập mật khẩu",
    accountPasswordOptional: "Để trống nếu không đổi mật khẩu",
    accountRole: "Quyền",
    employeeRole: "Nhân viên",
    adminRole: "Admin",
    accountActive: "Đang hoạt động",
    accountInactive: "Đã khóa",
    accountEmpty: "Chưa có tài khoản nào",
    accountCreateSuccess: "Đã tạo tài khoản",
    accountSaveError: "Không thể lưu tài khoản",
    accountStoreRequired: "Vui lòng chọn cửa hàng",
    allStores: "Tất cả cửa hàng",
    changePassword: "Đổi mật khẩu",
    newPassword: "Mật khẩu mới",
    savePassword: "Lưu mật khẩu",
    passwordChangeSuccess: "Đã đổi mật khẩu",
    passwordChangeError: "Không thể đổi mật khẩu",
  },
  en: {
    userAccounts: "Store accounts",
    accountPageHint: "",
    accountSuperAdminHint: "Only Super Admin can manage store accounts.",
    createAccount: "Create account",
    editAccount: "Edit",
    saveChanges: "Save changes",
    accountList: "Account list",
    accountNamePlaceholder: "Enter account name",
    accountPasswordPlaceholder: "Enter password",
    accountPasswordOptional: "Leave blank to keep the current password",
    accountRole: "Role",
    employeeRole: "Employee",
    adminRole: "Admin",
    accountActive: "Active",
    accountInactive: "Locked",
    accountEmpty: "No accounts yet",
    accountCreateSuccess: "Account created",
    accountSaveError: "Unable to save account",
    accountStoreRequired: "Please select a store",
    allStores: "All stores",
    changePassword: "Change password",
    newPassword: "New password",
    savePassword: "Save password",
    passwordChangeSuccess: "Password changed",
    passwordChangeError: "Unable to change password",
  },
  "zh-TW": {
    userAccounts: "分店帳號",
    accountPageHint: "Super Admin 可為各分店建立 Admin 與 Employee 帳號。",
    accountSuperAdminHint: "只有 Super Admin 可以管理分店帳號。",
    createAccount: "新增帳號",
    editAccount: "編輯",
    saveChanges: "儲存變更",
    accountList: "帳號清單",
    accountNamePlaceholder: "輸入帳號名稱",
    accountPasswordPlaceholder: "輸入密碼",
    accountPasswordOptional: "若不修改密碼請留空",
    accountRole: "權限",
    employeeRole: "員工",
    adminRole: "Admin",
    accountActive: "啟用中",
    accountInactive: "已鎖定",
    accountEmpty: "尚無帳號",
    accountCreateSuccess: "帳號已建立",
    accountSaveError: "無法儲存帳號",
    accountStoreRequired: "請選擇分店",
    allStores: "所有分店",
    changePassword: "變更密碼",
    newPassword: "新密碼",
    savePassword: "儲存密碼",
    passwordChangeSuccess: "密碼已變更",
    passwordChangeError: "無法變更密碼",
  },
} as const;

const cashMessages = {
  vi: {
    cashDenominations: "Mệnh giá tiền",
    selectedCashDenomination: "Đang chọn",
    increaseCash: "Tăng số lượng",
    decreaseCash: "Giảm số lượng",
    clearCashDenominations: "Xóa mệnh giá",
  },
  en: {
    cashDenominations: "Cash denominations",
    selectedCashDenomination: "Selected",
    increaseCash: "Increase quantity",
    decreaseCash: "Decrease quantity",
    clearCashDenominations: "Clear denominations",
  },
  "zh-TW": {
    cashDenominations: "鈔票與硬幣面額",
    selectedCashDenomination: "目前面額",
    increaseCash: "增加數量",
    decreaseCash: "減少數量",
    clearCashDenominations: "清除面額",
  },
} as const;

const categoryMessages = {
  vi: {
    createCategory: "Tạo danh mục",
    editCategory: "Sửa danh mục",
    categoryName: "Tên danh mục",
    categoryNamePlaceholder: "Nhập tên danh mục",
    categoryList: "Danh sách danh mục",
    categorySortOrder: "Thứ tự hiển thị",
    recommended: "Gợi ý",
    popular: "Bán chạy",
    newProduct: "Món mới",
    promotion: "Đang giảm giá",
    emptyCategories: "Chưa có danh mục nào",
    save: "Lưu",
    savingCategory: "Đang lưu...",
    deletingCategory: "Đang xóa...",
    cancel: "Hủy",
    name: "Tên",
    actions: "Thao Tác",
    loading: "Đang tải...",
    requiredCategoryName: "Vui lòng nhập tên danh mục",
    confirmDeleteCategory: "Bạn có chắc muốn xóa danh mục này không?",
    createCategorySuccess: "Đã tạo danh mục",
    updateCategorySuccess: "Đã cập nhật danh mục",
    deleteCategorySuccess: "Đã xóa danh mục",
    categorySaveError: "Không thể lưu danh mục",
    categoryDeleteError: "Không thể xóa danh mục",
  },
  en: {
    createCategory: "Create category",
    editCategory: "Edit category",
    categoryName: "Category name",
    categoryNamePlaceholder: "Enter category name",
    categoryList: "Category list",
    categorySortOrder: "Display order",
    recommended: "Recommended",
    popular: "Popular",
    newProduct: "New",
    promotion: "On sale",
    emptyCategories: "No categories yet",
    save: "Save",
    savingCategory: "Saving...",
    deletingCategory: "Deleting...",
    cancel: "Cancel",
    name: "Name",
    actions: "Actions",
    loading: "Loading...",
    requiredCategoryName: "Please enter a category name",
    confirmDeleteCategory: "Are you sure you want to delete this category?",
    createCategorySuccess: "Category created",
    updateCategorySuccess: "Category updated",
    deleteCategorySuccess: "Category deleted",
    categorySaveError: "Unable to save category",
    categoryDeleteError: "Unable to delete category",
  },
  "zh-TW": {
    createCategory: "\u65b0\u589e\u5206\u985e",
    editCategory: "\u7de8\u8f2f\u5206\u985e",
    categoryName: "\u5206\u985e\u540d\u7a31",
    categoryNamePlaceholder: "\u8acb\u8f38\u5165\u5206\u985e\u540d\u7a31",
    categoryList: "\u5206\u985e\u6e05\u55ae",
    categorySortOrder: "\u986f\u793a\u9806\u5e8f",
    recommended: "\u63a8\u85a6",
    popular: "\u71b1\u9580",
    newProduct: "\u65b0\u54c1",
    promotion: "\u512a\u60e0\u4e2d",
    emptyCategories: "\u5c1a\u7121\u5206\u985e",
    save: "\u5132\u5b58",
    savingCategory: "\u5132\u5b58\u4e2d...",
    deletingCategory: "\u522a\u9664\u4e2d...",
    cancel: "\u53d6\u6d88",
    name: "\u540d\u7a31",
    actions: "\u64cd\u4f5c",
    loading: "\u8f09\u5165\u4e2d...",
    requiredCategoryName: "\u8acb\u8f38\u5165\u5206\u985e\u540d\u7a31",
    confirmDeleteCategory:
      "\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u5206\u985e\u55ce\uff1f",
    createCategorySuccess: "\u5206\u985e\u5df2\u5efa\u7acb",
    updateCategorySuccess: "\u5206\u985e\u5df2\u66f4\u65b0",
    deleteCategorySuccess: "\u5206\u985e\u5df2\u522a\u9664",
    categorySaveError: "\u7121\u6cd5\u5132\u5b58\u5206\u985e",
    categoryDeleteError: "\u7121\u6cd5\u522a\u9664\u5206\u985e",
  },
} as const;

const commonMessages = {
  vi: {
    confirm: "\u0058\u00e1c nh\u1eadn",
    confirmDeleteTitle: "\u0058\u00e1c nh\u1eadn x\u00f3a",
    confirmLogout:
      "B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n \u0111\u0103ng xu\u1ea5t kh\u00f4ng?",
  },
  en: {
    confirm: "Confirm",
    confirmDeleteTitle: "Confirm deletion",
    confirmLogout: "Are you sure you want to log out?",
  },
  "zh-TW": {
    confirm: "\u78ba\u5b9a",
    confirmDeleteTitle: "\u78ba\u5b9a\u522a\u9664",
    confirmLogout: "\u78ba\u5b9a\u8981\u767b\u51fa\u55ce\uff1f",
  },
} as const;

const addonMessages = {
  vi: {
    createAddon: "Tạo topping",
    editAddon: "Sửa topping",
    addonName: "Tên topping",
    addonNamePlaceholder: "Nhập tên topping",
    extraPrice: "Giá cộng thêm",
    addonList: "Danh sách topping",
    emptyAddons: "Chưa có topping nào",
    savingAddon: "Đang lưu...",
    deletingAddon: "Đang xóa...",
    requiredAddonName: "Vui lòng nhập tên topping",
    confirmDeleteAddon: "Bạn có chắc muốn xóa topping này không?",
    createAddonSuccess: "Đã tạo topping",
    updateAddonSuccess: "Đã cập nhật topping",
    deleteAddonSuccess: "Đã xóa topping",
    addonSaveError: "Không thể lưu topping",
    addonDeleteError: "Không thể xóa topping",
  },
  en: {
    createAddon: "Create addon",
    editAddon: "Edit addon",
    addonName: "Addon name",
    addonNamePlaceholder: "Enter addon name",
    extraPrice: "Extra price",
    addonList: "Addon list",
    emptyAddons: "No addons yet",
    savingAddon: "Saving...",
    deletingAddon: "Deleting...",
    requiredAddonName: "Please enter an addon name",
    confirmDeleteAddon: "Are you sure you want to delete this addon?",
    createAddonSuccess: "Addon created",
    updateAddonSuccess: "Addon updated",
    deleteAddonSuccess: "Addon deleted",
    addonSaveError: "Unable to save addon",
    addonDeleteError: "Unable to delete addon",
  },
  "zh-TW": {
    createAddon: "\u65b0\u589e\u914d\u6599",
    editAddon: "\u7de8\u8f2f\u914d\u6599",
    addonName: "\u914d\u6599\u540d\u7a31",
    addonNamePlaceholder: "\u8acb\u8f38\u5165\u914d\u6599\u540d\u7a31",
    extraPrice: "\u52a0\u50f9",
    addonList: "\u914d\u6599\u6e05\u55ae",
    emptyAddons: "\u5c1a\u7121\u914d\u6599",
    savingAddon: "\u5132\u5b58\u4e2d...",
    deletingAddon: "\u522a\u9664\u4e2d...",
    requiredAddonName: "\u8acb\u8f38\u5165\u914d\u6599\u540d\u7a31",
    confirmDeleteAddon:
      "\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u914d\u6599\u55ce\uff1f",
    createAddonSuccess: "\u914d\u6599\u5df2\u5efa\u7acb",
    updateAddonSuccess: "\u914d\u6599\u5df2\u66f4\u65b0",
    deleteAddonSuccess: "\u914d\u6599\u5df2\u522a\u9664",
    addonSaveError: "\u7121\u6cd5\u5132\u5b58\u914d\u6599",
    addonDeleteError: "\u7121\u6cd5\u522a\u9664\u914d\u6599",
  },
} as const;

const promotionMessages = {
  vi: {
    createDiscount: "Tạo khuyến mãi",
    editDiscount: "Sửa khuyến mãi",
    discountNamePlaceholder: "Nhập tên khuyến mãi",
    discountType: "Loại",
    discountPercent: "Phần trăm",
    discountValue: "Số tiền",
    discountAmount: "Giá trị",
    discountNote: "Ghi chú",
    discountNotePlaceholder: "Nhập ghi chú",
    discountActive: "Đang áp dụng",
    discountList: "Danh sách khuyến mãi",
    emptyDiscounts: "Chưa có khuyến mãi nào",
    currency: "₫",
    savingDiscount: "Đang lưu...",
    deletingDiscount: "Đang xóa...",
    requiredDiscountName: "Vui lòng nhập tên khuyến mãi",
    confirmDeleteDiscount: "Bạn có chắc muốn xóa khuyến mãi này không?",
    createDiscountSuccess: "Đã tạo khuyến mãi",
    updateDiscountSuccess: "Đã cập nhật khuyến mãi",
    deleteDiscountSuccess: "Đã xóa khuyến mãi",
    discountSaveError: "Không thể lưu khuyến mãi",
    discountDeleteError: "Không thể xóa khuyến mãi",
  },
  en: {
    createDiscount: "Create discount",
    editDiscount: "Edit discount",
    discountNamePlaceholder: "Enter discount name",
    discountType: "Type",
    discountPercent: "Percentage",
    discountValue: "Fixed amount",
    discountAmount: "Value",
    discountNote: "Note",
    discountNotePlaceholder: "Enter a note",
    discountActive: "Active",
    discountList: "Discount list",
    emptyDiscounts: "No discounts yet",
    currency: "",
    savingDiscount: "Saving...",
    deletingDiscount: "Deleting...",
    requiredDiscountName: "Please enter a discount name",
    confirmDeleteDiscount: "Are you sure you want to delete this discount?",
    createDiscountSuccess: "Discount created",
    updateDiscountSuccess: "Discount updated",
    deleteDiscountSuccess: "Discount deleted",
    discountSaveError: "Unable to save discount",
    discountDeleteError: "Unable to delete discount",
  },
  "zh-TW": {
    createDiscount: "\u65b0\u589e\u512a\u60e0",
    editDiscount: "\u7de8\u8f2f\u512a\u60e0",
    discountNamePlaceholder: "\u8acb\u8f38\u5165\u512a\u60e0\u540d\u7a31",
    discountType: "\u985e\u578b",
    discountPercent: "\u767e\u5206\u6bd4",
    discountValue: "\u91d1\u984d",
    discountAmount: "\u6578\u503c",
    discountNote: "\u5099\u8a3b",
    discountNotePlaceholder: "\u8acb\u8f38\u5165\u5099\u8a3b",
    discountActive: "\u555f\u7528\u4e2d",
    discountList: "\u512a\u60e0\u6e05\u55ae",
    emptyDiscounts: "\u5c1a\u7121\u512a\u60e0",
    currency: "\u5143",
    savingDiscount: "\u5132\u5b58\u4e2d...",
    deletingDiscount: "\u522a\u9664\u4e2d...",
    requiredDiscountName: "\u8acb\u8f38\u5165\u512a\u60e0\u540d\u7a31",
    confirmDeleteDiscount:
      "\u78ba\u5b9a\u8981\u522a\u9664\u6b64\u512a\u60e0\u55ce\uff1f",
    createDiscountSuccess: "\u512a\u60e0\u5df2\u5efa\u7acb",
    updateDiscountSuccess: "\u512a\u60e0\u5df2\u66f4\u65b0",
    deleteDiscountSuccess: "\u512a\u60e0\u5df2\u522a\u9664",
    discountSaveError: "\u7121\u6cd5\u5132\u5b58\u512a\u60e0",
    discountDeleteError: "\u7121\u6cd5\u522a\u9664\u512a\u60e0",
  },
} as const;

const extraMessages = {
  vi: {
    productImage: "Ảnh sản phẩm",
    chooseImage: "Chọn ảnh",
    imageUploadHint:
      "Nên dùng ảnh vuông tỉ lệ 1:1, ví dụ 800×800 px (tối đa 10 MB)",
    uploadingImage: "Đang tải ảnh lên...",
    removeImage: "Xóa ảnh",
    imageUploadError: "Không thể tải ảnh lên",
    createProduct: "Tạo sản phẩm",
    editProduct: "Sửa sản phẩm",
    productName: "Tên sản phẩm",
    productType: "Loại sản phẩm",
    regularProduct: "Sản phẩm thường",
    comboProduct: "Combo",
    comboComponents: "Sản phẩm thành phần",
    chooseCategory: "Chọn danh mục",
    variants: "Biến thể",
    commaSeparated: "(phân cách bằng dấu phẩy)",
    notes: "Ghi chú món",
    variantPlaceholder: "Nhỏ, Vừa, Lớn",
    notePlaceholder: "Ít cay, Không hành",
    saving: "Đang lưu...",
    update: "Cập nhật",
    cancel: "Hủy",
    productList: "Danh sách sản phẩm",
    name: "Tên",
    price: "Giá cơ bản",
    status: "Trạng thái",
    actions: "Thao Tác",
    loading: "Đang tải...",
    hidden: "Tạm ẩn",
    edit: "Sửa",
    delete: "Xóa",
    validationProduct: "Vui lòng nhập tên và danh mục",
    saveError: "Không thể lưu sản phẩm",
    createSuccess: "Đã tạo sản phẩm",
    updateSuccess: "Đã cập nhật sản phẩm",
    deleteSuccess: "Đã xóa sản phẩm",
    deleteError: "Không thể xóa sản phẩm",
  },
  en: {
    productImage: "Product image",
    chooseImage: "Choose image",
    imageUploadHint:
      "Use a square 1:1 image, for example 800×800 px (max 10 MB)",
    uploadingImage: "Uploading image...",
    removeImage: "Remove image",
    imageUploadError: "Unable to upload image",
    createProduct: "Create product",
    editProduct: "Edit product",
    productName: "Product name",
    productType: "Product type",
    regularProduct: "Regular product",
    comboProduct: "Combo",
    comboComponents: "Component products",
    chooseCategory: "Choose category",
    variants: "Variants",
    commaSeparated: "(comma separated)",
    notes: "Item notes",
    variantPlaceholder: "Small, Medium, Large",
    notePlaceholder: "Less spicy, No onion",
    saving: "Saving...",
    update: "Update",
    cancel: "Cancel",
    productList: "Product list",
    name: "Name",
    price: "Base price",
    status: "Status",
    actions: "Actions",
    loading: "Loading...",
    hidden: "Hidden",
    edit: "Edit",
    delete: "Delete",
    validationProduct: "Please enter a product name and category",
    saveError: "Unable to save product",
    createSuccess: "Product created",
    updateSuccess: "Product updated",
    deleteSuccess: "Product deleted",
    deleteError: "Unable to delete product",
  },
  "zh-TW": {
    productImage: "商品圖片",
    chooseImage: "選擇圖片",
    imageUploadHint: "建議使用 1:1 方形圖片，例如 800×800 像素（最大 10 MB）",
    uploadingImage: "圖片上傳中...",
    removeImage: "移除圖片",
    imageUploadError: "圖片上傳失敗",
    createProduct: "\u65b0\u589e\u5546\u54c1",
    editProduct: "\u7de8\u8f2f\u5546\u54c1",
    productName: "\u5546\u54c1\u540d\u7a31",
    productType: "商品類型",
    regularProduct: "一般商品",
    comboProduct: "套餐",
    comboComponents: "套餐組成商品",
    chooseCategory: "\u9078\u64c7\u5206\u985e",
    variants: "\u898f\u683c",
    commaSeparated: "(\u8acb\u4ee5\u9017\u865f\u5206\u9694)",
    notes: "\u5546\u54c1\u5099\u8a3b",
    variantPlaceholder: "\u5c0f\u3001\u4e2d\u3001\u5927",
    notePlaceholder: "\u5c11\u8fa3\u3001\u4e0d\u8981\u8525",
    saving: "\u5132\u5b58\u4e2d...",
    update: "\u66f4\u65b0",
    cancel: "\u53d6\u6d88",
    productList: "\u5546\u54c1\u6e05\u55ae",
    name: "\u540d\u7a31",
    price: "\u57fa\u672c\u50f9\u683c",
    status: "\u72c0\u614b",
    actions: "\u64cd\u4f5c",
    loading: "\u8f09\u5165\u4e2d...",
    hidden: "\u96b1\u85cf",
    edit: "\u7de8\u8f2f",
    delete: "\u522a\u9664",
    validationProduct:
      "\u8acb\u8f38\u5165\u5546\u54c1\u540d\u7a31\u548c\u5206\u985e",
    saveError: "\u7121\u6cd5\u5132\u5b58\u5546\u54c1",
    createSuccess: "\u5546\u54c1\u5df2\u5efa\u7acb",
    updateSuccess: "\u5546\u54c1\u5df2\u66f4\u65b0",
    deleteSuccess: "\u5546\u54c1\u5df2\u522a\u9664",
    deleteError: "\u7121\u6cd5\u522a\u9664\u5546\u54c1",
  },
} as const;

const storeProductMessages = {
  vi: {
    storePricing: "Giá bán theo cửa hàng",
    mainStore: "Cửa hàng chính",
    store: "Cửa hàng",
    overview: "Tổng hợp",
    commonConfig: "Cấu hình chung",
    currentStoreGroup: "Store hiện tại",
    switchStore: "Chuyển cửa hàng",
    overviewHint: "Xem dữ liệu tổng hợp của các cửa hàng.",
    overviewDescription: "Tổng quan doanh thu, chi phí và kết toán toàn hệ thống.",
    overviewFrom: "Từ",
    overviewTo: "Đến",
    overviewStores: "Cửa hàng hoạt động",
    overviewRevenue: "Tổng thu",
    overviewExpenses: "Tổng chi",
    overviewProfit: "Lợi nhuận tạm tính",
    overviewOrders: "Tổng đơn hàng",
    overviewByStore: "Tổng hợp theo cửa hàng",
    overviewStore: "Cửa hàng",
    overviewDifference: "Chênh lệch kết toán",
    overviewClosingStatus: "Trạng thái kết toán",
    overviewHasClosing: "Đã có kết toán",
    overviewNoClosing: "Chưa kết toán",
    overviewLoadError: "Không thể tải dữ liệu tổng hợp",
    overviewDetailsTitle: "Chi tiết",
    overviewRevenueInfo: "Xem chi tiết tổng thu",
    overviewExpensesInfo: "Xem chi tiết tổng chi",
    overviewProfitInfo: "Xem cách tính lợi nhuận",
    overviewOrdersInfo: "Xem chi tiết đơn hàng",
    overviewDifferenceInfo: "Xem chi tiết chênh lệch",
    overviewOrderRevenue: "Thu từ đơn hàng",
    overviewPaymentBreakdown: "Theo phương thức thanh toán",
    overviewOtherRevenue: "Thu nhập khác",
    overviewInventoryExpenses: "Chi mua hàng tồn kho",
    overviewOtherExpenses: "Chi phí khác",
    overviewProfitCalculation: "Lợi nhuận (thu - chi)",
    overviewPaidOrders: "Đơn đã thanh toán",
    overviewClosingCount: "Số lần kết toán",
    discountStoreHint: "Đang cấu hình discount cho cửa hàng đã chọn.",
    discountCatalogHint:
      "Super Admin quản lý discount dùng chung; Admin chỉ cấu hình theo cửa hàng.",
    discountStoreConfig: "Cấu hình discount theo cửa hàng",
    discountAdminSelectExisting: "Admin chỉ được chỉnh discount đã tạo sẵn.",
    superAdminOnly: "Chỉ Super Admin được quản lý catalog chung",
    catalogSuperAdminHint:
      "Admin chỉ cấu hình giá và trạng thái trong phần giá theo cửa hàng.",
    storeRequired: "Vui lòng chọn cửa hàng.",
  },
  en: {
    storePricing: "Store-specific pricing",
    mainStore: "Main store",
    store: "Store",
    overview: "Overview",
    commonConfig: "Shared configuration",
    currentStoreGroup: "Current store",
    switchStore: "Switch store",
    overviewHint: "View aggregated data across stores.",
    overviewDescription: "System-wide revenue, expenses, and closing overview.",
    overviewFrom: "From",
    overviewTo: "To",
    overviewStores: "Active stores",
    overviewRevenue: "Total revenue",
    overviewExpenses: "Total expenses",
    overviewProfit: "Estimated profit",
    overviewOrders: "Total orders",
    overviewByStore: "Summary by store",
    overviewStore: "Store",
    overviewDifference: "Closing difference",
    overviewClosingStatus: "Closing status",
    overviewHasClosing: "Closing recorded",
    overviewNoClosing: "No closing",
    overviewLoadError: "Unable to load overview data",
    overviewDetailsTitle: "Details",
    overviewRevenueInfo: "View revenue details",
    overviewExpensesInfo: "View expense details",
    overviewProfitInfo: "View profit calculation",
    overviewOrdersInfo: "View order details",
    overviewDifferenceInfo: "View difference details",
    overviewOrderRevenue: "Order revenue",
    overviewPaymentBreakdown: "By payment method",
    overviewOtherRevenue: "Other revenue",
    overviewInventoryExpenses: "Inventory purchases",
    overviewOtherExpenses: "Other expenses",
    overviewProfitCalculation: "Profit (revenue - expenses)",
    overviewPaidOrders: "Paid orders",
    overviewClosingCount: "Number of closings",
    discountStoreHint: "Configuring the discount for the selected store.",
    discountCatalogHint:
      "Super Admin manages shared discounts; Admin only configures them per store.",
    discountStoreConfig: "Store discount configuration",
    discountAdminSelectExisting: "Admins can only edit existing discounts.",
    superAdminOnly: "Only Super Admin can manage the shared catalog",
    catalogSuperAdminHint:
      "Admins can only configure prices and availability in store pricing.",
    storeRequired: "Please select a store.",
  },
  "zh-TW": {
    storePricing: "分店售價",
    mainStore: "主店",
    store: "分店",
    overview: "總覽",
    commonConfig: "共用設定",
    currentStoreGroup: "目前分店",
    switchStore: "切換分店",
    overviewHint: "查看所有分店的彙總資料。",
    overviewDescription: "查看整個系統的收入、支出與結算概況。",
    overviewFrom: "從",
    overviewTo: "到",
    overviewStores: "啟用中的分店",
    overviewRevenue: "總收入",
    overviewExpenses: "總支出",
    overviewProfit: "預估利潤",
    overviewOrders: "訂單總數",
    overviewByStore: "分店摘要",
    overviewStore: "分店",
    overviewDifference: "結算差異",
    overviewClosingStatus: "結算狀態",
    overviewHasClosing: "已有結算",
    overviewNoClosing: "尚未結算",
    overviewLoadError: "無法載入總覽資料",
    overviewDetailsTitle: "詳細資料",
    overviewRevenueInfo: "查看收入詳情",
    overviewExpensesInfo: "查看支出詳情",
    overviewProfitInfo: "查看利潤計算",
    overviewOrdersInfo: "查看訂單詳情",
    overviewDifferenceInfo: "查看差異詳情",
    overviewOrderRevenue: "訂單收入",
    overviewPaymentBreakdown: "依付款方式",
    overviewOtherRevenue: "其他收入",
    overviewInventoryExpenses: "庫存採購",
    overviewOtherExpenses: "其他支出",
    overviewProfitCalculation: "利潤（收入 - 支出）",
    overviewPaidOrders: "已付款訂單",
    overviewClosingCount: "結算次數",
    discountStoreHint: "正在設定所選分店的折扣。",
    discountCatalogHint: "Super Admin 管理共用折扣；Admin 僅能設定分店折扣。",
    discountStoreConfig: "分店折扣設定",
    discountAdminSelectExisting: "Admin 只能編輯已建立的折扣。",
    superAdminOnly: "只有 Super Admin 可以管理共用目錄",
    catalogSuperAdminHint: "Admin 只能在分店售價中設定價格與販售狀態。",
    storeRequired: "請先選擇分店。",
  },
} as const;

const availabilityMessages = {
  vi: {
    permanentSelling: "Đang bán",
    permanentHidden: "Tắt hẳn",
    temporaryUnavailable: "Tạm tắt",
    temporaryUnavailableShort: "Tạm dừng",
    selectionUnavailable:
      "Món hoặc topping vừa tạm dừng bán. Vui lòng bỏ lựa chọn này trước khi tiếp tục.",
    discountUnavailable: "Khuyến mãi vừa được tắt và đã được bỏ khỏi đơn.",
    temporaryAvailable: "Đang bán",
    temporaryAvailability: "Tắt tạm thời món",
    temporaryAvailabilityTitle: "Tắt tạm thời món",
    temporaryAvailabilitySearch: "Tìm tên món...",
    temporaryAvailabilityCategory: "Lọc theo danh mục",
    temporaryAvailabilityAllCategories: "Tất cả danh mục",
    temporaryAvailabilityEmpty: "Không tìm thấy món",
    temporaryAvailabilityError: "Không thể cập nhật trạng thái tạm thời",
  },
  en: {
    permanentSelling: "Selling",
    permanentHidden: "Permanently off",
    temporaryUnavailable: "Temporarily off",
    temporaryUnavailableShort: "Paused",
    selectionUnavailable:
      "This product or add-on was just paused. Remove it before continuing.",
    discountUnavailable:
      "This discount was just disabled and has been removed from the order.",
    temporaryAvailable: "Temporarily available",
    temporaryAvailability: "Pause items",
    temporaryAvailabilityTitle: "Pause items",
    temporaryAvailabilitySearch: "Search item name...",
    temporaryAvailabilityCategory: "Filter by category",
    temporaryAvailabilityAllCategories: "All categories",
    temporaryAvailabilityEmpty: "No items found",
    temporaryAvailabilityError: "Unable to update temporary availability",
  },
  "zh-TW": {
    permanentSelling: "販售中",
    permanentHidden: "永久關閉",
    temporaryUnavailable: "暫時關閉",
    temporaryUnavailableShort: "暫停",
    selectionUnavailable: "此商品或加料剛剛暫停販售，請移除後再繼續。",
    discountUnavailable: "此優惠剛剛已停用，已從訂單中移除。",
    temporaryAvailable: "暫時可售",
    temporaryAvailability: "暫時關閉商品",
    temporaryAvailabilityTitle: "暫時關閉商品",
    temporaryAvailabilitySearch: "搜尋商品名稱...",
    temporaryAvailabilityCategory: "依分類篩選",
    temporaryAvailabilityAllCategories: "所有分類",
    temporaryAvailabilityEmpty: "找不到商品",
    temporaryAvailabilityError: "無法更新暫時狀態",
  },
} as const;

Object.assign(
  promotionMessages.vi as Record<string, string>,
  availabilityMessages.vi,
);
Object.assign(
  promotionMessages.en as Record<string, string>,
  availabilityMessages.en,
);
Object.assign(
  promotionMessages["zh-TW"] as Record<string, string>,
  availabilityMessages["zh-TW"],
);

const productActionMessages = {
  vi: {
    copy: "Sao chép",
    allCategories: "Tất cả danh mục",
    productTotal: "Tổng sản phẩm",
    posAddItem: "Thêm món",
    posEditItem: "Chỉnh sửa món",
    cancelPosItemBeforeCategory:
      "Vui lòng hủy thao tác hiện tại trước khi chuyển danh mục",
    confirmCreateProduct: "Bạn có chắc muốn tạo sản phẩm này không?",
    confirmUpdateProduct: "Bạn có chắc muốn cập nhật sản phẩm này không?",
    confirmDeleteProduct: "Bạn có chắc muốn xóa sản phẩm này không?",
  },
  en: {
    copy: "Copy",
    allCategories: "All categories",
    productTotal: "Total products",
    posAddItem: "Add item",
    posEditItem: "Edit item",
    cancelPosItemBeforeCategory:
      "Please cancel the current action before switching categories",
    confirmCreateProduct: "Are you sure you want to create this product?",
    confirmUpdateProduct: "Are you sure you want to update this product?",
    confirmDeleteProduct: "Are you sure you want to delete this product?",
  },
  "zh-TW": {
    copy: "複製",
    allCategories: "所有分類",
    productTotal: "商品總數",
    posAddItem: "新增商品",
    posEditItem: "編輯商品",
    cancelPosItemBeforeCategory: "切換分類前請先取消目前的操作",
    confirmCreateProduct: "確定要建立此商品嗎？",
    confirmUpdateProduct: "確定要更新此商品嗎？",
    confirmDeleteProduct: "確定要刪除此商品嗎？",
  },
} as const;

const productDescriptionMessages = {
  vi: {
    description: "Mô tả món ăn",
    descriptionPlaceholder: "Mô tả thành phần hoặc đặc điểm món ăn",
  },
  en: {
    description: "Description",
    descriptionPlaceholder: "Describe the ingredients or dish details",
  },
  "zh-TW": {
    description: "商品描述",
    descriptionPlaceholder: "描述食材或商品特色",
  },
} as const;

const orderMessages: Record<Locale, Record<string, string>> = {
  vi: {
    allOrders: "Tất cả",
    pendingPayment: "Chờ thanh toán",
    paidOrders: "Đã thanh toán",
    cancelledOrders: "Đã hủy",
    orderStatusPending: "Chờ thanh toán",
    orderStatusPaid: "Đã thanh toán",
    orderStatusCancelled: "Đã hủy",
    orderStatusFilter: "Lọc theo trạng thái",
  },
  en: {
    allOrders: "All",
    pendingPayment: "Pending payment",
    paidOrders: "Paid",
    cancelledOrders: "Cancelled",
    orderStatusPending: "Pending payment",
    orderStatusPaid: "Paid",
    orderStatusCancelled: "Cancelled",
    orderStatusFilter: "Filter by status",
  },
  "zh-TW": {
    allOrders: "全部",
    pendingPayment: "待付款",
    paidOrders: "已付款",
    cancelledOrders: "已取消",
    orderStatusPending: "待付款",
    orderStatusPaid: "已付款",
    orderStatusCancelled: "已取消",
    orderStatusFilter: "依狀態篩選",
  },
} as const;

Object.assign(orderMessages.vi, {
  adminOrdersTitle: "Đơn Hàng",
  adminOrdersTotal: "Tổng số",
  adminOrdersTime: "Thời gian",
  adminOrdersView: "Xem",
  adminOrdersNoData: "Chưa có đơn hàng",
  adminOrdersLoadError: "Không thể tải danh sách đơn hàng",
});
Object.assign(orderMessages.en, {
  adminOrdersTitle: "Orders",
  adminOrdersTotal: "Total",
  adminOrdersTime: "Time",
  adminOrdersView: "View",
  adminOrdersNoData: "No orders found",
  adminOrdersLoadError: "Unable to load orders",
});
Object.assign(orderMessages["zh-TW"], {
  adminOrdersTitle: "訂單",
  adminOrdersTotal: "總數",
  adminOrdersTime: "時間",
  adminOrdersView: "查看",
  adminOrdersNoData: "暫無訂單",
  adminOrdersLoadError: "無法載入訂單",
});

const orderErrorMessages = {
  vi: {
    cancelClosedPeriod:
      "Không thể hủy: đơn hàng đã thuộc kỳ kết toán và dữ liệu đã bị khóa.",
    cancelAlreadyCancelled: "Đơn hàng này đã được hủy trước đó.",
    cancelNotFound: "Không tìm thấy đơn hàng.",
    itemNotAvailable:
      "Sản phẩm đã tạm dừng bán. Vui lòng bỏ món này trước khi tiếp tục.",
    itemStoreConfigNotFound: "Sản phẩm chưa được cấu hình cho cửa hàng hiện tại.",
    itemCatalogNotFound: "Sản phẩm không còn tồn tại trong danh mục.",
    itemPriceNotConfigured: "Sản phẩm chưa có giá cơ bản hợp lệ cho loại đơn này.",
    addonNotAvailable:
      "Topping đã tạm dừng bán. Vui lòng bỏ topping này trước khi tiếp tục.",
    itemQuantityInvalid: "Số lượng sản phẩm không hợp lệ.",
    addonQuantityInvalid: "Mỗi topping chỉ được chọn một lần cho một món.",
    invalidOption: "Một hoặc nhiều lựa chọn món không còn hợp lệ.",
  },
  en: {
    cancelClosedPeriod:
      "Cannot cancel: this order belongs to a closed period and is locked.",
    cancelAlreadyCancelled: "This order has already been cancelled.",
    cancelNotFound: "Order not found.",
    itemNotAvailable: "This product was paused. Remove it before continuing.",
    itemStoreConfigNotFound: "This product is not configured for the current store.",
    itemCatalogNotFound: "This product no longer exists in the catalog.",
    itemPriceNotConfigured: "This product has no valid base price for this order type.",
    addonNotAvailable: "This add-on was paused. Remove it before continuing.",
    itemQuantityInvalid: "One or more product quantities are invalid.",
    addonQuantityInvalid: "An add-on can only be selected once per item.",
    invalidOption: "One or more selected options are no longer valid.",
  },
  "zh-TW": {
    cancelClosedPeriod:
      "\u7121\u6cd5\u53d6\u6d88\uff1a\u6b64\u8a02\u55ae\u5c6c\u65bc\u5df2\u7d50\u7b97\u671f\u9593\u4e14\u5df2\u9396\u5b9a\u3002",
    cancelAlreadyCancelled: "\u6b64\u8a02\u55ae\u5df2\u53d6\u6d88\u3002",
    cancelNotFound: "\u627e\u4e0d\u5230\u8a02\u55ae\u3002",
    itemNotAvailable:
      "\u6b64\u5546\u54c1\u5df2\u66ab\u505c\u8ca9\u552e\uff0c\u8acb\u79fb\u9664\u5f8c\u518d\u7e7c\u7e8c\u3002",
    itemStoreConfigNotFound: "\u6b64\u5546\u54c1\u5c1a\u672a\u70ba\u7576\u524d\u5e97\u92ea\u8a2d\u5b9a\u3002",
    itemCatalogNotFound: "\u6b64\u5546\u54c1\u5df2\u4e0d\u5b58\u5728\u65bc\u5546\u54c1\u76ee\u9304\u4e2d\u3002",
    itemPriceNotConfigured: "\u6b64\u5546\u54c1\u6c92\u6709\u9069\u7528\u65bc\u6b64\u8a02\u55ae\u985e\u578b\u7684\u6709\u6548\u57fa\u672c\u50f9\u683c\u3002",
    addonNotAvailable:
      "\u6b64\u52a0\u6599\u5df2\u66ab\u505c\u8ca9\u552e\uff0c\u8acb\u79fb\u9664\u5f8c\u518d\u7e7c\u7e8c\u3002",
    itemQuantityInvalid: "\u5546\u54c1\u6578\u91cf\u7121\u6548\u3002",
    addonQuantityInvalid: "\u6bcf\u500b\u5546\u54c1\u7684\u52a0\u6599\u53ea\u80fd\u9078\u64c7\u4e00\u6b21\u3002",
    invalidOption: "\u4e00\u6216\u591a\u500b\u9078\u9805\u5df2\u7121\u6548\u3002",
  },
} as const;

const posMessages: Record<Locale, Record<string, string>> = {
  vi: {
    fullscreenOn: "Mở toàn màn hình",
    fullscreenOff: "Tắt toàn màn hình",
    orderNumber: "Mã đơn",
    total: "Tổng tiền",
    order: "Đơn hàng",
    placeOrder: "Đặt hàng",
    pay: "Thanh toán",
    otherRevenue: "Thu nhập khác",
    expenses: "Bảng chi phí",
    attendance: "Chấm Công",
    dailyClosing: "Kết Sổ",
    logout: "Đăng xuất",
    orderTableTitle: "Bảng Đơn hàng",
    orderNumberHeader: "Mã Đơn",
    totalItems: "Tổng SP",
    totalAmount: "Tổng tiền",
    status: "Trạng thái",
    orderSource: "Nguồn đơn",
    orderSourcePos: "POS",
    orderSourceQr: "QR tại bàn",
    orderSourceOnline: "Đặt hàng online",
    orderType: "Loại Đơn",
    paymentMethod: "Phương thức",
    time: "Thời gian",
    detail: "Chi tiết",
    print: "In",
    cancelOrder: "Hủy Đơn",
    confirmCancelOrder: "Bạn có chắc muốn hủy đơn hàng này không?",
    cancel: "Hủy",
    confirm: "Xác nhận",
    cancelling: "Đang hủy...",
    cancelSuccess: "Hủy thành công",
    cancelFailure: "Hủy thất bại",
    cancelClosedPeriod:
      "Không thể hủy: đơn hàng đã thuộc kỳ kết toán và dữ liệu đã bị khóa.",
    cancelAlreadyCancelled: "Đơn hàng này đã được hủy trước đó.",
    cancelNotFound: "Không tìm thấy đơn hàng.",
    ordersCount: "đơn hàng",
    page: "Trang",
    previous: "Trước",
    next: "Sau",
    noOrdersFound: "Không tìm thấy đơn hàng",
    today: "Hôm nay",
    days: "3 ngày",
    week: "1 tuần",
    searchOrder: "Tìm theo mã đơn...",
    clear: "Xóa",
    discount: "Giảm giá",
    paymentMethodTitle: "Phương thức thanh toán",
    pickupTime: "Thời gian nhận món",
    paymentShort: "Thanh toán",
    cashGiven: "Số tiền khách đưa",
    cashBack: "Số tiền trả lại khách",
    printOnConfirm: "In khi xác nhận",
    createOrderFailure: "Tạo đơn không thành công",
    insufficientCash: "Tiền khách đưa chưa đủ",
    paidSuccess: "Thanh toán thành công",
    pendingSuccess: "Đặt hàng thành công",
    pendingOrderInfo: "Thông tin đặt hàng",
    customerName: "Tên người đặt",
    phone: "Số điện thoại",
    quantity: "Số lượng",
    variant: "Loại",
    noAddons: "Không thêm",
    addons: "Thêm",
    note: "Ghi chú",
    customer: "Tên khách",
    payment: "Hình thức thanh toán",
    updateFailure: "Cập nhật không thành công",
    updateSuccess: "Cập nhật đơn hàng thành công",
    noProductsToOrder: "Không có sản phẩm đặt hàng",
    noProductsToPay: "Không có sản phẩm thanh toán",
  },
  en: {
    fullscreenOn: "Enter fullscreen",
    fullscreenOff: "Exit fullscreen",
    orderNumber: "Order number",
    total: "Total",
    order: "Order",
    placeOrder: "Place order",
    pay: "Pay",
    otherRevenue: "Other revenue",
    expenses: "Expenses",
    attendance: "Attendance",
    dailyClosing: "Daily closing",
    logout: "Log out",
    orderTableTitle: "Order table",
    orderNumberHeader: "Order no.",
    totalItems: "Total items",
    totalAmount: "Total amount",
    status: "Status",
    orderSource: "Order source",
    orderSourcePos: "POS",
    orderSourceQr: "Table QR",
    orderSourceOnline: "Online order",
    orderType: "Order type",
    paymentMethod: "Payment method",
    time: "Time",
    detail: "Details",
    print: "Print",
    cancelOrder: "Cancel order",
    confirmCancelOrder: "Are you sure you want to cancel this order?",
    cancel: "Cancel",
    confirm: "Confirm",
    cancelling: "Cancelling...",
    cancelSuccess: "Order cancelled",
    cancelFailure: "Failed to cancel order",
    cancelClosedPeriod:
      "Cannot cancel: this order belongs to a closed period and is locked.",
    cancelAlreadyCancelled: "This order has already been cancelled.",
    cancelNotFound: "Order not found.",
    ordersCount: "orders",
    page: "Page",
    previous: "Previous",
    next: "Next",
    noOrdersFound: "No orders found",
    today: "Today",
    days: "3 days",
    week: "1 week",
    searchOrder: "Search by order number...",
    clear: "Clear",
    discount: "Discount",
    paymentMethodTitle: "Payment method",
    pickupTime: "Pickup time",
    paymentShort: "Payment",
    cashGiven: "Cash received",
    cashBack: "Change",
    printOnConfirm: "Print on confirmation",
    createOrderFailure: "Failed to create order",
    insufficientCash: "Insufficient cash",
    paidSuccess: "Payment successful",
    pendingSuccess: "Order placed successfully",
    pendingOrderInfo: "Order information",
    customerName: "Customer name",
    phone: "Phone number",
    quantity: "Quantity",
    variant: "Variant",
    noAddons: "Without",
    addons: "Add-ons",
    note: "Note",
    customer: "Customer name",
    payment: "Payment method",
    updateFailure: "Failed to update order",
    updateSuccess: "Order updated successfully",
    noProductsToOrder: "No products to place an order",
    noProductsToPay: "No products to pay for",
  },
  "zh-TW": {
    fullscreenOn: "進入全螢幕",
    fullscreenOff: "離開全螢幕",
    orderNumber: "訂單編號",
    total: "總金額",
    order: "訂單",
    placeOrder: "預約",
    pay: "結帳",
    otherRevenue: "其他收入",
    expenses: "支出明細",
    attendance: "出勤",
    dailyClosing: "日結",
    logout: "登出",
    orderTableTitle: "訂單列表",
    orderNumberHeader: "訂單編號",
    totalItems: "商品總數",
    totalAmount: "總金額",
    status: "狀態",
    orderSource: "訂單來源",
    orderSourcePos: "POS",
    orderSourceQr: "桌邊 QR",
    orderSourceOnline: "線上點餐",
    orderType: "訂單類型",
    paymentMethod: "付款方式",
    time: "時間",
    detail: "詳情",
    print: "列印",
    cancelOrder: "取消訂單",
    confirmCancelOrder: "確定要取消此訂單嗎？",
    cancel: "取消",
    confirm: "確認",
    cancelling: "取消中...",
    cancelSuccess: "訂單已取消",
    cancelFailure: "取消訂單失敗",
    ordersCount: "筆訂單",
    page: "頁",
    previous: "上一頁",
    next: "下一頁",
    noOrdersFound: "找不到訂單",
    today: "今天",
    days: "3天",
    week: "1週",
    searchOrder: "依訂單編號搜尋...",
    clear: "清除",
    discount: "折扣",
    paymentMethodTitle: "付款方式",
    pickupTime: "取餐時間",
    paymentShort: "付款",
    cashGiven: "客人付款",
    cashBack: "找零",
    printOnConfirm: "確認時列印",
    createOrderFailure: "建立訂單失敗",
    insufficientCash: "客人付款金額不足",
    paidSuccess: "付款成功",
    pendingSuccess: "下單成功",
    pendingOrderInfo: "訂單資訊",
    customerName: "訂購人姓名",
    phone: "電話",
    quantity: "數量",
    variant: "類型",
    noAddons: "不要加",
    addons: "加料",
    note: "備註",
    customer: "客戶姓名",
    payment: "付款方式",
    updateFailure: "更新訂單失敗",
    updateSuccess: "訂單更新成功",
    noProductsToOrder: "沒有可下單的商品",
    noProductsToPay: "沒有可付款的商品",
  },
} as const;

Object.assign(posMessages.vi, {
  orderDetailTitle: "Chi tiết đơn",
  promotionDetails: "Chi tiết khuyến mại",
  noPromotion: "Chưa áp dụng khuyến mại",
  close: "Đóng",
  addonPrice: "Giá thêm",
  optionsSelected: "Tùy chọn",
  presetNotes: "Ghi chú chọn sẵn",
  checkoutBreakdown: "Chi tiết thanh toán",
  checkoutBreakdownHint: "Xem giá gốc và các khoản giảm giá",
  itemDiscountTotal: "Giảm theo món",
  afterItemDiscount: "Sau giảm theo món",
  orderDiscount: "Giảm toàn đơn",
  originalPrice: "Giá gốc",
  productSubtotal: "Tiền sản phẩm",
  addonSubtotal: "Tiền topping",
  subtotal: "Tạm tính",
  totalDiscount: "Tổng giảm giá",
  amountDue: "Cần thanh toán",
  orderItems: "Các món trong đơn",
  noDiscountApplied: "Chưa áp dụng khuyến mãi",
  promotionPriceChanged:
    "Khuyến mại hoặc giá vừa thay đổi. Vui lòng kiểm tra lại và thực hiện thanh toán lần nữa.",
});
Object.assign(posMessages.en, {
  orderDetailTitle: "Order details",
  promotionDetails: "Promotion details",
  noPromotion: "No promotion applied",
  close: "Close",
  addonPrice: "Extra",
  optionsSelected: "Options",
  presetNotes: "Preset notes",
  checkoutBreakdown: "Payment details",
  checkoutBreakdownHint: "View original prices and discounts",
  itemDiscountTotal: "Item discounts",
  afterItemDiscount: "After item discounts",
  orderDiscount: "Order discount",
  originalPrice: "Original price",
  productSubtotal: "Products",
  addonSubtotal: "Add-ons",
  subtotal: "Subtotal",
  totalDiscount: "Total discount",
  amountDue: "Amount due",
  orderItems: "Order items",
  noDiscountApplied: "No promotion applied",
  promotionPriceChanged:
    "The promotion or price changed. Please review the order and try the payment again.",
});
Object.assign(posMessages["zh-TW"], {
  orderDetailTitle: "訂單詳情",
  promotionDetails: "優惠詳情",
  noPromotion: "未套用優惠",
  close: "關閉",
  addonPrice: "加價",
  optionsSelected: "選項",
  presetNotes: "固定備註",
  checkoutBreakdown: "付款明細",
  checkoutBreakdownHint: "查看原價與優惠折扣",
  itemDiscountTotal: "商品折扣",
  afterItemDiscount: "商品折扣後",
  orderDiscount: "整單折扣",
  originalPrice: "原價",
  productSubtotal: "商品金額",
  addonSubtotal: "加料金額",
  subtotal: "小計",
  totalDiscount: "折扣總額",
  amountDue: "應付金額",
  orderItems: "訂單商品",
  noDiscountApplied: "尚未套用優惠",
  promotionPriceChanged: "優惠或價格已變更，請重新確認訂單後再次付款。",
});

Object.assign(promotionMessages.vi as Record<string, string>, {
  promotionCategoryFilter: "Lọc theo danh mục",
  promotionPreviewRulesTogether:
    "Các quy tắc trong promotion được xét chung; mỗi quy tắc chỉ áp dụng khi đúng đối tượng.",
  promotions: "Khuyến mại",
  promotionMode: "Cách áp dụng",
  automatic: "Tự động",
  manual: "Nhân viên chọn",
  promotionStatus: "Trạng thái",
  draft: "Nháp",
  active: "Đang áp dụng",
  inactive: "Không áp dụng",
  expired: "Đã hết hạn",
  archived: "Lưu trữ",
  promotionRules: "Quy tắc giảm",
  addRule: "Thêm quy tắc",
  removeRule: "Xóa quy tắc",
  target: "Áp dụng cho",
  targetOrder: "Toàn đơn",
  targetProduct: "Sản phẩm",
  targetAddon: "Topping",
  targetLine: "Món và topping",
  eligibleProducts: "Sản phẩm áp dụng",
  eligibleAddons: "Topping áp dụng",
  minSubtotal: "Tổng đơn tối thiểu",
  priority: "Ưu tiên",
  combinable: "Cho phép cộng dồn",
  exclusiveGroup: "Nhóm loại trừ",
  startsAt: "Bắt đầu",
  endsAt: "Kết thúc",
  assignedStores: "Cửa hàng áp dụng",
  promotionCatalogHint:
    "Super Admin quản lý khuyến mại dùng chung; Admin chỉ bật hoặc tắt theo cửa hàng.",
  createPromotion: "Tạo khuyến mại",
  promotionImage: "Ảnh khuyến mại",
  editPromotion: "Sửa khuyến mại",
  emptyPromotions: "Chưa có khuyến mại nào",
  confirmDeletePromotion: "Bạn có chắc muốn xóa khuyến mại này không?",
  promotionSaveError: "Không thể lưu khuyến mại",
  promotionDeleteSuccess: "Đã xóa khuyến mại",
  promotionDeleteError: "Không thể xóa khuyến mại",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  promotionCategoryFilter: "Filter by category",
  promotionPreviewRulesTogether:
    "Rules in this promotion are evaluated together; each rule applies only when its target is present.",
  promotions: "Promotions",
  promotionMode: "Application",
  automatic: "Automatic",
  manual: "Staff selected",
  promotionStatus: "Status",
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  archived: "Archived",
  promotionRules: "Promotion rules",
  addRule: "Add rule",
  removeRule: "Remove rule",
  target: "Apply to",
  targetOrder: "Order",
  targetProduct: "Product",
  targetAddon: "Add-on",
  targetLine: "Product and add-ons",
  eligibleProducts: "Eligible products",
  eligibleAddons: "Eligible add-ons",
  minSubtotal: "Minimum order subtotal",
  priority: "Priority",
  combinable: "Can stack",
  exclusiveGroup: "Exclusive group",
  startsAt: "Starts at",
  endsAt: "Ends at",
  assignedStores: "Assigned stores",
  promotionCatalogHint:
    "Super Admin manages shared promotions; Admins can only enable or disable them for their store.",
  createPromotion: "Create promotion",
  promotionImage: "Promotion image",
  editPromotion: "Edit promotion",
  emptyPromotions: "No promotions yet",
  confirmDeletePromotion: "Are you sure you want to delete this promotion?",
  promotionSaveError: "Unable to save promotion",
  promotionDeleteSuccess: "Promotion deleted",
  promotionDeleteError: "Unable to delete promotion",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  promotionCategoryFilter: "依分類篩選",
  promotionPreviewRulesTogether:
    "此優惠中的規則會一併判斷；只有符合對象的規則才會套用。",
  promotions: "優惠活動",
  promotionMode: "套用方式",
  automatic: "自動套用",
  manual: "由員工選擇",
  promotionStatus: "狀態",
  draft: "草稿",
  active: "啟用中",
  inactive: "未啟用",
  expired: "已過期",
  archived: "封存",
  promotionRules: "優惠規則",
  addRule: "新增規則",
  removeRule: "移除規則",
  target: "套用範圍",
  targetOrder: "整筆訂單",
  targetProduct: "商品",
  targetAddon: "加料",
  targetLine: "商品與加料",
  eligibleProducts: "適用商品",
  eligibleAddons: "適用加料",
  minSubtotal: "最低訂單金額",
  priority: "優先順序",
  combinable: "允許疊加",
  exclusiveGroup: "互斥群組",
  startsAt: "開始時間",
  endsAt: "結束時間",
  assignedStores: "適用分店",
  promotionCatalogHint:
    "Super Admin 管理共用優惠活動；Admin 僅能為所屬分店啟用或停用。",
  createPromotion: "新增優惠活動",
  promotionImage: "優惠活動圖片",
  editPromotion: "編輯優惠活動",
  emptyPromotions: "尚無優惠活動",
  confirmDeletePromotion: "確定要刪除此優惠活動嗎？",
  promotionSaveError: "無法儲存優惠活動",
  promotionDeleteSuccess: "優惠活動已刪除",
  promotionDeleteError: "無法刪除優惠活動",
});
Object.assign(promotionMessages.vi as Record<string, string>, {
  promotionHelp: "Hướng dẫn khuyến mại",
  promotionHelpBody:
    "Tạo một hoặc nhiều quy tắc trong cùng promotion.\n• Sản phẩm: giảm giá gốc của sản phẩm.\n• Topping: giảm riêng topping được chọn.\n• Món và topping: giảm phần còn lại của cả món.\n• Toàn đơn: tính sau tất cả giảm theo món/topping.\n\nTổng đơn tối thiểu để trống nghĩa là không có điều kiện. Automatic tự áp dụng; Manual để nhân viên chọn. Nhiều promotion toàn đơn automatic chỉ lấy một cái: ưu tiên cao hơn thắng, bằng nhau thì chọn giảm nhiều hơn. Bật cộng dồn để promotion có thể đi cùng promotion khác.",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  promotionHelp: "Promotion guide",
  promotionHelpBody:
    "Create one or more rules in a promotion.\n• Product: reduces the product base price.\n• Add-on: reduces the selected add-on only.\n• Product and add-ons: reduces the remaining line price.\n• Order: is calculated after all item/add-on reductions.\n\nLeaving minimum subtotal empty means no threshold. Automatic applies itself; Manual is selected by staff. Only one automatic order promotion can apply: higher priority wins, then the larger discount. Enable stacking to allow this promotion with other promotions.",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  promotionHelp: "優惠說明",
  promotionHelpBody:
    "一個優惠可建立一或多個規則。\n• 商品：折抵商品原價。\n• 加料：只折抵指定加料。\n• 商品與加料：折抵該品項剩餘金額。\n• 整筆訂單：在所有商品／加料折扣後計算。\n\n最低訂單金額留空代表沒有門檻。自動套用會自行生效；手動套用由員工選擇。自動整筆訂單優惠只能套用一個：優先順序較高者勝出，若相同則選折扣較大者。開啟允許疊加可與其他優惠一起使用。",
});
Object.assign(promotionMessages.vi as Record<string, string>, {
  allStatuses: "Tất cả trạng thái",
  pagePrevious: "Trước",
  pageNext: "Sau",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  allStatuses: "All statuses",
  pagePrevious: "Previous",
  pageNext: "Next",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  allStatuses: "所有狀態",
  pagePrevious: "上一頁",
  pageNext: "下一頁",
});
Object.assign(promotionMessages.vi as Record<string, string>, {
  previewPromotion: "Xem chi tiết",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  previewPromotion: "View details",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  previewPromotion: "查看詳情",
});
Object.assign(promotionMessages.vi as Record<string, string>, {
  searchPromotionTargets: "Tìm sản phẩm hoặc topping",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  searchPromotionTargets: "Search products or add-ons",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  searchPromotionTargets: "搜尋商品或加料",
});
(posMessages as Record<Locale, Record<string, string>>).vi.print = "Print";

const orderDisplayMessages = {
  vi: {
    dineIn: "T\u1ea1i qu\u00e1n",
    takeaway: "Mang \u0111i",
    uber: "Uber",
    foodpanda: "Foodpanda",
    cash: "Ti\u1ec1n m\u1eb7t",
    bank: "Ng\u00e2n h\u00e0ng",
    linepay: "LinePay",
  },
  en: {
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    uber: "Uber",
    foodpanda: "Foodpanda",
    cash: "Cash",
    bank: "Bank",
    linepay: "LinePay",
  },
  "zh-TW": {
    dineIn: "\u5167\u7528",
    takeaway: "\u5916\u5e36",
    uber: "Uber",
    foodpanda: "Foodpanda",
    cash: "\u73fe\u91d1",
    bank: "\u9280\u884c",
    linepay: "LinePay",
  },
} as const;

const revenueMessages = {
  vi: {
    revenueTableTitle: "Bảng Thu nhập khác",
    totalOtherRevenue: "Tổng thu nhập khác",
    searchRevenue: "Tìm theo tên thu nhập...",
    addRevenue: "Thêm thu nhập",
    revenueName: "Tên",
    price: "Giá",
    note: "Chú thích",
    actions: "Thao Tác",
    noRevenueFound: "Không tìm thấy thu nhập khác",
    revenueCount: "thu nhập",
    edit: "Sửa",
    delete: "Xóa",
    confirmDelete: "Bạn có chắc muốn xóa?",
    deleteDescription: "Hành động này không thể hoàn tác.",
    cancel: "Hủy",
    confirm: "Xác nhận",
    deleting: "Đang xóa...",
    save: "Lưu",
    saving: "Đang lưu...",
    addRevenueTitle: "Thêm Thu Nhập Khác",
    editRevenueTitle: "Sửa thu nhập khác",
    requiredName: "Tên không được bỏ trống",
    requiredPrice: "Giá không được bỏ trống",
    createSuccess: "Lưu thành công",
    createFailure: "Lưu thất bại",
    updateSuccess: "Sửa thành công",
    updateFailure: "Sửa thất bại",
    deleteSuccess: "Xóa thành công",
    deleteFailure: "Xóa thất bại",
  },
  en: {
    revenueTableTitle: "Other revenue",
    totalOtherRevenue: "Total other revenue",
    searchRevenue: "Search by revenue name...",
    addRevenue: "Add revenue",
    revenueName: "Name",
    price: "Price",
    note: "Note",
    actions: "Actions",
    noRevenueFound: "No other revenue found",
    revenueCount: "revenues",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this?",
    deleteDescription: "This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Confirm",
    deleting: "Deleting...",
    save: "Save",
    saving: "Saving...",
    addRevenueTitle: "Add Other Revenue",
    editRevenueTitle: "Edit other revenue",
    requiredName: "Name is required",
    requiredPrice: "Price is required",
    createSuccess: "Saved successfully",
    createFailure: "Failed to save",
    updateSuccess: "Updated successfully",
    updateFailure: "Failed to update",
    deleteSuccess: "Deleted successfully",
    deleteFailure: "Failed to delete",
  },
  "zh-TW": {
    revenueTableTitle: "其他收入",
    totalOtherRevenue: "其他收入總額",
    searchRevenue: "依收入名稱搜尋...",
    addRevenue: "新增收入",
    revenueName: "名稱",
    price: "價格",
    note: "備註",
    actions: "操作",
    noRevenueFound: "找不到其他收入",
    revenueCount: "筆收入",
    edit: "編輯",
    delete: "刪除",
    confirmDelete: "確定要刪除嗎？",
    deleteDescription: "此操作無法復原。",
    cancel: "取消",
    confirm: "確認",
    deleting: "刪除中...",
    save: "儲存",
    saving: "儲存中...",
    addRevenueTitle: "新增其他收入",
    editRevenueTitle: "編輯其他收入",
    requiredName: "名稱不可為空",
    requiredPrice: "價格不可為空",
    createSuccess: "儲存成功",
    createFailure: "儲存失敗",
    updateSuccess: "編輯成功",
    updateFailure: "編輯失敗",
    deleteSuccess: "刪除成功",
    deleteFailure: "刪除失敗",
  },
} as const;

const expenseMessages = {
  vi: {
    addTemporaryIngredient: "Thêm nguyên liệu",
    expenseOtherTab: "Chi phí khác",
    expenseInventoryTab: "Nguyên liệu",
    posInventoryPurchase: "Nhập hàng",
    expenseTableTitle: "Bảng Chi phí",
    totalExpense: "Tổng chi",
    searchExpense: "Tìm theo tên chi phí...",
    addExpense: "Thêm chi phí",
    expenseName: "Tên",
    expenseType: "Loại",
    expensePrice: "Giá",
    expenseNote: "Chú thích",
    expenseActions: "Thao Tác",
    noExpenseFound: "Không tìm thấy chi phí",
    expenseCount: "chi phí",
    expenseAddTitle: "Thêm Chi Phí",
    expenseEditTitle: "Sửa Chi Phí",
    requiredName: "Tên không được bỏ trống",
    requiredPrice: "Giá không được bỏ trống",
    delete: "Xóa",
    edit: "Sửa",
    cancel: "Hủy",
    confirmDelete: "Bạn có chắc muốn xóa?",
    deleteDescription: "Hành động này không thể hoàn tác.",
    deleting: "Đang xóa...",
    save: "Lưu",
    saving: "Đang lưu...",
    confirm: "Xác nhận",
    createSuccess: "Lưu thành công",
    createFailure: "Lưu thất bại",
    updateSuccess: "Sửa thành công",
    updateFailure: "Sửa thất bại",
    deleteSuccess: "Xóa thành công",
    deleteFailure: "Xóa thất bại",
  },
  en: {
    addTemporaryIngredient: "Add ingredient",
    expenseOtherTab: "Other expense",
    expenseInventoryTab: "Ingredients",
    posInventoryPurchase: "Receive stock",
    expenseTableTitle: "Expenses",
    totalExpense: "Total expenses",
    searchExpense: "Search by expense name...",
    addExpense: "Add expense",
    expenseName: "Name",
    expenseType: "Type",
    expensePrice: "Price",
    expenseNote: "Note",
    expenseActions: "Actions",
    noExpenseFound: "No expenses found",
    expenseCount: "expenses",
    expenseAddTitle: "Add expense",
    expenseEditTitle: "Edit expense",
    requiredName: "Name is required",
    requiredPrice: "Price is required",
    delete: "Delete",
    edit: "Edit",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this?",
    deleteDescription: "This action cannot be undone.",
    deleting: "Deleting...",
    save: "Save",
    saving: "Saving...",
    confirm: "Confirm",
    createSuccess: "Saved successfully",
    createFailure: "Failed to save",
    updateSuccess: "Updated successfully",
    updateFailure: "Failed to update",
    deleteSuccess: "Deleted successfully",
    deleteFailure: "Failed to delete",
  },
  "zh-TW": {
    addTemporaryIngredient: "新增原料",
    expenseOtherTab: "其他支出",
    expenseInventoryTab: "原料",
    posInventoryPurchase: "進貨",
    expenseTableTitle: "支出明細",
    totalExpense: "支出總額",
    searchExpense: "依支出名稱搜尋...",
    addExpense: "新增支出",
    expenseName: "名稱",
    expenseType: "類型",
    expensePrice: "價格",
    expenseNote: "備註",
    expenseActions: "操作",
    noExpenseFound: "找不到支出",
    expenseCount: "筆支出",
    expenseAddTitle: "新增支出",
    expenseEditTitle: "編輯支出",
    requiredName: "名稱不可為空",
    requiredPrice: "價格不可為空",
    delete: "刪除",
    edit: "編輯",
    cancel: "取消",
    confirmDelete: "確定要刪除嗎？",
    deleteDescription: "此操作無法復原。",
    deleting: "刪除中...",
    save: "儲存",
    saving: "儲存中...",
    confirm: "確認",
    createSuccess: "儲存成功",
    createFailure: "儲存失敗",
    updateSuccess: "編輯成功",
    updateFailure: "編輯失敗",
    deleteSuccess: "刪除成功",
    deleteFailure: "刪除失敗",
  },
} as const;

const expenseFieldMessages = {
  vi: {
    expenseQuantity: "Số lượng",
    expenseUnit: "Đơn vị",
    expenseUnitPrice: "Đơn giá",
    expenseTotal: "Thành tiền",
  },
  en: {
    expenseQuantity: "Quantity",
    expenseUnit: "Unit",
    expenseUnitPrice: "Unit price",
    expenseTotal: "Total",
  },
  "zh-TW": {
    expenseQuantity: "數量",
    expenseUnit: "單位",
    expenseUnitPrice: "單價",
    expenseTotal: "總額",
  },
} as const;
Object.assign(
  expenseMessages.vi as Record<string, string>,
  expenseFieldMessages.vi,
);
Object.assign(
  expenseMessages.en as Record<string, string>,
  expenseFieldMessages.en,
);
Object.assign(
  expenseMessages["zh-TW"] as Record<string, string>,
  expenseFieldMessages["zh-TW"],
);

const closingMessages = {
  vi: {
    closingTitle: "Kết toán hàng ngày",
    income: "Thu nhập",
    expense: "Chi ra",
    next: "Tiếp theo",
    total: "Tổng",
    paymentCash: "Tiền mặt",
    paymentBank: "Ngân hàng",
    paymentOther: "Khác",
    paymentLinepay: "LinePay",
    cashIncomeDetailsTitle: "Chi tiết tiền mặt",
    cashIncomeFromOrders: "Từ đơn hàng",
    cashIncomeFromOtherRevenue: "Từ thu nhập khác",
    cashIncomeTotal: "Tổng tiền mặt",
    expenseDetailsTitle: "Chi tiết các khoản chi",
    incomeDetailsTitle: "Chi tiết thu nhập",
    incomeFromOrders: "Từ đơn hàng",
    incomeFromOtherRevenue: "Từ thu nhập khác",
    incomeTotal: "Tổng thu nhập",
    count: "Số lượng",
    actual: "Thực tế",
    system: "Hệ thống",
    difference: "Chênh lệch",
    reason: "Nguyên nhân",
    countCash: "Mệnh giá",
    countMoney: "Số tiền",
    countDialogTitle: "Bạn có chắc muốn kết toán không?",
    countDialogDescription: "Mỗi ngày chỉ được phép kết toán một lần.",
    back: "Quay lại",
    counting: "Kiểm Tiền",
    closing: "Kết toán",
    saving: "Đang lưu...",
    closeSuccess: "Kết toán thành công",
    closeFailure: "Kết toán không thành công",
    cancel: "Hủy",
    confirm: "Xác nhận",
  },
  en: {
    closingTitle: "Daily closing",
    income: "Income",
    expense: "Expense",
    next: "Next",
    total: "Total",
    paymentCash: "Cash",
    paymentBank: "Bank",
    paymentOther: "Other",
    paymentLinepay: "LinePay",
    cashIncomeDetailsTitle: "Cash income details",
    cashIncomeFromOrders: "From orders",
    cashIncomeFromOtherRevenue: "From other revenue",
    cashIncomeTotal: "Total cash",
    expenseDetailsTitle: "Expense details",
    incomeDetailsTitle: "Income details",
    incomeFromOrders: "From orders",
    incomeFromOtherRevenue: "From other revenue",
    incomeTotal: "Total income",
    count: "Count",
    actual: "Actual",
    system: "System",
    difference: "Difference",
    reason: "Reason",
    countCash: "Denomination",
    countMoney: "Amount",
    countDialogTitle: "Are you sure you want to close the day?",
    countDialogDescription: "Daily closing is allowed only once per day.",
    back: "Back",
    counting: "Count cash",
    closing: "Close day",
    saving: "Saving...",
    closeSuccess: "Day closed successfully",
    closeFailure: "Failed to close day",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  "zh-TW": {
    closingTitle: "日結",
    income: "收入",
    expense: "支出",
    next: "下一步",
    total: "總計",
    paymentCash: "現金",
    paymentBank: "銀行",
    paymentOther: "其他",
    paymentLinepay: "LinePay",
    cashIncomeDetailsTitle: "現金收入明細",
    cashIncomeFromOrders: "來自訂單",
    cashIncomeFromOtherRevenue: "來自其他收入",
    cashIncomeTotal: "現金總額",
    expenseDetailsTitle: "支出明細",
    incomeDetailsTitle: "收入明細",
    incomeFromOrders: "來自訂單",
    incomeFromOtherRevenue: "來自其他收入",
    incomeTotal: "收入總額",
    count: "數量",
    actual: "實際",
    system: "系統",
    difference: "差異",
    reason: "原因",
    countCash: "面額",
    countMoney: "金額",
    countDialogTitle: "確定要結算嗎？",
    countDialogDescription: "每天只能結算一次。",
    back: "返回",
    counting: "盤點現金",
    closing: "結算",
    saving: "儲存中...",
    closeSuccess: "結算成功",
    closeFailure: "結算失敗",
    cancel: "取消",
    confirm: "確認",
  },
} as const;

const closingHistoryMessages = {
  vi: {
    closingHistoryTitle: "K\u1ebft s\u1ed5",
    closingPeriod: "Kho\u1ea3ng th\u1eddi gian",
    closingStatus: "Tr\u1ea1ng th\u00e1i",
    closingConfirmed: "\u0110\u00e3 x\u00e1c nh\u1eadn",
    closingVoided: "\u0110\u00e3 h\u1ee7y",
    closingSystemAmount: "Ti\u1ec1n h\u1ec7 th\u1ed1ng",
    closingActualAmount: "Ti\u1ec1n th\u1ef1c t\u1ebf",
    closingDifference: "Ch\u00eanh l\u1ec7ch",
    closingAction: "Thao t\u00e1c",
    voidClosing: "H\u1ee7y k\u1ebft to\u00e1n",
    voidClosingTitle: "H\u1ee7y l\u1ea7n k\u1ebft to\u00e1n n\u00e0y?",
    voidClosingDescription:
      "Thao t\u00e1c n\u00e0y s\u1ebd m\u1edf l\u1ea1i kho\u1ea3ng th\u1eddi gian. H\u00e3y nh\u1eadp l\u00fd do.",
    voidReasonPlaceholder: "Nh\u1eadp l\u00fd do h\u1ee7y",
    voidSuccess: "\u0110\u00e3 h\u1ee7y k\u1ebft to\u00e1n",
    voidFailure: "Kh\u00f4ng th\u1ec3 h\u1ee7y k\u1ebft to\u00e1n",
    noClosings: "Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed k\u1ebft to\u00e1n",
  },
  en: {
    closingHistoryTitle: "Closing",
    closingPeriod: "Period",
    closingStatus: "Status",
    closingConfirmed: "Confirmed",
    closingVoided: "Voided",
    closingSystemAmount: "System amount",
    closingActualAmount: "Actual amount",
    closingDifference: "Difference",
    closingAction: "Action",
    voidClosing: "Void closing",
    voidClosingTitle: "Void this closing?",
    voidClosingDescription:
      "This reopens the period. Enter a reason to continue.",
    voidReasonPlaceholder: "Enter void reason",
    voidSuccess: "Closing voided",
    voidFailure: "Unable to void closing",
    noClosings: "No closing history",
  },
  "zh-TW": {
    closingHistoryTitle: "\u7d50\u5e33",
    closingPeriod: "\u671f\u9593",
    closingStatus: "\u72c0\u614b",
    closingConfirmed: "\u5df2\u78ba\u8a8d",
    closingVoided: "\u5df2\u4f5c\u5ee2",
    closingSystemAmount: "\u7cfb\u7d71\u91d1\u984d",
    closingActualAmount: "\u5be6\u969b\u91d1\u984d",
    closingDifference: "\u5dee\u7570",
    closingAction: "\u64cd\u4f5c",
    voidClosing: "\u4f5c\u5ee2\u7d50\u7b97",
    voidClosingTitle: "\u4f5c\u5ee2\u9019\u6b21\u7d50\u7b97\uff1f",
    voidClosingDescription:
      "\u9019\u6703\u91cd\u65b0\u958b\u555f\u6b64\u671f\u9593\u3002\u8acb\u8f38\u5165\u539f\u56e0\u3002",
    voidReasonPlaceholder: "\u8f38\u5165\u4f5c\u5ee2\u539f\u56e0",
    voidSuccess: "\u5df2\u4f5c\u5ee2\u7d50\u7b97",
    voidFailure: "\u7121\u6cd5\u4f5c\u5ee2\u7d50\u7b97",
    noClosings: "\u5c1a\u7121\u7d50\u7b97\u6b77\u53f2",
  },
} as const;

const closingPeriodMessages = {
  vi: {
    closingConfirmDescription:
      "H\u1ec7 th\u1ed1ng s\u1ebd k\u1ebft to\u00e1n t\u1eeb l\u1ea7n g\u1ea7n nh\u1ea5t \u0111\u1ebfn hi\u1ec7n t\u1ea1i.",
    systemAmountCalculationTitle: "Chi tiết tiền hệ thống",
    systemAmountCalculationDescription:
      "Tiền hệ thống được tính từ số dư trước kết toán, doanh thu tiền mặt, thu nhập khác bằng tiền mặt và chi phí tiền mặt.",
    closingPreviousCashTitle: "Chi tiết mệnh giá lần kết toán trước",
    closingPreviousCashEmpty: "Chưa có dữ liệu mệnh giá lần trước",
    closingDenomination: "Mệnh giá",
    closingQuantity: "Số lượng",
  },
  en: {
    closingConfirmDescription:
      "The system will close the period from the latest confirmed closing to now.",
    systemAmountCalculationTitle: "System amount details",
    systemAmountCalculationDescription:
      "The system amount is calculated from the previous balance, cash sales, cash other revenue, and cash expenses.",
    closingPreviousCashTitle: "Previous closing denominations",
    closingPreviousCashEmpty: "No previous denomination data",
    closingDenomination: "Denomination",
    closingQuantity: "Quantity",
  },
  "zh-TW": {
    closingConfirmDescription:
      "\u7cfb\u7d71\u5c07\u7d50\u7b97\u5f9e\u4e0a\u6b21\u78ba\u8a8d\u7d50\u7b97\u5230\u73fe\u5728\u7684\u671f\u9593\u3002",
    systemAmountCalculationTitle: "系統金額明細",
    systemAmountCalculationDescription:
      "系統金額根據上次結算餘額、現金銷售、現金其他收入與現金支出計算。",
    closingPreviousCashTitle: "上次結算面額明細",
    closingPreviousCashEmpty: "沒有上次面額資料",
    closingDenomination: "面額",
    closingQuantity: "數量",
  },
} as const;

const closingAdminMessages = {
  vi: {
    closingHistoryDescription:
      "Theo d\u00f5i c\u00e1c kho\u1ea3ng k\u1ebft to\u00e1n v\u00e0 x\u1eed l\u00fd c\u00e1c b\u1ea3n ghi b\u1ecb h\u1ee7y.",
    closingSummaryTotal: "T\u1ed5ng l\u1ea7n k\u1ebft to\u00e1n",
    closingSummaryConfirmed: "\u0110\u00e3 x\u00e1c nh\u1eadn",
    closingSummaryVoided: "\u0110\u00e3 h\u1ee7y",
    closingSummaryLatest: "K\u1ebft to\u00e1n g\u1ea7n nh\u1ea5t",
    closingFilterStatus: "L\u1ecdc tr\u1ea1ng th\u00e1i",
    closingFilterAll: "T\u1ea5t c\u1ea3",
    closingFilterConfirmed: "\u0110\u00e3 x\u00e1c nh\u1eadn",
    closingFilterVoided: "\u0110\u00e3 h\u1ee7y",
    closingSearch: "T\u00ecm ki\u1ebfm",
    closingTotal: "T\u1ed5ng s\u1ed1",
    closingFilterDate: "L\u1ecdc t\u1eeb ng\u00e0y",
    closingFilterReset: "X\u00f3a b\u1ed9 l\u1ecdc",
    closingDetailsTitle: "Chi ti\u1ebft k\u1ebft to\u00e1n",
    closingEmployeeView: "Xem th\u00f4ng tin nh\u00e2n vi\u00ean",
    closingEmployeeDetailsTitle: "Th\u00f4ng tin nh\u00e2n vi\u00ean k\u1ebft to\u00e1n",
    closingEmployeeDetailsDescription: "\u0110\u1ed1i chi\u1ebfu th\u00f4ng tin k\u1ebft to\u00e1n v\u00e0 th\u00f4ng tin hi\u1ec7n t\u1ea1i.",
    closingEmployeeAtClosing: "Th\u00f4ng tin l\u00fac k\u1ebft to\u00e1n",
    closingEmployeeCurrent: "Th\u00f4ng tin hi\u1ec7n t\u1ea1i",
    closingEmployeeName: "T\u00ean",
    closingEmployeeNumberId: "M\u00e3 nh\u00e2n vi\u00ean",
    closingEmployeeStatus: "Tr\u1ea1ng th\u00e1i",
    closingEmployeeActive: "\u0110ang ho\u1ea1t \u0111\u1ed9ng",
    closingEmployeeInactive: "\u0110\u00e3 ng\u1eebng ho\u1ea1t \u0111\u1ed9ng",
    closingEmployeeRole: "Vai tr\u00f2",
    closingEmployeeManager: "Qu\u1ea3n l\u00fd",
    closingEmployeeStaff: "Nh\u00e2n vi\u00ean",
    closingEmployeeUnavailable: "Kh\u00f4ng c\u00f2n h\u1ed3 s\u01a1 nh\u00e2n vi\u00ean hi\u1ec7n t\u1ea1i.",
    closingAtClosingTime: "Th\u00f4ng tin t\u1ea1i th\u1eddi \u0111i\u1ec3m k\u1ebft to\u00e1n",
    closingCashSales:
      "Doanh thu ti\u1ec1n m\u1eb7t t\u1eeb \u0111\u01a1n h\u00e0ng",
    closingOtherRevenue: "Thu nh\u1eadp kh\u00e1c",
    closingExpenses: "Chi ph\u00ed",
    closingCashExpenses: "Chi ph\u00ed ti\u1ec1n m\u1eb7t",
    closingPreviousAmount: "S\u1ed1 d\u01b0 tr\u01b0\u1edbc k\u1ebft to\u00e1n",
    closingConfirmedAt: "Th\u1eddi gian x\u00e1c nh\u1eadn",
    closingConfirmedBy: "Ng\u01b0\u1eddi x\u00e1c nh\u1eadn",
    closingVoidedAt: "Th\u1eddi gian h\u1ee7y",
    closingVoidedBy: "Ng\u01b0\u1eddi h\u1ee7y",
    closingVoidReason: "L\u00fd do h\u1ee7y",
    closingOpen: "Kho\u1ea3ng hi\u1ec7n t\u1ea1i",
    closingNoData: "Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u ph\u00f9 h\u1ee3p",
    closingLoadError:
      "Kh\u00f4ng th\u1ec3 t\u1ea3i l\u1ecbch s\u1eed k\u1ebft to\u00e1n",
  },
  en: {
    closingHistoryDescription:
      "Review closing periods and manage voided records.",
    closingSummaryTotal: "Total closings",
    closingSummaryConfirmed: "Confirmed",
    closingSummaryVoided: "Voided",
    closingSummaryLatest: "Latest closing",
    closingFilterStatus: "Filter status",
    closingFilterAll: "All",
    closingFilterConfirmed: "Confirmed",
    closingFilterVoided: "Voided",
    closingSearch: "Search",
    closingTotal: "Total",
    closingFilterDate: "From date",
    closingFilterReset: "Clear filters",
    closingDetailsTitle: "Closing details",
    closingEmployeeView: "View employee information",
    closingEmployeeDetailsTitle: "Closing employee information",
    closingEmployeeDetailsDescription: "Compare the closing information with the current employee information.",
    closingEmployeeAtClosing: "Information at closing time",
    closingEmployeeCurrent: "Current information",
    closingEmployeeName: "Name",
    closingEmployeeNumberId: "Employee ID",
    closingEmployeeStatus: "Status",
    closingEmployeeActive: "Active",
    closingEmployeeInactive: "Inactive",
    closingEmployeeRole: "Role",
    closingEmployeeManager: "Manager",
    closingEmployeeStaff: "Staff",
    closingEmployeeUnavailable: "The current employee record is no longer available.",
    closingAtClosingTime: "Information at closing time",
    closingCashSales: "Cash sales from orders",
    closingOtherRevenue: "Other revenue",
    closingExpenses: "Expenses",
    closingCashExpenses: "Cash expenses",
    closingPreviousAmount: "Previous closing amount",
    closingConfirmedAt: "Confirmed at",
    closingConfirmedBy: "Confirmed by",
    closingVoidedAt: "Voided at",
    closingVoidedBy: "Voided by",
    closingVoidReason: "Void reason",
    closingOpen: "Current open period",
    closingNoData: "No matching records",
    closingLoadError: "Unable to load closing history",
  },
  "zh-TW": {
    closingHistoryDescription:
      "\u67e5\u770b\u7d50\u7b97\u671f\u9593\u4e26\u7ba1\u7406\u4f5c\u5ee2\u8a18\u9304\u3002",
    closingSummaryTotal: "\u7d50\u7b97\u6b21\u6578",
    closingSummaryConfirmed: "\u5df2\u78ba\u8a8d",
    closingSummaryVoided: "\u5df2\u4f5c\u5ee2",
    closingSummaryLatest: "\u6700\u65b0\u7d50\u7b97",
    closingFilterStatus: "\u7be9\u9078\u72c0\u614b",
    closingFilterAll: "\u5168\u90e8",
    closingFilterConfirmed: "\u5df2\u78ba\u8a8d",
    closingFilterVoided: "\u5df2\u4f5c\u5ee2",
    closingSearch: "\u641c\u5c0b",
    closingTotal: "\u7e3d\u6578",
    closingFilterDate: "\u958b\u59cb\u65e5\u671f",
    closingFilterReset: "\u6e05\u9664\u7be9\u9078",
    closingDetailsTitle: "\u7d50\u7b97\u8a73\u60c5",
    closingEmployeeView: "查看員工資料",
    closingEmployeeDetailsTitle: "結算員工資料",
    closingEmployeeDetailsDescription: "比較結算資料與目前的員工資料。",
    closingEmployeeAtClosing: "結算時的資料",
    closingEmployeeCurrent: "目前資料",
    closingEmployeeName: "姓名",
    closingEmployeeNumberId: "員工編號",
    closingEmployeeStatus: "狀態",
    closingEmployeeActive: "啟用",
    closingEmployeeInactive: "已停用",
    closingEmployeeRole: "角色",
    closingEmployeeManager: "管理員",
    closingEmployeeStaff: "員工",
    closingEmployeeUnavailable: "目前已找不到此員工資料。",
    closingAtClosingTime: "\u7d50\u7b97\u6642\u7684\u8cc7\u6599",
    closingCashSales: "\u8a02\u55ae\u73fe\u91d1\u92b7\u552e",
    closingOtherRevenue: "\u5176\u4ed6\u6536\u5165",
    closingExpenses: "\u652f\u51fa",
    closingCashExpenses: "\u73fe\u91d1\u652f\u51fa",
    closingPreviousAmount: "\u4e0a\u6b21\u7d50\u7b97\u91d1\u984d",
    closingConfirmedAt: "\u78ba\u8a8d\u6642\u9593",
    closingConfirmedBy: "\u78ba\u8a8d\u4eba",
    closingVoidedAt: "\u4f5c\u5ee2\u6642\u9593",
    closingVoidedBy: "\u4f5c\u5ee2\u4eba",
    closingVoidReason: "\u4f5c\u5ee2\u539f\u56e0",
    closingOpen: "\u7576\u524d\u958b\u653e\u671f\u9593",
    closingNoData: "\u6c92\u6709\u7b26\u5408\u8a18\u9304",
    closingLoadError: "\u7121\u6cd5\u8f09\u5165\u7d50\u7b97\u6b77\u53f2",
  },
} as const;

const closingRangeMessages = {
  vi: { closingFilterFrom: "T\u1eeb", closingFilterTo: "\u0110\u1ebfn" },
  en: { closingFilterFrom: "From", closingFilterTo: "To" },
  "zh-TW": { closingFilterFrom: "\u5f9e", closingFilterTo: "\u5230" },
} as const;

const attendanceMessages = {
  vi: {
    employeeId: "Mã nhân viên",
    checkIn: "Vào làm",
    checkOut: "Tan làm",
    checkInSuccess: "Chấm công vào làm thành công",
    checkOutSuccess: "Chấm công tan làm thành công",
    alreadyCheckedIn: "Bạn đã chấm công vào làm rồi",
    employeeNotFound: "Không tồn tại mã số nhân viên",
    noCheckIn: "Bạn chưa chấm công vào làm",
    attendanceFailure: "Chấm công không thành công",
  },
  en: {
    employeeId: "Employee ID",
    checkIn: "Check in",
    checkOut: "Check out",
    checkInSuccess: "Checked in successfully",
    checkOutSuccess: "Checked out successfully",
    alreadyCheckedIn: "You have already checked in today",
    employeeNotFound: "Employee ID not found",
    noCheckIn: "No check-in found for today",
    attendanceFailure: "Attendance action failed",
  },
  "zh-TW": {
    employeeId: "員工編號",
    checkIn: "上班打卡",
    checkOut: "下班打卡",
    checkInSuccess: "上班打卡成功",
    checkOutSuccess: "下班打卡成功",
    alreadyCheckedIn: "今天已經打過上班卡",
    employeeNotFound: "找不到員工編號",
    noCheckIn: "今天尚未上班打卡",
    attendanceFailure: "打卡失敗",
  },
} as const;

const dailyClosingMessages = {
  vi: {
    closingReasonRequired:
      "Có chênh lệch nên phải điền nguyên nhân mới kết toán được",
    closingAlreadyCreated: "Kỳ kết toán đã được thiết bị khác xác nhận. Vui lòng tải lại.",
    closingEmployeeId: "Mã nhân viên kết toán",
    closingEmployeeIdPlaceholder: "Nhập mã nhân viên",
    closingEmployeeVerify: "Kiểm tra",
    closingEmployeeNotVerified: "Chưa xác thực nhân viên",
    closingEmployeeRequired: "Vui lòng kiểm tra mã nhân viên trước khi kết toán",
    closingEmployee: "Nhân viên kết toán",
  },
  en: {
    closingReasonRequired:
      "A reason is required for the difference before closing the day",
    closingAlreadyCreated: "This closing period was confirmed by another device. Please reload.",
    closingEmployeeId: "Closing employee ID",
    closingEmployeeIdPlaceholder: "Enter employee ID",
    closingEmployeeVerify: "Verify",
    closingEmployeeNotVerified: "Employee not verified",
    closingEmployeeRequired: "Please verify the employee ID before closing",
    closingEmployee: "Closing employee",
  },
  "zh-TW": { closingReasonRequired: "有差異時必須填寫原因才能結算", closingAlreadyCreated: "此結算期間已由其他裝置確認，請重新載入。", closingEmployeeId: "結算員工編號", closingEmployeeIdPlaceholder: "輸入員工編號", closingEmployeeVerify: "驗證", closingEmployeeNotVerified: "尚未驗證員工", closingEmployeeRequired: "結算前請先驗證員工編號", closingEmployee: "結算員工" },
} as const;

type MessageKey = string;
type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");
  useEffect(() => {
    const saved = window.localStorage.getItem("pos-locale");
    const next =
      saved && locales.includes(saved as Locale)
        ? (saved as Locale)
        : window.navigator.language.toLowerCase().startsWith("zh")
          ? "zh-TW"
          : window.navigator.language.toLowerCase().startsWith("en")
            ? "en"
            : "vi";
    queueMicrotask(() => setLocaleState(next));
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("pos-locale", next);
  };
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) =>
        key in loginMessages[locale]
          ? loginMessages[locale][key as keyof typeof loginMessages.vi]
          : key in userMessages[locale]
            ? userMessages[locale][key as keyof typeof userMessages.vi]
            : key in cashMessages[locale]
              ? cashMessages[locale][key as keyof typeof cashMessages.vi]
              : key in storeProductMessages[locale]
                ? storeProductMessages[locale][
                    key as keyof typeof storeProductMessages.vi
                  ]
                : key in attendanceMessages[locale]
                  ? attendanceMessages[locale][
                      key as keyof typeof attendanceMessages.vi
                    ]
                  : key in closingMessages[locale]
                    ? closingMessages[locale][
                        key as keyof typeof closingMessages.vi
                      ]
                    : key in closingHistoryMessages[locale]
                      ? closingHistoryMessages[locale][
                          key as keyof typeof closingHistoryMessages.vi
                        ]
                      : key in closingPeriodMessages[locale]
                        ? closingPeriodMessages[locale][
                            key as keyof typeof closingPeriodMessages.vi
                          ]
                        : key in closingAdminMessages[locale]
                          ? closingAdminMessages[locale][
                              key as keyof typeof closingAdminMessages.vi
                            ]
                          : key in closingRangeMessages[locale]
                            ? closingRangeMessages[locale][
                                key as keyof typeof closingRangeMessages.vi
                              ]
                            : key in orderErrorMessages[locale]
                              ? orderErrorMessages[locale][
                                  key as keyof typeof orderErrorMessages.vi
                                ]
                              : key in expenseMessages[locale]
                                ? expenseMessages[locale][
                                    key as keyof typeof expenseMessages.vi
                                  ]
                                : key in revenueMessages[locale]
                                  ? revenueMessages[locale][
                                      key as keyof typeof revenueMessages.vi
                                    ]
                                  : key in orderDisplayMessages[locale]
                                    ? orderDisplayMessages[locale][
                                        key as keyof typeof orderDisplayMessages.vi
                                      ]
                                    : key in posMessages[locale]
                                      ? posMessages[locale][
                                          key as keyof typeof posMessages.vi
                                        ]
                                      : key in orderMessages[locale]
                                        ? orderMessages[locale][
                                            key as keyof typeof orderMessages.vi
                                          ]
                                        : key in messages[locale]
                                          ? messages[locale][
                                              key as keyof typeof messages.vi
                                            ]
                                          : key in extraMessages[locale]
                                            ? extraMessages[locale][
                                                key as keyof typeof extraMessages.vi
                                              ]
                                            : key in
                                                productActionMessages[locale]
                                              ? productActionMessages[locale][
                                                  key as keyof typeof productActionMessages.vi
                                                ]
                                              : key in
                                                  productDescriptionMessages[
                                                    locale
                                                  ]
                                                ? productDescriptionMessages[
                                                    locale
                                                  ][
                                                    key as keyof typeof productDescriptionMessages.vi
                                                  ]
                                                : key in
                                                    dailyClosingMessages[locale]
                                                  ? dailyClosingMessages[
                                                      locale
                                                    ][
                                                      key as keyof typeof dailyClosingMessages.vi
                                                    ]
                                                  : key in
                                                      commonMessages[locale]
                                                    ? commonMessages[locale][
                                                        key as keyof typeof commonMessages.vi
                                                      ]
                                                    : key in
                                                        categoryMessages[locale]
                                                      ? categoryMessages[
                                                          locale
                                                        ][
                                                          key as keyof typeof categoryMessages.vi
                                                        ]
                                                      : key in
                                                          addonMessages[locale]
                                                        ? addonMessages[locale][
                                                            key as keyof typeof addonMessages.vi
                                                          ]
                                                        : promotionMessages[
                                                            locale
                                                          ][
                                                            key as keyof typeof promotionMessages.vi
                                                          ],
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
Object.assign(posMessages.vi, {
  refreshOrders: "Tải lại đơn",
  orderAlertOn: "Bật âm báo đơn",
  orderAlertOff: "Tắt âm báo đơn",
});
Object.assign(posMessages.en, {
  refreshOrders: "Refresh orders",
  orderAlertOn: "Enable order alert",
  orderAlertOff: "Disable order alert",
});
Object.assign(posMessages["zh-TW"], {
  refreshOrders: "重新載入訂單",
  orderAlertOn: "開啟訂單提示音",
  orderAlertOff: "關閉訂單提示音",
});

Object.assign(messages["zh-TW"], { printAgentList: "印表機清單" });
Object.assign(messages.vi, {
  printAgentConfirmRotate:
    "Bạn có chắc muốn cấp lại token? Token hiện tại sẽ không còn sử dụng được.",
  printAgentConfirmDisable: "Bạn có chắc muốn tạm dừng print agent này?",
  printAgentConfirmEnable: "Bạn có muốn bật lại print agent này không?",
});
Object.assign(messages.en, {
  printAgentConfirmRotate:
    "Rotate this token? The current token will stop working.",
  printAgentConfirmDisable: "Pause this print agent?",
  printAgentConfirmEnable: "Enable this print agent again?",
});
Object.assign(messages["zh-TW"], {
  printAgentConfirmRotate: "確定要重新產生 Token 嗎？目前的 Token 將會失效。",
  printAgentConfirmDisable: "確定要暫停此 Print agent 嗎？",
  printAgentConfirmEnable: "要重新啟用此 Print agent 嗎？",
});
Object.assign(messages.vi, {
  printAgentConfirmPrinterDisable: "Bạn có chắc muốn tạm dừng máy in này?",
  printAgentConfirmPrinterEnable: "Bạn có muốn bật lại máy in này không?",
});
Object.assign(messages.en, {
  printAgentConfirmPrinterDisable: "Pause this printer?",
  printAgentConfirmPrinterEnable: "Enable this printer again?",
});
Object.assign(messages["zh-TW"], {
  printAgentConfirmPrinterDisable: "確定要暫停此印表機嗎？",
  printAgentConfirmPrinterEnable: "要重新啟用此印表機嗎？",
});
Object.assign(messages.vi, {
  printAgentTestPrint: "In thử",
  printAgentConfirmTest: "Bạn có muốn gửi lệnh in thử đến máy in này?",
  printAgentTestQueued: "Đã gửi lệnh in thử",
  printAgentTestFailed: "Không thể gửi lệnh in thử",
});
Object.assign(messages.en, {
  printAgentTestPrint: "Test print",
  printAgentConfirmTest: "Send a test print to this printer?",
  printAgentTestQueued: "Test print queued",
  printAgentTestFailed: "Unable to queue test print",
});
Object.assign(messages["zh-TW"], {
  printAgentTestPrint: "列印測試",
  printAgentConfirmTest: "要將測試列印送到此印表機嗎？",
  printAgentTestQueued: "已送出測試列印",
  printAgentTestFailed: "無法送出測試列印",
});
Object.assign(messages.vi, {
  tables: "Bàn & QR",
  tablesDescription: "Tạo mã QR riêng cho từng bàn để khách quét và gọi món.",
  tableCreate: "Tạo bàn mới",
  tableCode: "Mã",
  tableCodePlaceholder: "Ví dụ: 12",
  tableName: "Tên hiển thị",
  tableNamePlaceholder: "Ví dụ: Bàn 12",
  tableEmpty: "Chưa có bàn nào. Hãy tạo bàn đầu tiên để in QR.",
  tableCreateSuccess: "Đã tạo bàn và mã QR",
  tableCreateFailure: "Không thể tạo bàn",
  tableCodeDuplicate: "Mã bàn đã tồn tại",
  tableQrFailure: "Không thể tạo ảnh QR",
  tableQrAlt: "Mã QR cho",
  tableCopyLink: "Sao chép link",
  tableCopySuccess: "Đã sao chép link QR",
  tableCopyFailure: "Không thể sao chép link QR",
  tableDownload: "Tải QR",
});
Object.assign(messages.en, {
  tables: "Tables & QR",
  tablesDescription: "Create one QR code per table for guest ordering.",
  tableCreate: "Create table",
  tableCode: "Code",
  tableCodePlaceholder: "For example: 12",
  tableName: "Display name",
  tableNamePlaceholder: "For example: Table 12",
  tableEmpty: "No tables yet. Create your first table to print its QR code.",
  tableCreateSuccess: "Table and QR code created",
  tableCreateFailure: "Unable to create table",
  tableCodeDuplicate: "This table code already exists",
  tableQrFailure: "Unable to generate QR image",
  tableQrAlt: "QR code for",
  tableCopyLink: "Copy link",
  tableCopySuccess: "QR link copied",
  tableCopyFailure: "Unable to copy QR link",
  tableDownload: "Download QR",
});
Object.assign(messages["zh-TW"], {
  tables: "桌位與 QR",
  tablesDescription: "為每張桌子建立 QR Code，供顧客掃碼點餐。",
  tableCreate: "新增桌位",
  tableCode: "代碼",
  tableCodePlaceholder: "例如：12",
  tableName: "顯示名稱",
  tableNamePlaceholder: "例如：12 號桌",
  tableEmpty: "尚未建立桌位，先建立第一張桌子來列印 QR Code。",
  tableCreateSuccess: "已建立桌位與 QR Code",
  tableCreateFailure: "無法建立桌位",
  tableCodeDuplicate: "此桌位代碼已存在",
  tableQrFailure: "無法產生 QR 圖片",
  tableQrAlt: "QR Code：",
  tableCopyLink: "複製連結",
  tableCopySuccess: "已複製 QR 連結",
  tableCopyFailure: "無法複製 QR 連結",
  tableDownload: "下載 QR",
});
Object.assign(messages.vi, {
  posTable: "Bàn",
  tableSearch: "Tìm hoặc chọn bàn",
  tableRequired: "Vui lòng chọn bàn trước khi tạo đơn hoặc thanh toán",
});
Object.assign(messages.en, {
  posTable: "Table",
  tableSearch: "Search or select table",
  tableRequired: "Select a table before creating or paying for a dine-in order",
});
Object.assign(messages["zh-TW"], {
  posTable: "桌號",
  tableSearch: "搜尋或選擇桌號",
  tableRequired: "內用訂單建立或付款前請選擇桌號",
});

Object.assign(messages.vi, {
  tableQrRegenerate: "Tạo lại QR",
  tableQrRegenerateConfirm:
    "Mã QR cũ sẽ không còn dùng được. Bạn có muốn tạo mã mới không?",
  tableQrRegenerateSuccess: "Đã tạo lại mã QR",
  tableQrRegenerateFailure: "Không thể tạo lại mã QR",
  tableActiveTab: "Đang hoạt động",
  tableInactiveTab: "Đã tắt",
  tableEdit: "Sửa bàn",
  tableUpdateSuccess: "Đã cập nhật bàn",
  tableUpdateFailure: "Không thể cập nhật bàn",
  tableDeactivate: "Tắt bàn",
  tableDeactivateConfirm:
    "Bàn sẽ không còn xuất hiện trong POS và QR cũ sẽ không còn hoạt động. Bạn có muốn tiếp tục không?",
  tableActivate: "Kích hoạt bàn",
  tableActivateConfirm: "Bạn có muốn kích hoạt lại bàn này không?",
});
Object.assign(messages.en, {
  tableQrRegenerate: "Regenerate QR",
  tableQrRegenerateConfirm:
    "The old QR code will stop working. Do you want to create a new one?",
  tableQrRegenerateSuccess: "QR code regenerated",
  tableQrRegenerateFailure: "Unable to regenerate QR code",
  tableActiveTab: "Active",
  tableInactiveTab: "Inactive",
  tableEdit: "Edit table",
  tableUpdateSuccess: "Table updated",
  tableUpdateFailure: "Unable to update table",
  tableDeactivate: "Deactivate table",
  tableDeactivateConfirm:
    "This table will disappear from the POS and its old QR code will stop working. Continue?",
  tableActivate: "Activate table",
  tableActivateConfirm: "Do you want to activate this table again?",
});
Object.assign(messages["zh-TW"], {
  tableQrRegenerate: "重新產生 QR",
  tableQrRegenerateConfirm: "舊的 QR Code 將無法使用。確定要產生新的嗎？",
  tableQrRegenerateSuccess: "已重新產生 QR Code",
  tableQrRegenerateFailure: "無法重新產生 QR Code",
  tableActiveTab: "啟用中",
  tableInactiveTab: "已停用",
  tableEdit: "編輯桌位",
  tableUpdateSuccess: "已更新桌位",
  tableUpdateFailure: "無法更新桌位",
  tableDeactivate: "停用桌位",
  tableDeactivateConfirm:
    "此桌位將不再顯示於 POS，舊的 QR Code 也將無法使用。確定要繼續嗎？",
  tableActivate: "啟用桌位",
  tableActivateConfirm: "確定要再次啟用此桌位嗎？",
});
Object.assign(messages.vi, {
  tableQrRegenerateAll: "Tạo lại toàn bộ QR",
  tableQrRegenerateAllConfirm:
    "Mã QR của tất cả bàn sẽ được thay đổi. Bạn có muốn tiếp tục không?",
});
Object.assign(messages.en, {
  tableQrRegenerateAll: "Regenerate all QR codes",
  tableQrRegenerateAllConfirm:
    "QR codes for all tables will change. Do you want to continue?",
});
Object.assign(messages["zh-TW"], {
  tableQrRegenerateAll: "重新產生全部 QR",
  tableQrRegenerateAllConfirm: "所有桌位的 QR Code 都會變更。確定要繼續嗎？",
});

Object.assign(messages.vi, {
  onlineQrTitle: "QR",
  onlineQrDescription: "Khách quét mã này để mở trang đặt hàng online.",
  onlineQrAlt: "Mã QR đặt hàng online",
  onlineQrCopyLink: "Sao chép link online",
  onlineQrCopySuccess: "Đã sao chép link đặt hàng online",
  onlineQrDownload: "Tải QR online",
});
Object.assign(messages.en, {
  onlineQrTitle: "QR",
  onlineQrDescription:
    "Guests can scan this code to open the online ordering page.",
  onlineQrAlt: "Online ordering QR code",
  onlineQrCopyLink: "Copy online link",
  onlineQrCopySuccess: "Online ordering link copied",
  onlineQrDownload: "Download online QR",
});
Object.assign(messages["zh-TW"], {
  onlineQrTitle: "QR",
  onlineQrDescription: "顧客掃描此 QR Code 即可開啟線上點餐頁面。",
  onlineQrAlt: "線上點餐 QR Code",
  onlineQrCopyLink: "複製線上連結",
  onlineQrCopySuccess: "已複製線上點餐連結",
  onlineQrDownload: "下載線上 QR",
});

Object.assign(messages.vi, {
  tableSessionList: "Phiên đặt món tại bàn",
  tableSessionActive: "Đang nhận đơn QR",
  tableSessionInactive: "Chưa mở phiên",
  tableSessionExpires: "Hết hạn lúc",
  tableSessionOpen: "Mở phiên",
  tableSessionExtend: "Gia hạn",
  tableSessionClose: "Đóng phiên",
  tableSessionOpened: "Đã mở phiên đặt món",
  tableSessionExtended: "Đã gia hạn phiên đặt món",
  tableSessionClosed: "Đã đóng phiên đặt món",
  tableSessionActionFailure: "Không thể cập nhật phiên đặt món",
  tableSessionCloseConfirm:
    "Khách sẽ không thể gửi đơn mới bằng QR của bàn này. Bạn có muốn đóng phiên không?",
});
Object.assign(messages.en, {
  tableSessionList: "Table ordering sessions",
  tableSessionActive: "Accepting QR orders",
  tableSessionInactive: "Session is not open",
  tableSessionExpires: "Expires at",
  tableSessionOpen: "Open session",
  tableSessionExtend: "Extend",
  tableSessionClose: "Close session",
  tableSessionOpened: "Table ordering session opened",
  tableSessionExtended: "Table ordering session extended",
  tableSessionClosed: "Table ordering session closed",
  tableSessionActionFailure: "Unable to update table session",
  tableSessionCloseConfirm:
    "Guests will no longer be able to place new orders from this table QR. Close the session?",
});
Object.assign(messages["zh-TW"], {
  tableSessionList: "桌邊點餐工作階段",
  tableSessionActive: "可接受 QR 點餐",
  tableSessionInactive: "尚未開啟工作階段",
  tableSessionExpires: "到期時間",
  tableSessionOpen: "開啟",
  tableSessionExtend: "延長",
  tableSessionClose: "關閉",
  tableSessionOpened: "已開啟桌邊點餐",
  tableSessionExtended: "已延長桌邊點餐",
  tableSessionClosed: "已關閉桌邊點餐",
  tableSessionActionFailure: "無法更新桌邊點餐工作階段",
  tableSessionCloseConfirm:
    "顧客將無法再透過此桌 QR Code 送出新訂單。確定要關閉嗎？",
});

Object.assign(messages.vi, {
  editOrder: "Chỉnh sửa đơn",
  saveOrderChanges: "Lưu thay đổi",
  orderChangedElsewhere:
    "Đơn hàng đã được thay đổi trên thiết bị khác. Hãy mở lại để xem dữ liệu mới.",
});
Object.assign(messages.en, {
  editOrder: "Edit order",
  saveOrderChanges: "Save changes",
  orderChangedElsewhere:
    "This order was changed on another device. Reopen it to see the latest data.",
});
Object.assign(messages["zh-TW"], {
  editOrder: "編輯訂單",
  saveOrderChanges: "儲存變更",
  orderChangedElsewhere: "此訂單已在其他裝置變更，請重新開啟以查看最新資料。",
});

Object.assign(messages.vi, {
  addOrderItem: "Thêm món",
  confirmSaveOrderChanges:
    "Bạn có chắc muốn lưu toàn bộ thay đổi của đơn hàng không?",
  confirmDiscardOrderChanges:
    "Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn hủy không?",
});
Object.assign(messages.en, {
  addOrderItem: "Add item",
  confirmSaveOrderChanges: "Save all changes to this order?",
  confirmDiscardOrderChanges:
    "Unsaved changes will be lost. Do you want to cancel?",
});
Object.assign(messages["zh-TW"], {
  addOrderItem: "新增餐點",
  confirmSaveOrderChanges: "確定要儲存此訂單的所有變更嗎？",
  confirmDiscardOrderChanges: "尚未儲存的變更將會遺失，確定要取消嗎？",
});
Object.assign(messages.vi, { createNewOrder: "Tạo đơn" });
Object.assign(messages.en, { createNewOrder: "Create order" });
Object.assign(messages["zh-TW"], { createNewOrder: "建立訂單" });
Object.assign(messages.vi, { backToOrder: "Quay lại đơn" });
Object.assign(messages.en, { backToOrder: "Back to order" });
Object.assign(messages["zh-TW"], { backToOrder: "返回訂單" });

Object.assign(messages.vi, { inventoryStocktake: "Kiểm kho" });
Object.assign(messages.en, { inventoryStocktake: "Stocktake" });
Object.assign(messages["zh-TW"], { inventoryStocktake: "盤點庫存" });
Object.assign(messages.vi, { posDevices: "Thiết bị POS" });
Object.assign(messages.en, { posDevices: "POS devices" });
Object.assign(messages.vi, {
  posDeviceDelete: "Xóa thiết bị",
  posDeviceDeleteTitle: "Xóa thiết bị POS?",
  posDeviceDeleteConfirm:
    "Thiết bị và mã đăng ký đang chờ sẽ bị xóa vĩnh viễn.",
});
Object.assign(messages.en, {
  posDeviceDelete: "Delete device",
  posDeviceDeleteTitle: "Delete POS device?",
  posDeviceDeleteConfirm:
    "The device and any pending enrollment code will be permanently deleted.",
});
Object.assign(messages["zh-TW"], {
  posDeviceDelete: "刪除裝置",
  posDeviceDeleteTitle: "刪除 POS 裝置？",
  posDeviceDeleteConfirm: "裝置和尚未使用的註冊代碼將永久刪除。",
});
Object.assign(messages["zh-TW"], { posDevices: "POS 裝置" });
Object.assign(messages.vi, {
  storeVisibilityPos: "POS",
  storeVisibilityQr: "QR",
  storeVisibilityOnline: "Online",
});
Object.assign(messages.en, {
  storeVisibilityPos: "POS",
  storeVisibilityQr: "QR",
  storeVisibilityOnline: "Online",
});
Object.assign(messages["zh-TW"], {
  storeVisibilityPos: "POS",
  storeVisibilityQr: "QR",
  storeVisibilityOnline: "線上",
});
Object.assign(messages.vi, {
  storeAddonDisplayMode: "Cách hiển thị add-on",
  storeAddonDisplayNamed: "Hiển thị tách",
  storeAddonDisplayMerged: "Gộp vào giá món",
});
Object.assign(messages.en, {
  storeAddonDisplayMode: "Add-on display",
  storeAddonDisplayNamed: "Show separately",
  storeAddonDisplayMerged: "Merge into item price",
});
Object.assign(messages["zh-TW"], {
  storeAddonDisplayMode: "加購顯示方式",
  storeAddonDisplayNamed: "分開顯示",
  storeAddonDisplayMerged: "合併至餐點價格",
});

Object.assign(messages.vi, {
  tableSessionRemaining: "Còn lại",
  tableSessionExpired: "Đã hết hạn",
});
Object.assign(messages.en, {
  tableSessionRemaining: "Remaining",
  tableSessionExpired: "Expired",
});
Object.assign(messages["zh-TW"], {
  tableSessionRemaining: "剩餘",
  tableSessionExpired: "已到期",
});
Object.assign(messages.vi, {
  tableSessionHours: "giờ",
  tableSessionMinutes: "phút",
});
Object.assign(messages.en, {
  tableSessionHours: "h",
  tableSessionMinutes: "min",
});
Object.assign(messages["zh-TW"], {
  tableSessionHours: "小時",
  tableSessionMinutes: "分鐘",
});
Object.assign(messages.vi, { posTableSessions: "Bàn" });
Object.assign(messages.en, { posTableSessions: "Tables" });
Object.assign(messages["zh-TW"], { posTableSessions: "桌台" });
Object.assign(messages.vi, {
  posTableSessionOpen: "Mở Bàn",
  posTableSessionExtend: "Gia Hạn",
  posTableSessionClose: "Đóng Bàn",
});
Object.assign(messages.en, {
  posTableSessionOpen: "Open Table",
  posTableSessionExtend: "Extend",
  posTableSessionClose: "Close Table",
});
Object.assign(messages["zh-TW"], {
  posTableSessionOpen: "開桌",
  posTableSessionExtend: "延長",
  posTableSessionClose: "關桌",
});
Object.assign(messages.vi, { posTableSessionTitle: "Phiên Đặt Món Tại Bàn" });
Object.assign(messages.en, { posTableSessionTitle: "Table Ordering Sessions" });
Object.assign(messages["zh-TW"], { posTableSessionTitle: "桌邊點餐工作階段" });

Object.assign(messages.vi, {
  tableQrCopyShort: "Sao chép",
  tableQrRegenerateShort: "Tạo lại",
});
Object.assign(messages.en, {
  tableQrCopyShort: "Copy",
  tableQrRegenerateShort: "Regenerate",
});
Object.assign(messages["zh-TW"], {
  tableQrCopyShort: "複製",
  tableQrRegenerateShort: "重建",
});

Object.assign(messages.vi, {
  posTableSessionOpenAll: "Bật Toàn Bộ",
  posTableSessionExtendAll: "Gia Hạn Toàn Bộ",
  posTableSessionCloseAll: "Tắt Toàn Bộ",
  posTableSessionAllOpened: "Đã bật phiên cho toàn bộ bàn",
  posTableSessionAllExtended: "Đã gia hạn toàn bộ bàn đang mở",
  posTableSessionAllClosed: "Đã tắt toàn bộ phiên bàn",
  posTableSessionCloseAllTitle: "Tắt Toàn Bộ Phiên Bàn?",
  posTableSessionCloseAllConfirm:
    "Tất cả mã QR bàn đang mở sẽ ngừng nhận đơn mới.",
});
Object.assign(messages.en, {
  posTableSessionOpenAll: "Open All",
  posTableSessionExtendAll: "Extend All",
  posTableSessionCloseAll: "Close All",
  posTableSessionAllOpened: "Opened sessions for all tables",
  posTableSessionAllExtended: "Extended all open table sessions",
  posTableSessionAllClosed: "Closed all table sessions",
  posTableSessionCloseAllTitle: "Close All Table Sessions?",
  posTableSessionCloseAllConfirm:
    "All active table QR codes will stop accepting new orders.",
});
Object.assign(messages["zh-TW"], {
  posTableSessionOpenAll: "全部開桌",
  posTableSessionExtendAll: "全部延長",
  posTableSessionCloseAll: "全部關閉",
  posTableSessionAllOpened: "已開啟所有桌位工作階段",
  posTableSessionAllExtended: "已延長所有開啟中的工作階段",
  posTableSessionAllClosed: "已關閉所有桌位工作階段",
  posTableSessionCloseAllTitle: "關閉所有桌邊點餐？",
  posTableSessionCloseAllConfirm: "所有已開啟的桌邊 QR Code 將停止接受新訂單。",
});

Object.assign(messages.vi, {
  posTableSessionOpenAllTitle: "Bật Toàn Bộ Phiên Bàn?",
  posTableSessionOpenAllConfirm: "Tất cả bàn chưa mở sẽ bắt đầu nhận đơn QR.",
  posTableSessionExtendAllTitle: "Gia Hạn Toàn Bộ Phiên Bàn?",
  posTableSessionExtendAllConfirm:
    "Tất cả bàn đang mở sẽ được gia hạn thêm thời gian nhận đơn QR.",
});
Object.assign(messages.en, {
  posTableSessionOpenAllTitle: "Open All Table Sessions?",
  posTableSessionOpenAllConfirm:
    "All unopened tables will begin accepting QR orders.",
  posTableSessionExtendAllTitle: "Extend All Table Sessions?",
  posTableSessionExtendAllConfirm:
    "All open tables will receive more time to accept QR orders.",
});
Object.assign(messages["zh-TW"], {
  posTableSessionOpenAllTitle: "開啟所有桌邊點餐？",
  posTableSessionOpenAllConfirm: "所有尚未開啟的桌位將開始接受 QR 點餐。",
  posTableSessionExtendAllTitle: "延長所有桌邊點餐？",
  posTableSessionExtendAllConfirm: "所有已開啟的桌位將延長接受 QR 點餐的時間。",
});

Object.assign(messages.vi, {
  printAgentAgentSection: "Print Agent",
  printAgentPrinters: "Máy in thuộc Agent",
});
Object.assign(messages.en, {
  printAgentAgentSection: "Print Agent",
  printAgentPrinters: "Printers managed by this Agent",
});
Object.assign(messages["zh-TW"], {
  printAgentAgentSection: "列印 Agent",
  printAgentPrinters: "此 Agent 管理的印表機",
});

Object.assign(promotionMessages.vi as Record<string, string>, {
  promotionPreviewScope: "Phạm vi áp dụng",
  promotionPreviewOrderScope: "Toàn bộ sản phẩm và topping trong đơn hàng",
  promotionPreviewProductScope: "Chỉ sản phẩm",
  promotionPreviewAddonScope: "Chỉ topping",
  promotionPreviewLineScope: "Sản phẩm và topping của cùng một món",
  promotionPreviewProducts: "Sản phẩm được áp dụng",
  promotionPreviewAddons: "Topping được áp dụng",
  promotionPreviewAllProducts: "Tất cả sản phẩm",
  promotionPreviewAllAddons: "Tất cả topping",
  promotionPreviewNoStores: "Chưa gán cửa hàng nào",
  promotionPreviewLineIncludesAddons:
    "Giảm sản phẩm này và toàn bộ topping của nó",
});
Object.assign(promotionMessages.en as Record<string, string>, {
  promotionPreviewScope: "Applies to",
  promotionPreviewOrderScope: "All products and add-ons in the order",
  promotionPreviewProductScope: "Products only",
  promotionPreviewAddonScope: "Add-ons only",
  promotionPreviewLineScope: "Product and add-ons on the same line",
  promotionPreviewProducts: "Applied products",
  promotionPreviewAddons: "Applied add-ons",
  promotionPreviewAllProducts: "All products",
  promotionPreviewAllAddons: "All add-ons",
  promotionPreviewNoStores: "No assigned stores",
  promotionPreviewLineIncludesAddons:
    "Reduces this product and all of its add-ons",
});
Object.assign(promotionMessages["zh-TW"] as Record<string, string>, {
  promotionPreviewScope: "套用範圍",
  promotionPreviewOrderScope: "訂單中的所有商品與加料",
  promotionPreviewProductScope: "僅商品",
  promotionPreviewAddonScope: "僅加料",
  promotionPreviewLineScope: "同一品項的商品與加料",
  promotionPreviewProducts: "適用商品",
  promotionPreviewAddons: "適用加料",
  promotionPreviewAllProducts: "所有商品",
  promotionPreviewAllAddons: "所有加料",
  promotionPreviewNoStores: "尚未指派分店",
  promotionPreviewLineIncludesAddons: "折抵此商品及其所有加料",
});
Object.assign(messages.vi, {
  optionGroups: "Nhóm tùy chọn",
  addOptionGroup: "Thêm nhóm",
  removeOptionGroup: "Xóa nhóm",
  optionGroupName: "Tên nhóm",
  optionGroupOptions: "Các lựa chọn (phân cách bằng dấu phẩy)",
  optionGroupDefault: "Mặc định",
  optionGroupSingle: "Chọn một",
  optionGroupMultiple: "Chọn nhiều",
});
Object.assign(messages.en, {
  optionGroups: "Option groups",
  addOptionGroup: "Add group",
  removeOptionGroup: "Remove group",
  optionGroupName: "Group name",
  optionGroupOptions: "Options (comma separated)",
  optionGroupDefault: "Default",
  optionGroupSingle: "Choose one",
  optionGroupMultiple: "Choose many",
});
Object.assign(messages["zh-TW"], {
  optionGroups: "選項群組",
  addOptionGroup: "新增群組",
  removeOptionGroup: "刪除群組",
  optionGroupName: "群組名稱",
  optionGroupOptions: "選項（以逗號分隔）",
  optionGroupDefault: "預設",
  optionGroupSingle: "單選",
  optionGroupMultiple: "多選",
});

Object.assign(messages.vi, { contact: "Liên hệ" });
Object.assign(messages.en, { contact: "Contact" });
Object.assign(messages["zh-TW"], { contact: "聯絡資料" });

Object.assign(messages.vi, {
  printAgentCutEnabled: "Bật cắt giấy",
  printAgentCutFeedHex: "Lệnh đẩy giấy (hex)",
  printAgentCutCommandHex: "Lệnh cắt (hex)",
});
Object.assign(messages.en, {
  printAgentCutEnabled: "Enable paper cut",
  printAgentCutFeedHex: "Feed command (hex)",
  printAgentCutCommandHex: "Cut command (hex)",
});
Object.assign(messages["zh-TW"], {
  printAgentCutEnabled: "啟用切紙",
  printAgentCutFeedHex: "送紙指令（hex）",
  printAgentCutCommandHex: "切紙指令（hex）",
});

Object.assign(messages.vi, {
  printAgentTestFontSize: "Cỡ chữ",
  printAgentTestBold: "In đậm",
  printAgentTestCopies: "Số bản in",
});
Object.assign(messages.en, {
  printAgentTestFontSize: "Font size",
  printAgentTestBold: "Bold",
  printAgentTestCopies: "Copies",
});
Object.assign(messages["zh-TW"], {
  printAgentTestFontSize: "字型大小",
  printAgentTestBold: "粗體",
  printAgentTestCopies: "列印份數",
});

Object.assign(messages.vi, {
  addonUnlimited: "Không giới hạn",
  addonMaxQuantity: "Tối đa / 1 món",
});
Object.assign(messages.en, {
  addonUnlimited: "Unlimited",
  addonMaxQuantity: "Maximum per item",
});
Object.assign(messages["zh-TW"], {
  addonUnlimited: "不限數量",
  addonMaxQuantity: "每份上限",
});

Object.assign(messages.vi, {
  employeeCreate: "Thêm nhân viên",
  employeeEdit: "Sửa nhân viên",
  employeeName: "Tên nhân viên",
  employeeNumberId: "Mã nhân viên",
  employeeGenerateNumberId: "Tạo mã",
  employeeNumberIdHint: "Mã phải gồm đúng 4 chữ số",
  employeeNote: "Ghi chú",
  employeeList: "Danh sách nhân viên",
  employeeEmpty: "Chưa có nhân viên",
  employeeCreated: "Đã tạo nhân viên",
  employeeUpdated: "Đã cập nhật nhân viên",
  employeeDeleted: "Đã xóa nhân viên",
  employeeDelete: "Xóa nhân viên",
  employeeDeleteConfirm: "Bạn có chắc muốn xóa nhân viên này không?",
  employeeDuplicate: "Mã nhân viên đã tồn tại",
  employeeNumberIdInvalid: "Mã nhân viên phải gồm đúng 4 chữ số",
  employeeSaveError: "Không thể lưu nhân viên",
  employeeDeleteError: "Không thể xóa nhân viên",
});
Object.assign(messages.en, {
  employeeCreate: "Add employee",
  employeeEdit: "Edit employee",
  employeeName: "Employee name",
  employeeNumberId: "Employee ID",
  employeeGenerateNumberId: "Generate ID",
  employeeNumberIdHint: "The ID must contain exactly 4 digits",
  employeeNote: "Note",
  employeeList: "Employee list",
  employeeEmpty: "No employees yet",
  employeeCreated: "Employee created",
  employeeUpdated: "Employee updated",
  employeeDeleted: "Employee deleted",
  employeeDelete: "Delete employee",
  employeeDeleteConfirm: "Are you sure you want to delete this employee?",
  employeeDuplicate: "This employee ID already exists",
  employeeNumberIdInvalid: "The employee ID must contain exactly 4 digits",
  employeeSaveError: "Unable to save employee",
  employeeDeleteError: "Unable to delete employee",
});
Object.assign(messages["zh-TW"], {
  employeeCreate: "新增員工",
  employeeEdit: "編輯員工",
  employeeName: "員工名稱",
  employeeNumberId: "員工編號",
  employeeGenerateNumberId: "產生編號",
  employeeNumberIdHint: "編號必須正好包含 4 位數字",
  employeeNote: "備註",
  employeeList: "員工清單",
  employeeEmpty: "尚無員工",
  employeeCreated: "員工已建立",
  employeeUpdated: "員工已更新",
  employeeDeleted: "員工已刪除",
  employeeDelete: "刪除員工",
  employeeDeleteConfirm: "確定要刪除這位員工嗎？",
  employeeDuplicate: "員工編號已存在",
  employeeNumberIdInvalid: "員工編號必須正好包含 4 位數字",
  employeeSaveError: "無法儲存員工",
  employeeDeleteError: "無法刪除員工",
});

Object.assign(messages.vi, {
  employeeStatus: "Trạng thái",
  employeeActive: "Đang hoạt động",
  employeeInactive: "Ngừng hoạt động",
  employeeShowNumberId: "Hiện mã nhân viên",
  employeeHideNumberId: "Ẩn mã nhân viên",
});
Object.assign(messages.en, {
  employeeStatus: "Status",
  employeeActive: "Active",
  employeeInactive: "Inactive",
  employeeShowNumberId: "Show employee ID",
  employeeHideNumberId: "Hide employee ID",
});
Object.assign(messages["zh-TW"], {
  employeeStatus: "狀態",
  employeeActive: "啟用",
  employeeInactive: "停用",
  employeeShowNumberId: "顯示員工編號",
  employeeHideNumberId: "隱藏員工編號",
});

Object.assign(messages.vi, {
  employeeType: "Loại nhân viên",
  employeeOfficial: "Chính thức",
  employeePartTime: "Part-time",
  employeeRole: "Chức danh",
  employeeManager: "Quản lý",
  employeeStaff: "Nhân viên",
  employeeSalary: "Lương",
  employeeSalaryType: "Loại lương",
  employeeHourly: "Theo giờ",
  employeeMonthly: "Theo tháng",
  employeeSalaryAmount: "Mức lương",
  employeeHourShort: "giờ",
  employeeMonthShort: "tháng",
  employeeStartDate: "Ngày vào làm",
  employeeEndDate: "Ngày kết thúc",
  attendancePage: "Chấm công",
  attendanceDate: "Ngày chấm công",
  attendanceList: "Danh sách chấm công",
  attendanceEmpty: "Chưa có dữ liệu chấm công",
  attendanceStatus: "Trạng thái",
  attendanceWorking: "Đang làm",
  attendanceDone: "Đã hoàn tất",
  workingHours: "Số giờ làm",
  attendanceSessions: "Các phiên làm việc",
  attendanceStartTime: "Thời gian bắt đầu",
  attendanceEndTime: "Thời gian kết thúc",
  attendanceWorkDate: "Ngày làm việc",
  attendanceHours: "giờ",
  attendanceMinutes: "phút",
  attendanceEdit: "Chỉnh sửa chấm công",
  attendanceEditReason: "Lý do chỉnh sửa",
  attendanceEditReasonPlaceholder: "Nhập lý do chỉnh sửa thời gian",
  attendanceEditSuccess: "Đã cập nhật thời gian chấm công",
  attendanceEditFailure: "Không thể cập nhật thời gian chấm công",
  attendanceReasonRequired: "Vui lòng nhập lý do chỉnh sửa",
  attendanceInvalidTime: "Thời gian tan làm phải sau thời gian vào làm",
  attendanceOverlap: "Phiên chấm công bị trùng với phiên khác",
  attendanceEmployeeSearch: "Tìm tên hoặc mã nhân viên",
  attendanceSearch: "Tìm kiếm",
});
Object.assign(messages.en, {
  employeeType: "Employment type",
  employeeOfficial: "Official",
  employeePartTime: "Part-time",
  employeeRole: "Role",
  employeeManager: "Manager",
  employeeStaff: "Employee",
  employeeSalary: "Salary",
  employeeSalaryType: "Salary type",
  employeeHourly: "Hourly",
  employeeMonthly: "Monthly",
  employeeSalaryAmount: "Salary amount",
  employeeHourShort: "hour",
  employeeMonthShort: "month",
  employeeStartDate: "Start date",
  employeeEndDate: "End date",
  attendancePage: "Attendance",
  attendanceDate: "Attendance date",
  attendanceList: "Attendance list",
  attendanceEmpty: "No attendance records",
  attendanceStatus: "Status",
  attendanceWorking: "Working",
  attendanceDone: "Completed",
  workingHours: "Working hours",
  attendanceSessions: "Work sessions",
  attendanceStartTime: "Start time",
  attendanceEndTime: "End time",
  attendanceWorkDate: "Work date",
  attendanceHours: "hours",
  attendanceMinutes: "minutes",
  attendanceEdit: "Edit attendance",
  attendanceEditReason: "Adjustment reason",
  attendanceEditReasonPlaceholder: "Enter the reason for changing the time",
  attendanceEditSuccess: "Attendance time updated",
  attendanceEditFailure: "Unable to update attendance time",
  attendanceReasonRequired: "Please enter an adjustment reason",
  attendanceInvalidTime: "Check-out must be after check-in",
  attendanceOverlap: "This attendance session overlaps another session",
  attendanceEmployeeSearch: "Search name or employee ID",
  attendanceSearch: "Search",
});
Object.assign(messages["zh-TW"], {
  employeeType: "員工類型",
  employeeOfficial: "正式員工",
  employeePartTime: "兼職",
  employeeRole: "職稱",
  employeeManager: "管理員",
  employeeStaff: "員工",
  employeeSalary: "薪資",
  employeeSalaryType: "薪資類型",
  employeeHourly: "時薪",
  employeeMonthly: "月薪",
  employeeSalaryAmount: "薪資金額",
  employeeHourShort: "時",
  employeeMonthShort: "月",
  employeeStartDate: "到職日",
  employeeEndDate: "結束日期",
  attendancePage: "出勤",
  attendanceDate: "出勤日期",
  attendanceList: "出勤清單",
  attendanceEmpty: "尚無出勤資料",
  attendanceStatus: "狀態",
  attendanceWorking: "工作中",
  attendanceDone: "已完成",
  workingHours: "工作時數",
  attendanceSessions: "工作時段",
  attendanceStartTime: "開始時間",
  attendanceEndTime: "結束時間",
  attendanceWorkDate: "工作日期",
  attendanceHours: "時",
  attendanceMinutes: "分",
  attendanceEdit: "編輯出勤",
  attendanceEditReason: "修改原因",
  attendanceEditReasonPlaceholder: "輸入修改時間的原因",
  attendanceEditSuccess: "出勤時間已更新",
  attendanceEditFailure: "無法更新出勤時間",
  attendanceReasonRequired: "請輸入修改原因",
  attendanceInvalidTime: "結束時間必須晚於開始時間",
  attendanceOverlap: "此出勤時段與其他時段重疊",
  attendanceEmployeeSearch: "搜尋姓名或員工編號",
  attendanceSearch: "搜尋",
});

Object.assign(messages.vi, {
  checkEmployee: "Kiểm tra mã nhân viên",
  attendanceVerify: "Kiểm tra",
  employeeLocked: "Mã sai quá nhiều lần, thử lại sau",
});
Object.assign(messages.en, {
  checkEmployee: "Check employee ID",
  attendanceVerify: "Verify",
  employeeLocked: "Too many failed attempts, try again later",
});
Object.assign(messages["zh-TW"], {
  checkEmployee: "驗證員工編號",
  attendanceVerify: "驗證",
  employeeLocked: "錯誤次數過多，請稍後再試",
});

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
