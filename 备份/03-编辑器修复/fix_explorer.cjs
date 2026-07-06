const fs = require('fs');
const path = 'F:\\我的git\\web-desktop\\src\\components\\explorer\\explorer.vue';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Add ctxMenu.items assignment in buildContextMenu
const oldBuildEnd = '  }\n}\n\n\nfunction showCtxMenu';
const newBuildEnd = '  }\n  // set menu display\n  ctxMenu.items = items\n  ctxMenu.x = e.clientX\n  ctxMenu.y = e.clientY\n  ctxMenu.show = true\n}\n\n\nfunction showCtxMenu';

if (content.includes(oldBuildEnd)) {
  content = content.replace(oldBuildEnd, newBuildEnd);
  console.log('Fixed buildContextMenu - added menu display');
} else {
  console.log('WARN: Could not find buildContextMenu end marker');
}

// Fix 2: Fix showCtxMenu - move selection logic to buildContextMenu
const oldShowCtx = 'function showCtxMenu(e, file) {\n  bus.emit("menu-close")\n  if (file && !isSelected(file)) { clearSelection(); selectedFiles.value.push(file) }\n  buildContextMenu(e, file)\n}';
const newShowCtx = 'function showCtxMenu(e, file) {\n  bus.emit("menu-close")\n  buildContextMenu(e, file || null)\n}';

if (content.includes(oldShowCtx)) {
  content = content.replace(oldShowCtx, newShowCtx);
  console.log('Fixed showCtxMenu - removed duplicate selection logic');
} else {
  console.log('WARN: Could not find showCtxMenu pattern');
}

// Fix 3: Add file selection at start of buildContextMenu
const buildStart = 'function buildContextMenu(e, file) {\n  const items = []\n  const singleFile = selectedFiles.value.length > 0 ? selectedFiles.value[0] : null';
if (content.includes(buildStart)) {
  const insertion = '\n  // if right-click on unselected file, select only it\n  if (file && !isSelected(file)) { clearSelection(); selectedFiles.value.push(file) }\n';
  const target = buildStart;
  if (!content.includes('if right-click on unselected file')) {
    content = content.replace(target, target + insertion);
    console.log('Added file selection logic to buildContextMenu');
  }
} else {
  console.log('WARN: Could not find buildContextMenu start');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done - all fixes applied');
