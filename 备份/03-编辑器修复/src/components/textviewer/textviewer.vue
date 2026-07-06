<script setup>
/**
 * 文本查看器 - 从虚拟文件系统读取/编辑文件
 * 使用 readFile() 替代 fetch()，支持虚拟文件路径
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import { readFile } from '@/utils/file'
import { windowList } from '@/hooks'
import { closeWindow } from '@/system/window'

const props = defineProps({
  title: { type: String, default: '文本查看器' },
  pid: { type: Number, default: 0 },
  pwd: { type: String, default: '' },
  filePath: { type: String, default: '' },
  args: { type: String, default: '' }
})

const content = ref('')
const fileUrl = ref('')
const lineCount = ref(1)
const statusText = ref('准备就绪')
const isLoading = ref(false)
const isModified = ref(false)
const wrapMode = ref(true)
const fileSize = ref(0)
const fileObject = ref(null)
const showGutter = ref(true)
const currentPath = ref('')

function updateLineCount() {
  lineCount.value = (content.value.match(/\n/g) || []).length + 1
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i]
}

async function loadFile(path) {
  if (!path) {
    statusText.value = '无文件路径'
    return
  }

  currentPath.value = path
  fileUrl.value = path
  isLoading.value = true
  statusText.value = '加载中...'

  try {
    const file = await readFile(path)
    if (!file) {
      throw new Error('文件不存在')
    }

    fileObject.value = file
    const text = file.content !== undefined ? file.content : ''
    content.value = typeof text === 'string' ? text : String(text)
    fileSize.value = new Blob([content.value]).size
    updateLineCount()
    statusText.value = '已加载'
    isModified.value = false
  } catch (err) {
    statusText.value = '加载失败'
    content.value = '// 无法加载文件: ' + err.message + '\n// 路径: ' + path
    updateLineCount()
  } finally {
    isLoading.value = false
  }
}

async function saveFile() {
  if (!fileObject.value) {
    statusText.value = '无文件可保存'
    return
  }
  try {
    await fileObject.value.write(content.value)
    await fileObject.value.save()
    isModified.value = false
    statusText.value = '已保存'
    fileSize.value = new Blob([content.value]).size
    setTimeout(() => { statusText.value = '已加载' }, 2000)
  } catch (err) {
    statusText.value = '保存失败'
    console.error('save failed', err)
  }
}

function handleInput() {
  updateLineCount()
  if (!isModified.value) {
    isModified.value = true
    statusText.value = '已修改'
  }
}

function handleKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = e.target
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = content.value.substring(0, start)
    const after = content.value.substring(end)
    content.value = before + '  ' + after
    updateLineCount()
    isModified.value = true
    statusText.value = '已修改'
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + 2
    })
  }
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveFile()
  }
}

onMounted(() => {
  const targetArg = props.args || props.filePath
  if (targetArg) {
    // 避免重复打开
    const dupCount = windowList.filter(w =>
      w.title && w.title.includes(targetArg) && w.pid !== props.pid
    ).length
    if (dupCount > 0) {
      setTimeout(() => {
        if (props.pid) closeWindow(props.pid)
      }, 50)
      return
    }
  }

  const path = props.args || props.filePath
  console.log('[TextViewer] mounted, path:', path)
  if (path) loadFile(path)
})

const lines = computed(() => content.value.split('\n'))
</script>

<template>
  <div class="textviewer-wrap">
    <!-- 工具栏 -->
    <div class="textviewer-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-path" :title="fileUrl">{{ fileUrl || '新文件' }}</span>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" @click="saveFile" :disabled="!isModified" title="保存 (Ctrl+S)">
          <svg viewBox="0 0 48 48"><path d="M40 42H8C7.44772 42 7 41.5523 7 41V7C7 6.44772 7.44772 6 8 6H32L41 15V41C41 41.5523 40.5523 42 40 42Z" stroke="currentColor" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M14 6H20V14H14V6Z" stroke="currentColor" stroke-width="4" fill="none" stroke-linejoin="round"/></svg>
          保存
        </button>
        <div class="tb-sep"></div>
        <label class="wrap-toggle" title="自动换行">
          <input type="checkbox" v-model="wrapMode" />
          <span>换行</span>
        </label>
        <div class="tb-sep"></div>
        <span class="toolbar-info">{{ lineCount }} 行</span>
        <span class="toolbar-info">{{ formatFileSize(fileSize) }}</span>
        <span class="toolbar-status" :class="{ modified: isModified, loading: isLoading }">{{ statusText }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="textviewer-body" :class="{ 'wrap-on': wrapMode }">
      <div class="line-numbers" v-if="showGutter">
        <div v-for="n in lineCount" :key="n" class="line-num">{{ n }}</div>
      </div>
      <textarea
        class="text-editor"
        v-model="content"
        @input="handleInput"
        @keydown="handleKeydown"
        spellcheck="false"
        wrap="off"
        placeholder="文件内容将在此显示..."
      ></textarea>
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="textviewer-statusbar">
      <span class="status-left">
        <span v-if="fileObject" class="status-item">文件: {{ fileObject.nickname || fileObject.name }}</span>
        <span v-else class="status-item">文本查看器</span>
      </span>
      <span class="status-right">
        <span class="status-item" :class="{ 'status-modified': isModified }">
          {{ isModified ? '已修改' : '只读模式' }}
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.textviewer-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', 'Microsoft YaHei', monospace;
  font-size: 13px;
}

/* 工具栏 */
.textviewer-toolbar {
  display: flex;
  align-items: center;
  padding: 3px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  gap: 10px;
  min-height: 30px;
  flex-shrink: 0;
}
.toolbar-left {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}
.toolbar-path {
  color: #999;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: transparent;
  border: 1px solid transparent;
  color: #d4d4d4;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  white-space: nowrap;
}
.tool-btn:hover { background: #3c3c3c; border-color: #505050; }
.tool-btn:active { background: #505050; }
.tool-btn:disabled { opacity: 0.4; cursor: default; }
.tool-btn:disabled:hover { background: transparent; border-color: transparent; }
.tool-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

.tb-sep {
  width: 1px;
  height: 18px;
  background: #3c3c3c;
  flex-shrink: 0;
}

.wrap-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.wrap-toggle input { margin: 0; accent-color: #0078d4; }

.toolbar-info {
  color: #666;
  font-size: 11px;
  white-space: nowrap;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.toolbar-status {
  color: #666;
  font-size: 11px;
  padding: 1px 6px;
  min-width: 50px;
  text-align: right;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.toolbar-status.modified { color: #e8bf6a; }
.toolbar-status.loading { color: #e8bf6a; }

/* 主体 */
.textviewer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
.textviewer-body.wrap-on .text-editor {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 行号 */
.line-numbers {
  background: #252526;
  padding: 6px 0;
  text-align: right;
  user-select: none;
  min-width: 44px;
  border-right: 1px solid #3c3c3c;
  flex-shrink: 0;
  overflow: hidden;
}
.line-num {
  padding: 0 10px 0 8px;
  color: #858585;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 编辑区 */
.text-editor {
  flex: 1;
  padding: 6px 14px;
  background: transparent;
  border: none;
  outline: none;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  tab-size: 4;
  overflow: auto;
}
.text-editor::selection { background: #264f78; }
.text-editor::placeholder { color: #555; }
.text-editor::-webkit-scrollbar { width: 10px; height: 10px; }
.text-editor::-webkit-scrollbar-track { background: transparent; }
.text-editor::-webkit-scrollbar-thumb { background: #424242; border-radius: 5px; }
.text-editor::-webkit-scrollbar-thumb:hover { background: #555; }

/* 加载动画 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #888;
  background: rgba(30, 30, 30, 0.7);
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #3c3c3c;
  border-top-color: #0078d4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 状态栏 */
.textviewer-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 12px;
  background: #007acc;
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
  min-height: 22px;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.status-left, .status-right { display: flex; align-items: center; gap: 16px; }
.status-item { white-space: nowrap; }
.status-modified { font-weight: 600; }
</style>
