export function inspectElement(node: HTMLElement): string[] {
	let results: string[] = []
	const one = (node: HTMLElement) => {
		results.push(
			node instanceof HTMLInputElement ? node.value : (node.getAttribute('placeholder') || '')
		)
		if (node.tagName !== 'SELECT' && !node.querySelector('select')) {
			results.push(node.textContent || '')
		}
	}
	one(node)
	if (node.parentElement) {
		node.parentElement.querySelectorAll('*').forEach((child) => {
			if (child instanceof HTMLElement) one(child)
		})
	}
	return results
		.map((s) => s.trim())
		.filter((s, i, arr) => s && s.length > 3 && arr.indexOf(s) === i)
}