export function getId(el: HTMLElement): string {
	let id = el.getAttribute('name') || el.getAttribute('id') || ''
	if (!id) {
		id = (el.getAttribute('placeholder') || '').replace(/\s/g, '_')
	}
	return id
}