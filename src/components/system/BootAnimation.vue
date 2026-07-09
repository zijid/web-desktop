<script setup>
/**
 * BootAnimation — Win10 风格开机动画
 * 全屏加载遮罩，完成后自动过渡到桌面
 */
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['ready', 'complete'])
const logRef = ref(null)

// ===== 从 localStorage 读取设置 =====
const bootEnabled = localStorage.getItem('web-desktop-boot-enabled') !== 'false'
const showLogs = localStorage.getItem('web-desktop-boot-show-logs') !== 'false'
const bootTime = parseInt(localStorage.getItem('web-desktop-boot-time') || '5', 10)

// ===== 加载步骤定义 =====
const steps = [
  { id: 'init', label: '正在初始化文件系统...' },
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

// ===== 模拟加载流程 =====
async function runBootSequence() {
  if (!bootEnabled) {
    // 不显示动画，直接完成
    visible.value = false
    emit('complete')
    return
  }

  // 步骤 0: 系统初始化
  addLog('正在初始化文件系统...')
  currentStep.value = 0
  await delay(400 + Math.random() * 300)

  // 步骤 1: 配置
  addLog('正在加载配置...')
  currentStep.value = 1
  addLog('已读取系统配置')
  await delay(300 + Math.random() * 200)

  // 步骤 2: 应用注册
  addLog('正在注册应用程序...')
  currentStep.value = 2
  addLog('文件系统就绪')
  addLog('应用注册完成')
  await delay(400 + Math.random() * 300)

  // 步骤 3: 桌面准备
  addLog('正在准备桌面...')
  currentStep.value = 3
  addLog('壁纸加载完毕')
  addLog('桌面图标就绪')
  await delay(300 + Math.random() * 200)

  // 步骤 4: 完成
  addLog('正在完成启动...')
  currentStep.value = 4
  addLog('系统启动完成')
  await delay(300)

  finished.value = true
  addLog('欢迎使用 Web Desktop')

  // 通知 App 开始渲染桌面（动画还在播放，桌面会在底下加载）
  emit('ready')

  // 等待动画播放完毕，然后淡出
  await delay(600)
  visible.value = false
  emit('complete')
}

// 计算各步骤的固定和随机延迟基数（毫秒）
const TOTAL_BASE_MS = 1700  // 各步骤固定延迟总和（不含随机部分和最终延迟）
const TOTAL_RANDOM_MS = 1000  // 各步骤随机部分总和
const TOTAL_FINAL_MS = 600    // 最终淡出延迟

function delay(ms) {
  // 将用户设置的总时间（秒）转换为各步骤延迟乘数
  // 用户设置的时间 = 总延迟时间（不含最终淡出）
  const targetTotalMs = bootTime * 1000 - TOTAL_FINAL_MS
  const baseTotalMs = TOTAL_BASE_MS + TOTAL_RANDOM_MS / 2  // 随机部分取中间值
  const scale = Math.max(0.1, targetTotalMs / baseTotalMs)
  return new Promise(r => setTimeout(r, ms * scale))
}

onMounted(() => {
  if (props.loading) return  // loading 模式只显示静态 UI
  runBootSequence()
})

// ===== 动画点 =====
const dotCount = ref(0)
let dotTimer = null

onMounted(() => {
  if (props.loading) return
  dotTimer = setInterval(() => {
    dotCount.value = (dotCount.value + 1) % 4
  }, 400)
})

</script>

<template>
  <div v-if="visible" class="boot-overlay" :class="{ 'boot-fadeout': finished }">
    <!-- Win10 风格背景 -->
    <div class="boot-bg"></div>

    <div class="boot-content">
      <!-- Logo / 系统图标 -->
      <div class="boot-logo">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="3" fill="#0078d4" stroke="#005a9e" stroke-width="2"/>
          <rect x="10" y="17" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <rect x="10" y="21" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <rect x="10" y="25" width="28" height="2" rx="1" fill="#ffffff" opacity="0.25"/>
          <circle cx="37" cy="26" r="2.5" fill="#ffffff"/>
        </svg>
      </div>

      <div class="boot-title">Web Desktop</div>

      <!-- 旋转加载点 -->
      <div class="boot-dots">
        <span class="dot" v-for="i in 3" :key="i"
          :style="{ animationDelay: (i * 0.2) + 's' }"></span>
      </div>

      <!-- 当前步骤 -->
      <div class="boot-step" :key="currentStep">
        <template v-if="steps[currentStep]">
          <svg class="step-icon" viewBox="0 0 48 48" fill="none">
            <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" fill="none" stroke="#0078d4" stroke-width="4" stroke-linejoin="round"/>
            <path d="M24 44V24" stroke="#0078d4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 14L24 24L42 14" stroke="#0078d4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ steps[currentStep].label }}</span>
        </template>
      </div>

      <!-- 步骤进度条 -->
      <div class="boot-progress-bar">
        <div class="boot-progress-fill" :style="{ width: ((currentStep + 1) / steps.length * 100) + '%' }"></div>
      </div>

      <!-- 加载日志（可收起） -->
      <div v-if="showLogs && !finished" ref="logRef" class="boot-logs">
        <div v-for="(line, idx) in logLines" :key="idx" class="boot-log-line">{{ line }}</div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="boot-footer">
      <span class="boot-footer-text">Web Desktop v1.0</span>
    </div>
  </div>
</template>

<style scoped>
.boot-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  color: #fff;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  transition: opacity 0.5s ease;
}

.boot-overlay.boot-fadeout {
  opacity: 0;
  pointer-events: none;
}

.boot-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(0,120,212,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(0,188,212,0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(156,39,176,0.08) 0%, transparent 50%);
}

.boot-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  min-width: 340px;
}

.boot-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  animation: bootLogoPulse 2s ease-in-out infinite;
}

.boot-logo svg {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 2px 12px rgba(0,120,212,0.4));
}

@keyframes bootLogoPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

.boot-title {
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 2px;
  color: #e0e0e0;
  margin-bottom: 24px;
}

/* 旋转加载点 */
.boot-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0078d4;
  animation: dotBounce 0.8s ease-in-out infinite;
}

@keyframes dotBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-8px); opacity: 1; }
}

/* 当前步骤文本 */
.boot-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #a0a0a0;
  margin-bottom: 12px;
  animation: stepFadeIn 0.3s ease;
}

@keyframes stepFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.step-icon svg {
  width: 16px;
  height: 16px;
}

/* 进度条 */
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

/* 加载日志 */
.boot-logs {
  width: 340px;
  max-height: 160px;
  overflow-y: auto;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 4px;
  /* custom scrollbar */
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

/* 底部 */
.boot-footer {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.boot-footer-text {
  font-size: 10px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1px;
}
</style>
