<script setup>
/**
 * 记事本 — 仿 Win10 独立窗口
 * 使用 readFile/WebFile 读写，设置持久化到 localStorage
 * 提示弹窗使用 ZDialog（Teleport 到 body）
 * 另存为弹窗带文件浏览器
 */
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { readFile, readFileAll, WebFile } from '@/utils/file'
import { windowList } from '@/hooks'
import { closeWindow as sysCloseWindow, createWindow, showWindow, hideWindow } from '@/system/window'
import { ZDialog, ZButton, ZInput, useToast } from 'zijid-ui'

const toast = useToast()

const props = defineProps({
  title:      { type: String, default: '' },
  pid:        { type: Number, default: 0 },
  pwd:        { type: String, default: '' },
  filePath:   { type: String, default: '' },
  appId:      { type: String, default: '' },
  _hasWindow: { type: [Boolean, Number], default: false },
  args:       { type: String, default: '' },
  path:       { type: String, default: '' },
  targetPath: { type: String, default: '' },
  exec:       { type: [Object, Function, String], default: null }
})

const SETTINGS_KEY = 'notepad-settings'
function loadSettings() {
  try { const r = localStorage.getItem(SETTINGS_KEY); if (r) return JSON.parse(r) } catch {}
  return {}
}
function persistSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ wrapMode: wrapMode.value, showStatus: showStatus.value, showLines: showLines.value, autoSave: autoSave.value })) } catch {}
}
const _s = loadSettings()

const winEl = ref(null)
const winInfo = ref(null)
const isMax = ref(false)
const restore = reactive({ x:0, y:0, w:55, h:60 })
const pos = reactive({ x:0, y:0 })
const size = reactive({ w:55, h:60 })
const isFocused = ref(false)

const content = ref('')
const fileUrl = ref('')
const lineCount = ref(1)
const statusText = ref('就绪')
const isLoading = ref(false)
const isModified = ref(false)
const fileObj = ref(null)
const currentPath = ref('')
const wrapMode = ref(!!_s.wrapMode)
const showStatus = ref(_s.showStatus !== false)
const showLines = ref(_s.showLines !== false)
const autoSave = ref(_s.autoSave !== false)
const autoSaveTimer = ref(null)
const cursorPos = ref({ line:1, col:1 })
const taRef = ref(null)

const showSaveDialog = ref(false)
let pendingClose = false

// ── 另存为 ──
const showSaveAs = ref(false)
const saveAsDir = ref('/C/Desktop')
const saveAsName = ref('新建文本文档.txt')
const saNameRef = ref(null)
const saveAsList = ref([])
const saveAsLoading = ref(false)
let saveAsCallback = null
let saveAsCloseAfter = false  // 保存后是否关闭窗口

async function loadSaveAsDir() {
  saveAsLoading.value = true
  try {
    const items = await readFileAll(saveAsDir.value)
    saveAsList.value = items || []
  } catch { saveAsList.value = [] }
  finally { saveAsLoading.value = false }
}

function enterSaveDir(item) {
  if (item.type !== 'WebDir') return
  saveAsDir.value = item.path
  loadSaveAsDir()
}

function goUpSaveDir() {
  const p = saveAsDir.value
  const idx = p.lastIndexOf('/')
  saveAsDir.value = idx > 0 ? p.substring(0, idx) : '/'
  loadSaveAsDir()
}

function quickSaveDir(dir) {
  saveAsDir.value = dir
  loadSaveAsDir()
}

function openSaveAs(cb, closeAfter = false) {
  saveAsCallback = cb
  saveAsDir.value = props.pwd || '/C/Desktop'
  saveAsName.value = fileUrl.value ? fileUrl.value.split('/').pop() : '新建文本文档.txt'
  saveAsCloseAfter = closeAfter
  showSaveAs.value = true
  loadSaveAsDir()
}

async function confirmSaveAs() {
  if (!saveAsName.value.trim()) return
  if (saveAsCallback) {
    try {
      await saveAsCallback(saveAsDir.value, saveAsName.value.trim())
      toast.show({ title: '保存成功', message: `文件已保存到 ${saveAsName.value.trim()}`, type: 'success', duration: 3000 })
      if (saveAsCloseAfter) {
        sysCloseWindow(props.pid)
      }
    } catch (err) {
      toast.show({ title: '保存失败', message: err.message || '未知错误', type: 'error', duration: 4000 })
    }
    saveAsCallback = null
  }
  showSaveAs.value = false
  saveAsCloseAfter = false
  if (!saveAsName.value.trim()) return
  if (saveAsCallback) {
    saveAsCallback(saveAsDir.value, saveAsName.value.trim())
    saveAsCallback = null
  }
  showSaveAs.value = false
}

