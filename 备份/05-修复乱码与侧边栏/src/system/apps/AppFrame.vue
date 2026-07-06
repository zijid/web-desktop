<script setup>
/**
 * AppFrame — 通用应用运行容器
 *
 * 自动适配两种应用类型：
 *   type='html'   → 通过 iframe 加载 url
 *   type='vue'    → 动态渲染 component
 */
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'

const props = defineProps({
  appId:   { type: String, default: '' },
  title:   { type: String, default: '' },
  pid:     { type: Number, default: 0 },
  pwd:     { type: String, default: '' },
  filePath:{ type: String, default: '' },
  args:    { type: String, default: '' },
  // 如果是 HTML 应用
  url:     { type: String, default: '' },
  // 如果是 Vue 组件应用
  component: { type: [Object, Function], default: null }
})

const emit = defineEmits(['close', 'focus'])

// ── 判断应用类型 ──
const isHtmlApp = computed(() => !!props.url)
const resolvedUrl = computed(() => {
  if (!props.url) return ''
  // 相对路径补全
  if (props.url.startsWith('/') || props.url.startsWith('./') || props.url.startsWith('../')) {
    return props.url
  }
  return props.url
})

// ── 提供应用上下文，Vue 组件可通过 inject('appContext') 接收 ──
provide('appContext', {
  appId: props.appId,
  title: props.title,
  pid: props.pid,
  pwd: props.pwd,
  filePath: props.filePath,
  args: props.args
})

// ── iframe 消息通信 ──
const iframeRef = ref(null)
function handleIframeMessage(e) {
  if (!iframeRef.value) return
  // 允许 HTML 应用通过 postMessage 与桌面通信
  // 格式: { type: 'app-close' } 等
  if (e.data?.type === 'app-close') {
    emit('close', props.pid)
  } else if (e.data?.type === 'app-focus') {
    emit('focus', props.pid)
  }
}
onMounted(() => {
	window.addEventListener('message', handleIframeMessage)
	// 监听 iframe 内的点击，让窗口获得焦点
	const iframe = iframeRef.value
	if (iframe) {
		iframe.addEventListener('load', function onLoad() {
			try {
				const doc = iframe.contentDocument || iframe.contentWindow.document
				doc.addEventListener('click', () => emit('focus', props.pid))
				doc.addEventListener('mousedown', () => emit('focus', props.pid))
			} catch(e) {
				// 跨域 iframe 无法访问，忽略
			}
		})
	}
})
onUnmounted(() => window.removeEventListener('message', handleIframeMessage))
</script>

<template>
  <!-- HTML 应用：iframe 加载 -->
  <iframe
    v-if="isHtmlApp"
    ref="iframeRef"
    :src="resolvedUrl"
    class="app-iframe"
    sandbox="allow-scripts allow-forms allow-popups"
    frameborder="0"
  ></iframe>

  <!-- Vue 组件应用：动态渲染 -->
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

  <!-- 降级提示 -->
  <div v-else class="app-empty">
    <p>应用 "{{ appId }}" 无法加载</p>
    <p class="hint">请检查是否已注册正确的组件或 URL</p>
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
