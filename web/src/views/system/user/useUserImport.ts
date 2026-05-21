import { ref } from 'vue'
import { downloadUserTemplate, importUserExcel } from '@/api/system/user'

type ToastFn = (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void

export function useUserImport(toast: ToastFn, refresh: () => void) {
  const showImportDialog = ref(false)
  const importFile = ref<File | null>(null)
  const importLoading = ref(false)
  const updateSupport = ref(false)
  const importResult = ref<{ success: number; fail: number; errors: string[] } | null>(null)

  function handleImport() {
    importFile.value = null
    updateSupport.value = false
    importResult.value = null
    showImportDialog.value = true
  }

  async function handleDownloadTemplate() {
    try {
      const res = await downloadUserTemplate()
      const blob = new Blob([res as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = '用户导入模板.xlsx'
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast({ title: '下载失败', variant: 'destructive' })
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files && target.files[0]) importFile.value = target.files[0]
  }

  async function confirmImport() {
    if (!importFile.value) {
      toast({ title: '请选择文件', variant: 'destructive' })
      return
    }
    importLoading.value = true
    try {
      const result = await importUserExcel(importFile.value, updateSupport.value)
      importResult.value = result
      if (result.success > 0) {
        toast({ title: '导入完成', description: `成功 ${result.success} 条，失败 ${result.fail} 条` })
        refresh()
      }
    } catch {
      toast({ title: '导入失败', variant: 'destructive' })
    } finally {
      importLoading.value = false
    }
  }

  return {
    showImportDialog,
    importFile,
    importLoading,
    updateSupport,
    importResult,
    handleImport,
    handleDownloadTemplate,
    handleFileChange,
    confirmImport,
  }
}