const fileSizeStr = computed(() => {
  const b = new Blob([content.value]).size
  if (b === 0) return '0 B'
  const u = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return (b / Math.pow(1024,i)).toFixed(1) + ' ' + u[i]
})

const titleText = computed(() => {
  const base = fileUrl.value ? fileUrl.value.split('/').pop() : '无标题 - 记事本'
  return (isModified.value ? '* ' : '') + base
})

const statusStr = computed(() => {
  if (isLoading.value) return '正在加载...'
  if (isModified.value) return '已修改'
  return statusText.value
})

function initWindow() {
  winInfo.value = createWindow(props.pid)
  if (!winInfo.value) return
  const w = window.innerWidth
  const h = window.innerHeight
  pos.x = Math.max(0, w * 0.5 - w * 0.275)
  pos.y = Math.max(0, h * 0.5 - h * 0.3)
  size.w = 55; size.h = 60
  Object.assign(restore, { x:pos.x, y:pos.y, w:55, h:60 })
}

function focusWin() {
  if (winInfo.value) { showWindow(winInfo.value.pid, 'window'); isFocused.value = true }
}

function minimize() { if (winInfo.value) hideWindow(winInfo.value.pid) }

function toggleMax() {
  isMax.value = !isMax.value
  if (isMax.value) {
    Object.assign(restore, { x:pos.x, y:pos.y, w:size.w, h:size.h })
    pos.x = 0; pos.y = 0; size.w = 100; size.h = 100
  } else {
    pos.x = restore.x; pos.y = restore.y; size.w = restore.w; size.h = restore.h
  }
}

function closeWin() {
  if (!props.pid) return
  if (isModified.value) { pendingClose = true; showSaveDialog.value = true }
  else sysCloseWindow(props.pid)
}

async function onSaveDialog(action) {
  showSaveDialog.value = false
  if (action === 'save') {
    const saved = await saveFile()
    if (saved && pendingClose) {
      pendingClose = false
      sysCloseWindow(props.pid)
    } else if (!saved && pendingClose) {
      pendingClose = false
    }
  } else if (action === 'discard') {
    if (pendingClose) { pendingClose = false; sysCloseWindow(props.pid) }
  } else {
    pendingClose = false
  }
}

let dragging = false
let dragOff = { x:0, y:0 }

function onHeaderDown(e) {
  if (isMax.value) return
  if (e.target.closest('.np-handle')) return
  dragging = true
  dragOff.x = e.clientX - pos.x
  dragOff.y = e.clientY - pos.y
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!dragging) return
  pos.x = e.clientX - dragOff.x
  pos.y = e.clientY - dragOff.y
}

