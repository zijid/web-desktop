<script setup>
/**
 * BootAnimation — 简化版开机动画，可配置
 */
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['ready', 'complete'])
const logRef = ref(null)

const bootEnabled = localStorage.getItem('web-desktop-boot-enabled') !== 'false'
const showLogs = localStorage.getItem('web-desktop-boot-show-logs') !== 'false'
const bootTime = parseInt(localStorage.getItem('web-desktop-boot-time') || '5', 10)

const steps = [
  { id: 'init', label: '正在初始化...' },
  { id: 'config', label: '正在加载配置...' },
  { id: 'apps', label: '正在注册应用程序...' },
  { id: 'desktop', label: '正在准备桌面...' },
  { id: 'finish', label: '正在完成启动...' }
]

const currentStep = ref(0)
const finished = ref(false)
const visible = ref(true)
const logLines = ref([])

function addLog(msg) {
  const t = new Date()
  const ts = t.getHours().toString().padStart(2, '0') + ':' +
            t.getMinutes().toString().padStart(2, '0') + ':' +
            t.getSeconds().toString().padStart(2, '0')
  logLines.value.push('[' + ts + '] ' + msg)
  nextTick(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight
    }
  })
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function runBootSequence() {
  if (!bootEnabled) {
    emit('ready')
    emit('complete')
    visible.value = false
    return
  }

  const totalTime = bootTime * 1000
  const stepTime = totalTime / steps.length

  for (let i = 0; i < steps.length; i++) {
    currentStep.value = i
    addLog(steps[i].label)
    await delay(stepTime * 0.3)
    addLog(steps[i].label + ' ✓')
    await delay(stepTime * 0.7)
  }

  finished.value = true
  addLog('系统启动完成')
  addLog('欢迎使用 Web Desktop')

  emit('ready')
  await delay(500)
  visible.value = false
  emit('complete')
}

onMounted(() => {
  if (props.loading) return
  runBootSequence()
})
</script>

<template>
  <div v-if="visible" class="boot-overlay" :class="{ 'boot-fadeout': finished }">
    <div class="boot-content">
      <div class="boot-logo">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="4" y="10" width="40" height="28" rx="3" fill="#0078d4" stroke="#005a9e" stroke-width="2"/>
          <rect x="10" y="17" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <rect x="10" y="21" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <rect x="10" y="25" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <circle cx="37" cy="26" r="2.5" fill="#ffffff"/>
        </svg>
      </div>
      <div class="boot-title">Web Desktop</div>

      <div class="boot-progress-bar">
        <div class="boot-progress-fill" :style="{ width: ((currentStep + 1) / steps.length * 100) + '%' }"></div>
      </div>

      <div class="boot-step">{{ steps[currentStep]?.label || '' }}</div>

      <div v-if="showLogs" ref="logRef" class="boot-logs">
        <div v-for="(line, idx) in logLines" :key="idx" class="boot-log-line">{{ line }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boot-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  color: #fff;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  transition: opacity 0.3s ease;
}
.boot-overlay.boot-fadeout {
  opacity: 0;
  pointer-events: none;
}
.boot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 320px;
}
.boot-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}
.boot-logo svg {
  width: 64px;
  height: 64px;
}
.boot-title {
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 2px;
  color: #e0e0e0;
  margin-bottom: 24px;
}
.boot-progress-bar {
  width: 300px;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}
.boot-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0078d4, #00bcd4);
  border-radius: 2px;
  transition: width 0.4s ease;
}
.boot-step {
  font-size: 13px;
  color: #a0a0a0;
  margin-bottom: 12px;
}
.boot-logs {
  width: 340px;
  max-height: 160px;
  overflow-y: auto;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,120,212,0.4) rgba(0,0,0,0.15);
}
.boot-logs::-webkit-scrollbar {
  width: 6px;
}
.boot-logs::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}
.boot-logs::-webkit-scrollbar-thumb {
  background: rgba(0,120,212,0.4);
  border-radius: 3px;
}
.boot-logs::-webkit-scrollbar-thumb:hover {
  background: rgba(0,120,212,0.6);
}
.boot-log-line {
  font-size: 11px;
  font-family: 'Consolas', monospace;
  color: #7a7a7a;
  line-height: 1.8;
  white-space: nowrap;
}
.boot-log-line:last-child {
  color: #00bcd4;
}
</style>
