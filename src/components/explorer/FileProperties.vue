<template>
  <ZDialog
    :modelValue="visible"
    @update:modelValue="$emit('close')"
    title="属性"
    size="small"
  >
    <div class="file-props">
      <div class="info-row">
        <span class="info-label">名称</span>
        <span class="info-value">{{ file.name || '--' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">路径</span>
        <span class="info-value path">{{ file.path || '--' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">类型</span>
        <span class="info-value">{{ file.type === 'WebDir' ? '文件夹' : '文件' }}</span>
      </div>
      <div class="info-row" v-if="file.type !== 'WebDir'">
        <span class="info-label">扩展名</span>
        <span class="info-value">{{ file.extension || '--' }}</span>
      </div>
      <div class="info-row" v-if="file.type !== 'WebDir'">
        <span class="info-label">大小</span>
        <span class="info-value">{{ file.size ? formatSize(file.size) : '--' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">创建时间</span>
        <span class="info-value">{{ file.createTime ? formatTime(file.createTime) : '--' }}</span>
      </div>
      <div class="info-row" v-if="file.modifyTime">
        <span class="info-label">修改时间</span>
        <span class="info-value">{{ formatTime(file.modifyTime) }}</span>
      </div>
    </div>
    <template #footer>
      <ZButton @click="$emit('close')">确定</ZButton>
    </template>
  </ZDialog>
</template>

<script setup>
import { ZDialog, ZButton } from 'zijid-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: Object, default: () => ({}) }
})

defineEmits(['close'])

function formatSize(bytes) {
  if (!bytes) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return size.toFixed(1) + ' ' + units[i]
}

function formatTime(ts) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
.file-props {
  padding: 4px 0;
}
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  width: 72px;
  color: #666;
  font-size: 13px;
  flex-shrink: 0;
}
.info-value {
  color: #1b1a19;
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
}
.info-value.path {
  font-weight: 400;
  font-size: 12px;
  color: #555;
}
</style>