function onDragEnd() {
  dragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function updateLC() {
  lineCount.value = (content.value.match(/\n/g) || []).length + 1
}

function updateCur() {
  if (!taRef.value) return
  const ta = taRef.value
  const t = content.value
  const p = ta.selectionStart
  const b = t.substring(0, p)
  const l = (b.match(/\n/g) || []).length + 1
  const n = b.lastIndexOf('\n')
  const c = n >= 0 ? p - n : p + 1
  cursorPos.value = { line: l, col: c }
}

async function loadFile(path) {
  if (!path) { statusText.value = '无文件路径'; return }
  currentPath.value = path
  fileUrl.value = path
  isLoading.value = true
  statusText.value = '正在加载...'
  try {
    const f = await readFile(path)
    if (!f) {
      content.value = ''; fileObj.value = null; statusText.value = '新建文件'
    } else {
      fileObj.value = f
      content.value = typeof f.content === 'string' ? f.content : String(f.content || '')
      statusText.value = '已加载'; isModified.value = false
    }
    updateLC()
  } catch (err) {
    statusText.value = '加载失败'
    content.value = '// 加载失败: ' + err.message
    updateLC()
  } finally { isLoading.value = false }
}

async function saveFile() {
  if (!fileObj.value && !currentPath.value) {
    return new Promise((resolve) => {
      openSaveAs(async (dir, name) => {
        try {
          const file = new WebFile(dir, name)
          await file.write(content.value)
          await file.save()
          fileObj.value = file
          currentPath.value = file.path
          fileUrl.value = file.path
          isModified.value = false
          statusText.value = '已保存'
          toast.show({ title: '保存成功', message: `文件保存到 ${name}`, type: 'success', duration: 3000 })
          resolve(true)
        } catch (err) {
          statusText.value = '保存失败'
          toast.show({ title: '保存失败', message: err.message || '未知错误', type: 'error', duration: 4000 })
          resolve(false)
        }
      }, pendingClose)
    })
  }
  try {
    if (fileObj.value) {
      await fileObj.value.write(content.value)
      await fileObj.value.save()
    } else {
      const existing = await readFile(currentPath.value)
      if (existing) {
        await existing.write(content.value)
        await existing.save()
        fileObj.value = existing
      } else {
        statusText.value = '保存失败: 文件对象不存在'
        toast.show({ title: '保存失败', message: '文件对象不存在', type: 'error', duration: 4000 })
        return false
      }
    }
    isModified.value = false
    statusText.value = '已保存'
    toast.show({ title: '保存成功', message: '文件已保存', type: 'success', duration: 2000 })
    return true
  } catch (err) {
    statusText.value = '保存失败'
    toast.show({ title: '保存失败', message: err.message || '未知错误', type: 'error', duration: 4000 })
    return false
  }
}

function newFile() {
  content.value = ''; fileObj.value = null; currentPath.value = ''
  fileUrl.value = ''; isModified.value = false
  statusText.value = '新建文件'; updateLC()
}

function handleInput() {
  updateLC(); updateCur()
  if (!isModified.value) { isModified.value = true; statusText.value = '已修改' }
  if (autoSave.value && currentPath.value) {
    if (autoSaveTimer.value) clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = setTimeout(() => { saveFile(); autoSaveTimer.value = null }, 3000)
  }
}

function handleKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = e.target; const s = ta.selectionStart; const en = ta.selectionEnd
    content.value = content.value.substring(0, s) + '  ' + content.value.substring(en)
    updateLC(); isModified.value = true; statusText.value = '已修改'
    nextTick(() => { ta.selectionStart = ta.selectionEnd = s + 2 })
  }
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile() }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newFile() }
  nextTick(updateCur)
}
function handleSelect() { updateCur() }

function onScroll() {
  if (!taRef.value) return
  const ln = taRef.value.parentElement?.querySelector('.np-ln')
  if (ln) ln.scrollTop = taRef.value.scrollTop
}

onMounted(() => {
  initWindow()
  const src = props.filePath || props.args || props.path || props.targetPath
  if (src) {
    const dup = windowList.filter(w => w.title && src && w.title.includes(src) && w.pid !== props.pid).length
    if (dup > 0) { setTimeout(() => { if (props.pid) sysCloseWindow(props.pid) }, 50); return }
  }
  if (src) loadFile(src)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  if (autoSaveTimer.value) clearTimeout(autoSaveTimer.value)
})

function onMenu(a) {
  if (a === 'new') newFile()
  else if (a === 'save') saveFile()
  else if (a === 'wrap') { wrapMode.value = !wrapMode.value; persistSettings() }
  else if (a === 'status') { showStatus.value = !showStatus.value; persistSettings() }
  else if (a === 'lines') { showLines.value = !showLines.value; persistSettings() }
  else if (a === 'autosave') { autoSave.value = !autoSave.value; persistSettings() }
}
</script>

