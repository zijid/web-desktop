import { nextTick } from "vue";
export default{
	install(app){
		let offset = { x: 0, y: 0 };
		app.directive('focus', {
			mounted: (el,data) => {
				console.log("el:",el);
				el.focus()
				if(typeof data.value==='function'){
					el.addEventListener('focus', data.value);
					el.fun=data.value
				}
			},
			unmounted:(el)=>{
				if(typeof el.fun==='function'){
					document.removeEventListener('mousedown', el.fun);
					delete el.fun;
				}
			}
		})
		app.directive('move', {
			mounted: (el,data) => {
				const position=data.value
				let isDown=false
				document.addEventListener('mousedown', handleMouseDown);
				document.addEventListener('mousemove', handleMouseMove);
				document.addEventListener('mouseup', handleMouseUp);
				
				// 监听自定义事件并处理传递的数据
				
				// 触发自定义事件
				function handleMouseDown(e) {
					
					if (e.target ===el) {
						isDown=true
						let rect = el.getBoundingClientRect();
						if(position.isMax){
							const p=e.clientX/el.offsetWidth
							const width=window.innerWidth
							const wp=position.w/100*width*p
							offset.x = wp+rect.left;
						}else{
							offset.x = e.clientX-rect.left;
						}
						offset.y = e.clientY - rect.top;
					}
				}
				
				function handleMouseMove(e) {
					if(isDown){
						if(position.isMax){
							position.isMax=false
						}
						const x = e.clientX - offset.x;
						const y = e.clientY - offset.y;
						position.x = x
						position.y = y
						const customEvent = new CustomEvent('move', {
							detail: {
							  message:position
							}
						});
						document.dispatchEvent(customEvent);
					}
				}
				function handleMouseUp() {
					isDown=false
				}
				el.handleMouseDown = handleMouseDown;
				el.handleMouseMove = handleMouseMove;
				el.handleMouseUp = handleMouseUp;
			},
			unmounted:(el)=>{
				document.removeEventListener('mousedown', el.handleMouseDown);
				document.removeEventListener('mousemove', el.handleMouseMove);
				document.removeEventListener('mouseup', el.handleMouseUp);
				delete el.handleMouseDown;
				delete el.handleMouseMove;
				delete el.handleMouseUp;
		
			}
		})
		
	}
}