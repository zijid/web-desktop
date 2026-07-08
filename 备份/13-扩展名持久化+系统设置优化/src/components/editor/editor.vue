<script setup>
/**
 * 代码编辑器 - 查看和编辑源代码
 */
import { ref, onMounted, nextTick } from 'vue'
import { readFile } from '@/utils/file'
import { windowList } from '@/hooks'
import { closeWindow } from '@/system/window'

const props = defineProps({
  title: { type: String, default: '代码编辑器' },
  pid: { type: Number, default: 0 },
  pwd: { type: String, default: '' },
  filePath: { type: String, default: '' },
  args: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const code = ref('')
const fileUrl = ref('')
const lineCount = ref(1)
const statusText = ref('准备就绪')
const isModified = ref(false)
const showGutter = ref(true)

function updateLineCount() {
  lineCount.value = (code.value.match(/\n/g) || []).length + 1
}

function loadFile(url) {
  // 去除 view-source: 前缀
  let realUrl = url
  if (realUrl.startsWith('view-source:')) {
    realUrl = realUrl.replace(/^view-source:/, '')
  }
  fileUrl.value = realUrl
  statusText.value = '加载中...'
  
  // 对于源文件，尝试使用 raw 参数获取原始内容
  let fetchUrl = realUrl
  if (realUrl.includes('/src/') && (realUrl.endsWith('.vue') || realUrl.endsWith('.js') || realUrl.endsWith('.css') || realUrl.endsWith('.html'))) {
    fetchUrl = realUrl + (realUrl.includes('?') ? '&' : '?') + 'raw'
  }
  
  fetch(fetchUrl)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText)
      return res.text()
    })
    .then(text => {
      code.value = text
      updateLineCount()
      statusText.value = '已加载'
    })
    .catch(err => {
      statusText.value = '加载失败'
      code.value = '// 无法加载文件: ' + err.message + '\n// URL: ' + realUrl
    })
}

function handleKeydown(e) {
  isModified.value = true
  statusText.value = '已修改'
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = e.target
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = code.value.substring(0, start)
    const after = code.value.substring(end)
    code.value = before + '  ' + after
    updateLineCount()
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + 2
    })
  }
}

function handleInput() {
  updateLineCount()
  isModified.value = true
  statusText.value = '已修改'
}

onMounted(() => {
  // 处理重复打开：检查是否已有相同 args 的编辑器窗口
  if (props.args || props.filePath) {
    const targetArg = props.args || props.filePath
    const existing = windowList.filter(w => 
      w.title && w.title.includes('source') && w.pid !== props.pid
    )
    // 如果有多个同内容的编辑器，关闭当前这个新开的
    const dupCount = windowList.filter(w => w.title && w.title.includes('source')).length
    if (dupCount > 1) {
      // 延迟关闭，避免冲突
      setTimeout(() => {
        if (props.pid) closeWindow(props.pid)
      }, 50)
      return
    }
  }
  
  const url = props.args || props.filePath
  console.log('[Editor] mounted, args:', props.args, 'filePath:', props.filePath, 'url:', url)
  if (url) loadFile(url)
})
</script>

<template>
  <div class="editor-wrap">
    <div class="editor-toolbar">
      <span class="editor-path" :title="fileUrl">{{ fileUrl || '新文件' }}</span>
      <span class="editor-info">{{ lineCount }} 行</span>
      <span class="editor-status" :class="{ modified: isModified }">{{ statusText }}</span>
    </div>
    <div class="editor-body">
      <div class="line-numbers" v-if="showGutter">
        <div v-for="n in lineCount" :key="n" class="line-num">{{ n }}</div>
      </div>
      <textarea
        class="editor-textarea"
        v-model="code"
        @input="handleInput"
        @keydown="handleKeydown"
        spellcheck="false"
        wrap="off"
        placeholder="在此输入代码..."
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.editor-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  font-size: 13px;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  gap: 12px;
  min-height: 28px;
  flex-shrink: 0;
}
.editor-path {
  flex: 1;
  color: #999;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-info {
  color: #666;
  font-size: 11px;
}
.editor-status {
  color: #666;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 2px;
}
.editor-status.modified {
  color: #e8bf6a;
  background: rgba(232, 191, 106, 0.1);
}
.editor-body {
  flex: 1;
  display: flex;
  overflow: auto;
}
.line-numbers {
  background: #252526;
  padding: 8px 0;
  text-align: right;
  user-select: none;
  min-width: 40px;
  border-right: 1px solid #3c3c3c;
}
.line-num {
  padding: 0 8px;
  color: #858585;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
.editor-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 12px;
  resize: none;
  tab-size: 2;
}
.editor-textarea::selection {
  background: #264f78;
}
.editor-textarea::placeholder {
  color: #555;
}
</style>
