export function inspectElement(node: HTMLElement): string[] {
	let results: string[] = []
	const attributesToCheck = ['placeholder', 'data-testid', 'aria-label', 'title', 'name', 'id']
	const one = (node: HTMLElement) => {
		// Get input value if it's an input element
		if (node instanceof HTMLInputElement) {
			results.push(node.value)
		}

		// Check all important attributes
		attributesToCheck.forEach(attr => {
			const attrValue = node.getAttribute(attr)
			if (attrValue) {
				results.push(attrValue)
			}
		})

		// Get text content for non-SELECT elements
		if (node.tagName !== 'SELECT' && !node.querySelector('select')) {
			results.push(node.textContent || '')
		}
	}

	// Process the node itself
	one(node)

	// Process parent element if it exists
	if (node.parentElement) {
		// Check parent element attributes
		one(node.parentElement)

		// Check all siblings and their children
		node.parentElement.querySelectorAll('*').forEach((child) => {
			if (child instanceof HTMLElement) one(child)
		})
	}

	// Look for labels that might be associated with this input
	if (node.id) {
		const associatedLabels = document.querySelectorAll(`label[for="${node.id}"]`)
		associatedLabels.forEach(label => {
			if (label instanceof HTMLElement) {
				results.push(label.textContent || '')
			}
		})
	}

	return results
		.map((s) => s.trim())
		.filter((s, i, arr) => s && s.length > 0 && arr.indexOf(s) === i)
}
