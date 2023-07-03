import {ref,reactive} from "vue"

export const data=reactive([])
export function addApp(title){
	data.push({
		title,
		icon:`<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M18 18.0083H30" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="M24.0083 18.0083V34" stroke="#333" stroke-width="4" stroke-linecap="round"/></svg>`
	})
}
addApp("1")
addApp("2")
addApp("3")