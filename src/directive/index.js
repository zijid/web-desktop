export default{
	install(app){
		let offset = { x: 0, y: 0 };
		app.directive('focus', {
			mounted: (el,data) => {
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
				function handleMouseDown(e) {
					if (e.target ===el) {
						isDown=true
						const rect = el.getBoundingClientRect();
						offset.x = e.clientX - rect.left;
						offset.y = e.clientY - rect.top;
					}
				}
				
				function handleMouseMove(e) {
					if(isDown){
						const x = e.clientX - offset.x;
						const y = e.clientY - offset.y;
						position.x = x
						position.y = y
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