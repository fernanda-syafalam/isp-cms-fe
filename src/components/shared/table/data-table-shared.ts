// Shared bits for the DataTable and its two body renderers (mobile card list +
// desktop grid). Kept in one module so the column-meta augmentation and the
// alignment helpers have a single home.

declare module '@tanstack/react-table' {
  // Per-column display hints consumed by DataTable.
  interface ColumnMeta<TData, TValue> {
    align?: 'right' | 'center'
    title?: string
  }
}

export const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

export const alignClass = (align: 'right' | 'center' | undefined) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : undefined

// Mirror a column's text alignment onto its fixed-width loading skeleton so the
// placeholder sits under where the real value will land (right/center columns).
export const skeletonAlign = (align: 'right' | 'center' | undefined) =>
  align === 'right' ? 'ml-auto' : align === 'center' ? 'mx-auto' : undefined
