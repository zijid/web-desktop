/**





 * App auto scanner





 */





import { registerApp, getApp, getAllApps, launchApp, restoreExtensions } from './index.js'











export async function scanAndRegisterApps() {





  if (!getApp('explorer')) {





    const comp = (await import('@/apps/explorer/index.vue')).default





    registerApp('explorer', {


      hasWindow: true,





      name: '文件管理器',





      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',





      component: comp,





      extensions: [''],





      windowWidth: 70,





      windowHeight: 80,





      minWidth: 400,





      minHeight: 300,





      menu: [





        { title: '打开', hander: () => launchApp('explorer', { title: '文件管理器' }) },





        { title: '新窗口打开', hander: () => launchApp('explorer', { title: '文件管理器 - 新窗口' }) },





      ]





    })





  }





  if (!getApp('notepad')) {





    const comp = (await import('@/apps/notepad/index.vue')).default





    registerApp('notepad', {


      hasWindow: true,





      name: '记事本',





      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8H11C10.4477 8 10 8.44772 10 9V43C10 43.5523 10.4477 44 11 44H39C39.5523 44 40 43.5523 40 43V9C40 8.44772 39.5523 8 39 8H32" stroke="#333" stroke-width="4"/><path d="M18 13V8H21.9505C21.9778 8 22 7.97784 22 7.9505V6C22 4.34315 23.3431 3 25 3C26.6569 3 28 4.34315 28 6V7.9505C28 7.97784 28.0222 8 28.0495 8H32V13C32 13.5523 31.5523 14 31 14H19C18.4477 14 18 13.5523 18 13Z" fill="none" stroke="#333" stroke-width="4"/></svg>',





      component: comp,





      extensions: ['txt'],





      windowWidth: 55,





      windowHeight: 60,





      minWidth: 300,





      minHeight: 200,





      menu: [





        { title: '打开', hander: () => launchApp('notepad', { title: '记事本' }) },





        { title: '新建文档', hander: () => launchApp('notepad', { title: '新建文本文档.txt' }) },





      ]





    })





  }





  if (!getApp('clock')) {





    registerApp('clock', {





      name: '简约时钟',





      icon: '\u{1F552}',





      url: '/apps/clock/index.html',





      windowWidth: 35,





      windowHeight: 30,





      minWidth: 250,





      minHeight: 180,





      menu: [





        { title: '打开', hander: () => launchApp('clock', { title: '简约时钟' }) },





        { title: '全屏模式', hander: () => launchApp('clock', { title: '简约时钟 - 全屏', args: 'fullscreen' }) },





      ]





    })





  }





  if (!getApp('editor')) {





    const comp = (await import('@/apps/editor/index.vue')).default





    registerApp('editor', {





      hasWindow: true,





      name: '代码编辑器',





      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 6H14C9 6 6 9 6 14V34C6 39 9 42 14 42H34C39 42 42 39 42 34V14C42 9 39 6 34 6Z" fill="none" stroke="#333" stroke-width="4"/><path d="M27 16L33 24L27 32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 16L15 24L21 32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',





      component: comp,





      extensions: ['md', 'js', 'html', 'css', 'json', 'xml', 'ini', 'cfg', 'log', 'bat', 'sh', 'py', 'java', 'c', 'cpp', 'h', 'yml', 'yaml', 'toml', 'csv', 'ts', 'jsx', 'tsx', 'vue', 'php', 'rb', 'go', 'rs', 'swift', 'kt'],





      windowWidth: 70,





      windowHeight: 80,





      minWidth: 400,





      minHeight: 300,





      menu: [





        { title: '打开', hander: () => launchApp('editor', { title: '代码编辑器' }) },





        { title: '从 URL 打开', hander: () => { const url = prompt('输入文件 URL:'); if (url) launchApp('editor', { title: url, args: url }); } },





      ]





    })





  }














  if (!getApp('app-creator')) {


    const comp = (await import('@/apps/app-creator/index.vue')).default


    registerApp('app-creator', {


      hasWindow: true,


      name: '新软件制作工具',


      icon: '\u{1F4E6}',


      component: comp,


      windowWidth: 55,


      windowHeight: 70,


      minWidth: 450,


      minHeight: 400,


      menu: [


        { title: '打开', hander: () => launchApp('app-creator', { title: '新软件制作工具' }) },


      ]


    })


  }





  if (!getApp('system-settings')) {


    const comp = (await import('@/apps/system-settings/index.vue')).default


    registerApp('system-settings', {


      hasWindow: true,


      name: '系统设置',


      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4"/><path d="M24 16V24" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="32" r="2" fill="#333"/></svg>',


      component: comp,


      windowWidth: 50,


      windowHeight: 60,


      minWidth: 500,


      minHeight: 350,


      menu: [


        { title: '打开', hander: () => launchApp('system-settings', { title: '系统设置' }) },


      ]


    })


  }





  if (!getApp('file-importer')) {
    const comp = (await import('@/apps/file-importer/index.vue')).default
    registerApp('file-importer', {
      hasWindow: true,
      name: '文件导入工具',
      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 28V40C42 41.1046 41.1046 42 40 42H8C6.89543 42 6 41.1046 6 40V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L24 8L32 16" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 8V32" stroke="#333" stroke-width="4" stroke-linecap="round"/></svg>',
      component: comp,
      windowWidth: 55,
      windowHeight: 60,
      minWidth: 400,
      minHeight: 350,
      menu: [
        { title: '打开', hander: () => launchApp('file-importer', { title: '文件导入工具' }) },
      ]
    })
  }

  if (!getApp('image-viewer')) {
    registerApp('image-viewer', {
      name: '图片查看器',
      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="36" height="36" rx="3" stroke="#333" stroke-width="4"/><circle cx="18" cy="18" r="4" fill="none" stroke="#333" stroke-width="4"/><path d="M6 34L16 26L22 32L30 22L42 34" stroke="#333" stroke-width="4" stroke-linejoin="round"/></svg>',
      url: '/apps/image-viewer/index.html',
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'avif', 'heic', 'heif', 'jfif', 'pjpeg', 'pjp'],
      windowWidth: 70,
      windowHeight: 80,
      minWidth: 400,
      minHeight: 300,
      menu: [
        { title: '打开', hander: () => launchApp('image-viewer', { title: '图片查看器' }) },
      ]
    })
  }

  if (!getApp('browser')) {
    registerApp('browser', {
      name: '浏览器',
      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4"/><path d="M4 24H44" stroke="#333" stroke-width="4"/><path d="M24 4C20 4 16 10 16 24C16 38 20 44 24 44C28 44 32 38 32 24C32 10 28 4 24 4Z" fill="none" stroke="#333" stroke-width="4"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>',
      url: '/apps/browser/index.html',
      windowWidth: 80,
      windowHeight: 85,
      minWidth: 400,
      minHeight: 300,
      menu: [
        { title: '打开', hander: () => launchApp('browser', { title: '浏览器' }) },
      ]
    })
  }

  const { rebuildAssociations } = await import('@/system/filetypes')





  rebuildAssociations()


  restoreExtensions()





  console.log('[AppScanner] scan done, ' + getAllApps().length + ' apps')





}




















