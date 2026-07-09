<script setup>
/**
 * AppFrame 鈥?閫氱敤搴旂敤杩愯瀹瑰櫒
 *
 * 鑷姩閫傞厤涓ょ搴旂敤绫诲瀷锛? *   type='html'    鈫?閫氳繃 iframe 鍔犺浇 url
 *   type='vue'     鈫?鍔ㄦ€佹覆鏌?component
 */
import { ref, computed, watch, onMounted, onUnmounted, provide } from 'vue'

import { readFile, deleteFile } from '@/utils/file'
import { bus } from '@/App'

const props = defineProps({
  appId:   { type: String, default: '' },
  title:   { type: String, default: '' },
  pid:     { type: Number, default: 0 },
  pwd:     { type: String, default: '' },
  filePath:{ type: String, default: '' },
  args:    { type: String, default: '' },
  path:    { type: String, default: '' },
  // 濡傛灉鏄?HTML 搴旂敤
  url:     { type: String, default: '' },
  // 濡傛灉鏄?Vue 缁勪欢搴旂敤
  component: { type: [Object, Function], default: null }
})

// Compat: use path when filePath is empty (from progress object)
const resolvedFilePath = computed(() => props.filePath || props.path)

const emit = defineEmits(['close', 'focus'])

// 鍒ゆ柇搴旂敤绫诲瀷
const isHtmlApp = computed(() => !!props.url)
const imageDataUrl = ref('')
const iframeKey = ref(0)

// Watch filePath changes, read file content
watch(() => [resolvedFilePath.value, props.url], async ([filePath, url]) => {
  console.log('[AppFrame] watch triggered:', { filePath, url, hasUrl: !!url })
  if (filePath && filePath.startsWith('/')) {
    try {
      const file = await readFile(filePath)
      console.log('[AppFrame] readFile result:', { found: !!file, hasContent: !!(file && file.content) })
      if (file && file.content && typeof file.content === 'string' && file.content.startsWith('data:')) {
        imageDataUrl.value = file.content
        iframeKey.value++
        console.log('[AppFrame] imageData set, iframeKey:', iframeKey.value)
      }
    } catch (e) {
      console.warn('[AppFrame] Load file failed:', e)
    }
  }
}, { immediate: true })

const resolvedUrl = computed(() => {
  if (!props.url) return ''
  let base = props.url
  const params = []
  if (resolvedFilePath.value) params.push('filePath=' + encodeURIComponent(resolvedFilePath.value))
  if (props.pwd) params.push('pwd=' + encodeURIComponent(props.pwd))
  if (props.args) params.push('args=' + encodeURIComponent(props.args))
  if (params.length > 0) {
    const sep = base.includes('?') ? '&' : '?'
    base = base + sep + params.join('&')
  }
  return base
})

// 鎻愪緵搴旂敤涓婁笅鏂囷紝Vue 缁勪欢鍙€氳繃 inject('appContext') 鎺ユ敹
provide('appContext', {
  appId: props.appId,
  title: props.title,
  pid: props.pid,
  pwd: props.pwd,
  filePath: resolvedFilePath.value,
  args: props.args
})

// iframe 娑堟伅閫氫俊
const iframeRef = ref(null)

function handleIframeMessage(e) {
  console.log('[AppFrame] message received:', e.data?.type, 'iframeRef:', !!iframeRef.value);
  if (!iframeRef.value) return

  if (e.data?.type === 'app-close') {
    emit('close', props.pid)
  } else if (e.data?.type === 'app-focus') {
    emit('focus', props.pid)
  } else if (e.data?.type === 'app-request-file' && e.data.filePath) {
    console.log('[AppFrame] File request received:', e.data.filePath);
    readFile(e.data.filePath).then(file => {
      console.log('[AppFrame] Read result:', { found: !!file, hasContent: !!(file && file.content) });
      if (file && file.content) {
        const iframe = iframeRef.value
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'app-file-data',
            filePath: e.data.filePath,
            content: file.content
          }, '*')
        }
      }
    }).catch(err => {
      console.warn('[AppFrame] File request failed:', err)
    })
  } else if (e.data?.type === 'app-delete-file' && e.data.filePath) {
    console.log('[AppFrame] Delete request:', e.data.filePath);
    // Use async delete to ensure proper flow
    deleteFile(e.data.filePath).then(() => {
      console.log('[AppFrame] File deleted successfully:', e.data.filePath);
      const iframe = iframeRef.value;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'app-file-deleted', filePath: e.data.filePath }, '*');
      }
      // Refresh desktop's file list
      const parentDir = e.data.filePath.substring(0, e.data.filePath.lastIndexOf('/')) || '/';
      console.log('[AppFrame] Emitting file-list-changed for:', parentDir);
      bus.emit('file-list-changed', parentDir);
    }).catch(err => {
      console.warn('[AppFrame] Delete failed:', err);
    })
  }
}

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
  const iframe = iframeRef.value
  if (iframe) {
    iframe.addEventListener('load', function onLoad() {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document
        doc.addEventListener('click', () => emit('focus', props.pid))
        doc.addEventListener('mousedown', () => emit('focus', props.pid))
        // Prevent default browser context menu in iframe
        doc.addEventListener('contextmenu', (ce) => ce.preventDefault())
      } catch(e) {
        // 璺ㄥ煙 iframe 鏃犳硶璁块棶锛屽拷鐣?
      }
    })
  }
})

onUnmounted(() => window.removeEventListener('message', handleIframeMessage))
</script>

<template>
  <!-- HTML 搴旂敤锛歩frame 鍔犺浇 -->
  <iframe
    v-if="isHtmlApp"
    ref="iframeRef"
    :src="resolvedUrl"
    class="app-iframe"
    sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
    frameborder="0"
  ></iframe>

  <!-- Vue 缁勪欢搴旂敤锛氬姩鎬佹覆鏌?-->
  <component
    v-else-if="component"
    :is="component"
    :app-id="appId"
    :title="title"
    :pid="pid"
    :pwd="pwd"
    :file-path="filePath"
    :args="args"
    class="app-vue"
  />

  <!-- 闄嶇骇鎻愮ず -->
  <div v-else class="app-empty">
    <p>搴旂敤 "{{ appId }}" 鏃犳硶鍔犺浇</p>
    <p class="hint">璇锋鏌ユ槸鍚﹀凡娉ㄥ唽姝ｇ‘鐨勭粍浠舵垨 URL</p>
  </div>
</template>

<style scoped>
.app-iframe {
  width: 100%;
  height: 100%;
  display: block;
  background: #fff;
}
.app-vue {
  width: 100%;
  height: 100%;
  overflow: auto;
}
.app-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 14px;
}
.hint {
  font-size: 12px;
  margin-top: 8px;
  color: #aaa;
}
</style>


