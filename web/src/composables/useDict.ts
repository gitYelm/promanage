import { ref, onMounted } from 'vue'
import { listData } from '@/api/system/dict'
import type { SysDictData } from '@/api/system/types'

export interface DictOption {
  label: string
  value: string
  cssClass?: string
  listClass?: string
}

/**
 * 字典数据 composable
 * @param dictType 字典类型
 * @returns 字典选项列表和加载状态
 */
export function useDict(dictType: string) {
  const options = ref<DictOption[]>([])
  const loading = ref(false)

  async function loadDict() {
    loading.value = true
    try {
      const res = await listData({ dictType, pageNum: 1, pageSize: 100 })
      options.value = (res.rows || [])
        .filter((item: SysDictData) => item.status === '0')
        .map((item: SysDictData) => ({
          label: item.dictLabel,
          value: item.dictValue,
          cssClass: item.cssClass,
          listClass: item.listClass,
        }))
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadDict()
  })

  return {
    options,
    loading,
    reload: loadDict,
  }
}

/**
 * 根据字典值获取标签
 */
export function getDictLabel(options: DictOption[], value: string): string {
  const item = options.find((opt) => opt.value === value)
  return item?.label || value
}
