import api from './axios'

export interface Category {
    _id: string
    names: { vi: string; en: string; 'zh-TW': string }
    sortOrder: number
}

export type CategoryNames = Category['names']

export const getCategories = async (): Promise<Category[]> => {
    const res = await api.get('categories').then((data) => data.data)
    return res.data
}

export const createCategory = async (data: { names: CategoryNames; sortOrder: number }) => {
    const res = await api.post('categories', data)
    return res.data
}

export const deleteCategory = async (id: string) => {
    const res = await api.delete(`categories/${id}`)
    return res.data
}

// Sửa category
export const updateCategory = async (id: string, data: { names: CategoryNames; sortOrder: number }) => {
    const res = await api.put(`categories/${id}`, data)
    return res.data
}
