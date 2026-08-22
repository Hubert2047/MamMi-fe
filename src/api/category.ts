import api from './axios'

export interface Category {
    _id: string
    names: { vi: string; en: string; 'zh-TW': string }
}

export type CategoryNames = Category['names']

export const getCategories = async (): Promise<Category[]> => {
    const res = await api.get('categories').then((data) => data.data)
    return res.data
}

export const createCategory = async (names: CategoryNames) => {
    const res = await api.post('categories', { names })
    return res.data
}

export const deleteCategory = async (id: string) => {
    const res = await api.delete(`categories/${id}`)
    return res.data
}

// Sửa category
export const updateCategory = async (id: string, names: CategoryNames) => {
    const res = await api.put(`categories/${id}`, { names })
    return res.data
}