<template>
  <div ref="winEl" class="npw" :class="{ max: isMax, focus: isFocused }"
    :style="{
      left: pos.x + 'px', top: pos.y + 'px',
      width: size.w + '%',
      height: 'calc(' + size.h + '% - var(--tab-height, 32px))',
      zIndex: winInfo?.z ?? 1
    }"
    @mousedown="focusWin">

    <div class="nptitle" @mousedown="onHeaderDown" @dblclick="toggleMax">
      <div class="npicon">
        <svg width="14" height="14" viewBox="0 0 48 48">
          <path d="M18 8H11a1 1 0 0 0-1 1v34a1 1 0 0 0 1 1h28a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H32" stroke="currentColor" stroke-width="4" fill="none"/>
          <path d="M18 13V8h4a1 1 0 0 0 1-1V6a3 3 0 1 1 6 0v1a1 1 0 0 0 1 1h4v5a1 1 0 0 1-1 1H19a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="4" fill="none"/>
        </svg>
      </div>
      <div class="nptext">{{ titleText }}</div>
      <div class="nphandle np-handle">
        <div class="npbtn btn-min" @click.stop="minimize">
          <svg viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1.5" fill="currentColor"/></svg>
        </div>
        <div class="npbtn btn-max" @click.stop="toggleMax">
          <svg v-if="isMax" viewBox="0 0 12 12">
            <rect x="2" y=".5" width="8" height="7" rx=".5" stroke="currentColor" stroke-width="1" fill="#fff"/>
            <rect x=".5" y="3" width="8" height="7" rx=".5" stroke="currentColor" stroke-width="1" fill="#fff"/>
          </svg>
          <svg v-else viewBox="0 0 12 12"><rect x="1" y="1.5" width="10" height="9" rx=".5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
        </div>
        <div class="npbtn btn-close" @click.stop="closeWin">
          <svg viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
      </div>
    </div>

    <div class="npmenu">
      <span class="npmi" @click="onMenu('new')">新建</span>
      <span class="npmi" @click="onMenu('save')">保存</span>
      <span class="npsep"></span>
      <span class="npmi" :class="{ on: autoSave }" @click="onMenu('autosave')">自动保存</span>
      <span class="npmi" :class="{ on: wrapMode }" @click="onMenu('wrap')">自动换行</span>
      <span class="npsep"></span>
      <span class="npmi" :class="{ on: showStatus }" @click="onMenu('status')">状态栏</span>
      <span class="npmi" :class="{ on: showLines }" @click="onMenu('lines')">行号</span>
    </div>

    <div class="npbody">
      <div class="np-ln" v-if="showLines" @scroll="onScroll">
        <div v-for="n in lineCount" :key="n" class="npln" :class="{ cur: n === cursorPos.line }">{{ n }}</div>
      </div>
      <textarea ref="taRef" class="npta" v-model="content"
        @input="handleInput" @keydown="handleKeydown"
        @click="updateCur" @select="handleSelect" @scroll="onScroll"
        spellcheck="false"
        :style="{ whiteSpace: wrapMode ? 'pre-wrap' : 'pre', wordWrap: wrapMode ? 'break-word' : 'normal' }"
        placeholder="在此输入文本..."></textarea>
      <div v-if="isLoading" class="npload">
        <div class="npspin"></div>
        <span>正在加载...</span>
      </div>
    </div>

    <div class="npstatus" v-if="showStatus">
      <div class="npsg"><span class="npsi">第 {{ cursorPos.line }} 行，第 {{ cursorPos.col }} 列</span></div>
      <div class="npsg">
        <span class="npsi">{{ lineCount }} 行</span>
        <span class="npsi">{{ fileSizeStr }}</span>
        <span class="npsi" :class="{ mod: isModified }">{{ statusStr }}</span>
      </div>
    </div>
  </div>

  <!-- 关闭确认 -->
  <Teleport to="body">
    <ZDialog v-model="showSaveDialog" title="记事本" :close-on-backdrop="false">
      <p style="margin:0;font-size:13px;line-height:1.6">
        文件 &quot;{{ fileUrl ? fileUrl.split('/').pop() : '无标题' }}&quot; 已被修改。<br/>
        是否保存更改？
      </p>
      <template #footer>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <ZButton type="default" @click="onSaveDialog('discard')">不保存</ZButton>
          <ZButton type="primary" @click="onSaveDialog('save')">保存</ZButton>
          <ZButton type="default" @click="onSaveDialog('cancel')">取消</ZButton>
        </div>
      </template>
    </ZDialog>
  </Teleport>

  <!-- 另存为对话框 -->
  <Teleport to="body">
    <ZDialog v-model="showSaveAs" title="另存为" size="large" :close-on-backdrop="false">
      <div class="saw">
        <div class="saw-side">
          <div class="saw-st">快速访问</div>
          <div class="saw-si" @click="quickSaveDir('/C/Desktop')">
            <svg width="14" height="14" viewBox="0 0 48 48"><path d="M5 8c0-.6.4-1 1-1h12l5 6h17c.6 0 1 .4 1 1v26c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V8z" fill="#ffc25b" stroke="#9013fe" stroke-width="3"/></svg>
            <span>桌面</span>
          </div>
          <div class="saw-si" @click="quickSaveDir('/C/Document')">
            <svg width="14" height="14" viewBox="0 0 48 48"><path d="M5 8c0-.6.4-1 1-1h12l5 6h17c.6 0 1 .4 1 1v26c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V8z" fill="#ffc25b" stroke="#9013fe" stroke-width="3"/></svg>
            <span>文档</span>
          </div>
          <div class="saw-si" @click="quickSaveDir('/C')">
            <svg width="14" height="14" viewBox="0 0 48 48"><path d="M12 33H4V7h40v26H36" fill="#2F88FF" stroke="#333" stroke-width="3"/></svg>
            <span>本地磁盘 (C:)</span>
          </div>
          <div class="saw-si" @click="quickSaveDir('/E')">
            <svg width="14" height="14" viewBox="0 0 48 48"><path d="M12 33H4V7h40v26H36" fill="#2F88FF" stroke="#333" stroke-width="3"/></svg>
            <span>本地磁盘 (E:)</span>
          </div>
        </div>
        <div class="saw-main">
          <div class="saw-tb">
            <button class="saw-up" @click="goUpSaveDir">
              <svg viewBox="0 0 16 16"><path d="M8 3l-5 5h3v4h4V8h3L8 3z" fill="currentColor"/></svg>
            </button>
            <span class="saw-p">{{ saveAsDir }}</span>
          </div>
          <div class="saw-list" v-if="!saveAsLoading">
            <div class="saw-lh"><span class="saw-cn">名称</span><span class="saw-ct">类型</span></div>
            <div v-for="item in saveAsList" :key="item.path"
              class="saw-lr" :class="{ dir: item.type === 'WebDir' }"
              @dblclick="enterSaveDir(item)"
              @click="item.type !== 'WebDir' && (saveAsName = item.name)">
              <span class="saw-cn">
                <span class="saw-ic" v-html="item.icon || ''"></span>
                {{ item.nickname || item.name }}
              </span>
              <span class="saw-ct">{{ item.type === 'WebDir' ? '文件夹' : '文件' }}</span>
            </div>
            <div v-if="saveAsList.length === 0" class="saw-emp">此文件夹为空</div>
          </div>
          <div v-else class="saw-emp">加载中...</div>
        </div>
      </div>
      <template #footer>
        <div class="saw-foot">
          <div class="saw-fl">
            <span class="saw-fl-lb">文件名</span>
            <div ref="saNameRef" class="saw-fi saw-name-edit" v-text="saveAsName"
              contenteditable="plaintext-only" @input="saveAsName=$event.target.textContent"
              @keydown.enter.prevent="confirmSaveAs" @click.stop @dblclick.stop
              :data-placeholder="'输入文件名'"></div>
          </div>
          <div class="saw-fr">
            <ZButton type="default" @click="showSaveAs = false">取消</ZButton>
            <ZButton type="primary" @click="confirmSaveAs">保存</ZButton>
          </div>
        </div>
      </template>
    </ZDialog>
  </Teleport>
