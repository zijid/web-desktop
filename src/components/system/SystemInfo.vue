<template>
  <ZDialog
    :modelValue="visible"
    @update:modelValue="$emit('close')"
    title="系统信息"
    size="small"
  >
    <div class="system-info">
      <div class="info-row">
        <span class="info-label">应用</span>
        <span class="info-value">Web Desktop</span>
      </div>
      <div class="info-row">
        <span class="info-label">版本</span>
        <span class="info-value">1.0</span>
      </div>
      <div class="info-row">
        <span class="info-label">分辨率</span>
        <span class="info-value">{{ screenWidth }} &times; {{ screenHeight }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">应用数量</span>
        <span class="info-value">{{ appCount }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">桌面文件</span>
        <span class="info-value">{{ fileCount }}</span>
      </div>
    </div>
    <template #footer>
      <ZButton @click="$emit('close')">确定</ZButton>
    </template>
  </ZDialog>
</template>

<script setup>
import { computed } from 'vue'
import { ZDialog, ZButton } from 'zijid-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  appCount: { type: Number, default: 0 },
  fileCount: { type: Number, default: 0 }
})

defineEmits(['close'])

const screenWidth = computed(() => window.screen.width)
const screenHeight = computed(() => window.screen.height)
</script>

<style scoped>
.system-info {
  padding: 4px 0;
}
.info-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  width: 80px;
  color: #666;
  font-size: 13px;
  flex-shrink: 0;
}
.info-value {
  color: #1b1a19;
  font-size: 13px;
  font-weight: 500;
}
</style>
