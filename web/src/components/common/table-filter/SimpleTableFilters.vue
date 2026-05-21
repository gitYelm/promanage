<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'

export type QueryState = Record<string, string | number | undefined>
export type FilterOption = { label: string; value: string | number }
export type FilterField = {
  label: string
  key?: string
  type?: 'text' | 'select' | 'number-range' | 'date-range' | 'datetime-range'
  placeholder?: string
  options?: FilterOption[]
  startKey?: string
  endKey?: string
  startPlaceholder?: string
  endPlaceholder?: string
  min?: string | number
  max?: string | number
}

const props = withDefaults(
  defineProps<{
    query: QueryState
    fields: FilterField[]
    expandedFields?: FilterField[]
    description?: string
  }>(),
  {
    expandedFields: () => [],
    description: '默认展示常用条件，展开后可使用完整筛选。',
  },
)

const emit = defineEmits<{
  search: []
  reset: []
}>()

const hasExpanded = computed(() => props.expandedFields.length > 0)

function fieldId(field: FilterField, index: number) {
  return `table-filter-${field.key || field.startKey || 'field'}-${index}`
}

function isRangeField(field: FilterField) {
  return ['number-range', 'date-range', 'datetime-range'].includes(field.type || '')
}

function rangeInputType(field: FilterField) {
  if (field.type === 'number-range') return 'number'
  if (field.type === 'datetime-range') return 'datetime-local'
  return 'date'
}

function optionValue(option: FilterOption) {
  return option.value ?? ''
}

function inputModel(key?: string) {
  return key ? props.query[key] : ''
}

function updateInputModel(key: string | undefined, value: string | number) {
  if (key) props.query[key] = value
}
</script>

<template>
  <TableFilterPanel :description="description">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <template v-for="(field, index) in fields" :key="field.key || field.startKey || field.label">
        <div v-if="field.type === 'select'" class="space-y-1">
          <Label :for="fieldId(field, index)">{{ field.label }}</Label>
          <Select v-model="query[field.key!]">
            <SelectTrigger :id="fieldId(field, index)"><SelectValue :placeholder="field.placeholder" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in field.options || []" :key="option.value" :value="optionValue(option)">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FilterRangeField
          v-else-if="isRangeField(field)"
          v-model:start="query[field.startKey!]"
          v-model:end="query[field.endKey!]"
          :label="field.label"
          :type="rangeInputType(field)"
          :min="field.min"
          :max="field.max"
          :start-placeholder="field.startPlaceholder"
          :end-placeholder="field.endPlaceholder"
        />
        <div v-else class="space-y-1">
          <Label :for="fieldId(field, index)">{{ field.label }}</Label>
          <Input
            :id="fieldId(field, index)"
            :model-value="inputModel(field.key)"
            :placeholder="field.placeholder"
            @update:model-value="updateInputModel(field.key, $event)"
            @keyup.enter="emit('search')"
          />
        </div>
      </template>
      <div class="flex items-end gap-2">
        <Button data-permission-neutral @click="emit('search')">搜索</Button>
        <Button variant="outline" data-permission-neutral @click="emit('reset')">重置</Button>
      </div>
    </div>

    <template v-if="hasExpanded" #expanded>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <template v-for="(field, index) in expandedFields" :key="field.key || field.startKey || field.label">
          <div v-if="field.type === 'select'" class="space-y-1">
            <Label :for="fieldId(field, index)">{{ field.label }}</Label>
            <Select v-model="query[field.key!]">
              <SelectTrigger :id="fieldId(field, index)"><SelectValue :placeholder="field.placeholder" /></SelectTrigger>
              <SelectContent>
                  <SelectItem v-for="option in field.options || []" :key="option.value" :value="optionValue(option)">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FilterRangeField
            v-else-if="isRangeField(field)"
            v-model:start="query[field.startKey!]"
            v-model:end="query[field.endKey!]"
            :label="field.label"
            :type="rangeInputType(field)"
            :min="field.min"
            :max="field.max"
            :start-placeholder="field.startPlaceholder"
            :end-placeholder="field.endPlaceholder"
          />
          <div v-else class="space-y-1">
            <Label :for="fieldId(field, index)">{{ field.label }}</Label>
            <Input
              :id="fieldId(field, index)"
              :model-value="inputModel(field.key)"
              :placeholder="field.placeholder"
              @update:model-value="updateInputModel(field.key, $event)"
              @keyup.enter="emit('search')"
            />
          </div>
        </template>
      </div>
    </template>
  </TableFilterPanel>
</template>