</template>

<style scoped>
.npw {
  position: fixed; display: flex; flex-direction: column;
  background: #fff; color: #000;
  outline: 1px solid #999;
  box-shadow: 1px 1px 12px rgba(0,0,0,0.18);
  user-select: none; overflow: hidden;
  font-family: 'Consolas','Courier New','Microsoft YaHei',monospace;
}
.npw.focus { outline: 1px solid #666; box-shadow: 2px 2px 18px rgba(0,0,0,0.22); }
.npw.max { top:0!important; left:0!important; width:100%!important; height:calc(100% - var(--tab-height,32px))!important; }

.nptitle { display: flex; align-items: center; height: 30px; background: linear-gradient(180deg,#fff,#ecebe9); border-bottom: 1px solid #d6d4d2; flex-shrink: 0; cursor: default; }
.npicon { width: 30px; display: flex; align-items: center; justify-content: center; color: #555; flex-shrink: 0; }
.nptext { flex: 1; font-size: 12px; color: #333; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 28px; cursor: move; }
.nphandle { display: flex; height: 100%; flex-shrink: 0; }
.npbtn { width: 46px; height: 100%; display: flex; align-items: center; justify-content: center; cursor: default; color: #333; transition: background .08s; }
.npbtn svg { width: 10px; height: 10px; }
.npbtn:hover { background: #e5e5e5; }
.npbtn:active { background: #ccc; }
.btn-close:hover { background: #e81123; color: #fff; }
.btn-close:active { background: #bf0f1d; color: #fff; }

.npmenu { display: flex; align-items: center; padding: 2px 4px; background: #f5f5f5; border-bottom: 1px solid #d4d4d4; gap: 2px; min-height: 24px; flex-shrink: 0; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; font-size: 12px; }
.npmi { padding: 2px 10px; cursor: default; color: #333; border-radius: 2px; }
.npmi:hover { background: #e5e5e5; }
.npmi.on { color: #0078d4; }
.npsep { width: 1px; height: 16px; background: #d4d4d4; margin: 0 4px; }

.npbody { flex: 1; display: flex; overflow: hidden; position: relative; background: #fff; user-select: text; }
.np-ln { background: #f6f6f6; padding: 4px 0; text-align: right; user-select: none; min-width: 42px; border-right: 1px solid #e0e0e0; flex-shrink: 0; overflow: hidden; }
.npln { padding: 0 8px 0 6px; color: #999; font-size: 12px; line-height: 1.6; }
.npln.cur { color: #333; font-weight: 600; }
.npta { flex: 1; padding: 4px 10px; background: transparent; border: none; outline: none; color: #000; font-size: 12px; line-height: 1.6; resize: none; tab-size: 4; overflow: auto; font-family: 'Consolas','Courier New',monospace; }
.npta::selection { background: #add6ff; }
.npta::placeholder { color: #bbb; }
.npta::-webkit-scrollbar { width: 12px; height: 12px; }
.npta::-webkit-scrollbar-track { background: #f1f1f1; }
.npta::-webkit-scrollbar-thumb { background: #c1c1c1; border: 2px solid #f1f1f1; border-radius: 7px; }
.npta::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

.npload { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #888; background: rgba(255,255,255,.75); font-size: 12px; font-family: 'Segoe UI',sans-serif; }
.npspin { width: 22px; height: 22px; border: 2px solid #e0e0e0; border-top-color: #0078d4; border-radius: 50%; animation: npspin .8s linear infinite; }
@keyframes npspin { to { transform: rotate(360deg); } }

.npstatus { display: flex; align-items: center; justify-content: space-between; padding: 2px 10px; background: #f0f0f0; border-top: 1px solid #d4d4d4; color: #555; font-size: 11px; flex-shrink: 0; min-height: 22px; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; }
.npsg { display: flex; align-items: center; gap: 14px; }
.npsi { white-space: nowrap; }
.npsi.mod { color: #c00; font-weight: 600; }

/* ── 另存为 ── */
.saw { display: flex; height: 340px; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; font-size: 13px; border: 1px solid #d0d0d0; border-radius: 2px; overflow: hidden; }
.saw-side { width: 150px; background: #f5f5f5; border-right: 1px solid #d0d0d0; padding: 8px 0; flex-shrink: 0; overflow-y: auto; }
.saw-st { padding: 4px 12px; font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .5px; }
.saw-si { display: flex; align-items: center; gap: 6px; padding: 4px 12px; cursor: default; color: #333; font-size: 12px; }
.saw-si:hover { background: #e0e0e0; }
.saw-si svg { width: 14px; height: 14px; flex-shrink: 0; }

.saw-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.saw-tb { display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: #fafafa; border-bottom: 1px solid #d0d0d0; min-height: 28px; }
.saw-up { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; border-radius: 2px; background: #fff; cursor: default; color: #555; flex-shrink: 0; }
.saw-up:hover { background: #e5e5e5; }
.saw-up svg { width: 14px; height: 14px; }
.saw-p { flex: 1; font-size: 12px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.saw-list { flex: 1; overflow-y: auto; }
.saw-lh { display: flex; padding: 4px 8px; background: #f0f0f0; border-bottom: 1px solid #d0d0d0; font-size: 12px; font-weight: 500; color: #555; }
.saw-cn { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.saw-ct { width: 80px; text-align: center; flex-shrink: 0; }
.saw-lr { display: flex; align-items: center; padding: 3px 8px; cursor: default; font-size: 12px; }
.saw-lr:hover { background: #e5f3ff; }
.saw-lr.dir { font-weight: 500; cursor: default; }
.saw-ic { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.saw-emp { display: flex; align-items: center; justify-content: center; height: 60px; color: #999; font-size: 12px; }

.saw-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }
.saw-fl { display: flex; align-items: center; gap: 8px; flex: 1; }
.saw-fl-lb { font-size: 12px; color: #555; white-space: nowrap; }
.saw-fi { flex: 1; min-width: 0; }
.saw-name-edit { padding: 4px 8px; border: 1px solid #ccc; border-radius: 2px; outline: none; font-size: 13px; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; cursor: text; white-space: nowrap; overflow: hidden; }
.saw-name-edit:focus { border-color: #0078d4; }
.saw-name-edit:empty:before { content: attr(data-placeholder); color: #bbb; }
.saw-fr { display: flex; gap: 8px; flex-shrink: 0; }
</style>
