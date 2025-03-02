export function getId(el: HTMLElement): string {
	let id = el.getAttribute("name") || el.getAttribute("id") || "";
	if (!id) {
		id = (el.getAttribute("placeholder") || "").replace(/\s/g, "_");
	}
	return id;
}

export function formatValue(value: string): string {
	return value.replace(/(?:\\n)|(?:<br\s*\/?>)/g, "\n");
}

export function grabInputs(target: HTMLElement, types: RegExp): (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] {
	const inputs = new Set<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
	
	target.querySelectorAll("[name]").forEach((el) => {
		if (el instanceof HTMLInputElement) {
			if (types.test(el.type)) {
				inputs.add(el);
			} else if (el.type === 'file') {
				inputs.add(el);
			}
		} else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
			inputs.add(el);
		}
	});
	
	target.querySelectorAll("input, textarea, select").forEach((el) => {
		if (el instanceof HTMLInputElement) {
			if (getId(el) && types.test(el.type)) {
				inputs.add(el);
			} else if (getId(el) && el.type === 'file') {
				inputs.add(el);
			}
		} else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
			if (getId(el)) {
				inputs.add(el);
			}
		}
	});
	
	return Array.from(inputs);
}

export function changeElement(element: HTMLElement, value: string = " ") {
	try {
		const o: KeyboardEventInit = {
			code: value === " " ? "Space" : value.toUpperCase(),
			key: value,
			bubbles: true,
		};
		element.dispatchEvent(new KeyboardEvent("keydown", o));
		element.dispatchEvent(new KeyboardEvent("keyup", o));
		["change", "input"].forEach((evt) => {
			element.dispatchEvent(new Event(evt, { bubbles: true }));
		});
	} catch (e) {}
}

export function inspectElement(node: HTMLElement): string[] {
	let results: string[] = [];
	const one = (node: HTMLElement) => {
		results.push(
			node instanceof HTMLInputElement ? node.value : (node.getAttribute("placeholder") || "")
		);
		if (node.tagName !== "SELECT" && !node.querySelector("select")) {
			results.push(node.textContent || "");
		}
	};
	one(node);
	if (node.parentElement) {
		node.parentElement.querySelectorAll("*").forEach((child) => {
			if (child instanceof HTMLElement) one(child);
		});
	}
	return results
		.map((s) => s.trim())
		.filter((s, i, arr) => s && s.length > 3 && arr.indexOf(s) === i);
}