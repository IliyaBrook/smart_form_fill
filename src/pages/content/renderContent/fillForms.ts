import type { InputFieldType, Profile, RulesData } from '@src/types/settings'
import { changeElement, formatValue, getElementsByXPath, getId, grabInputs, inspectElement, safeRegex } from '@utils'

function fillForms(profile: Profile, rulesData: RulesData) {
	const mode = 'insert'
	const detect = 'body'
	const typesRegex = new RegExp('^(text|email|password|search|tel|url|radio|checkbox)$')
	
	let inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = []
	const matrix = new WeakMap<Element, number>()
	const founds = new WeakMap<Element, { name: string; regexp: RegExp; certainty: number }[]>()
	
	// @ts-ignore
	if (detect === 'forms') {
		try {
			const forms = Array.from(document.forms)
			if (forms.length > 0) {
				forms.forEach((form, formIndex) => {
					matrix.set(form, formIndex)
					grabInputs(form, typesRegex).forEach((input, index) => {
						inputs.push(input)
						matrix.set(input, index)
					})
				})
			}
		} catch (error) {
			console.error('Detect forms error: ', error)
		}
	}
	
	if (inputs.length === 0 || detect === 'body') {
		try {
			grabInputs(document.body, typesRegex).forEach((input, index) => {
				inputs.push(input)
				matrix.set(input, index)
			})
		} catch (error) {
			console.error('Detect body error: ', error)
		}
	}
	
	inputs = inputs.filter((e, i, arr) => arr.indexOf(e) === i)
	
	const append = (input: Element, name: string, regexp: RegExp, certainty = 1) => {
		const arr = founds.get(input) || []
		arr.push({ name, regexp, certainty })
		founds.set(input, arr)
	}
	
	const decide = (input: Element, profile: Profile): string => {
		const fileRules = Object.keys(profile).filter((key) => profile[key].type === 'file')
		const arr = founds.get(input) || []
		const max = Math.max(...arr.map((o) => o.certainty))
		let candidates = arr.filter((o) => o.certainty === max)
		const inputName = getId(input as HTMLElement)
		
		candidates.sort((a, b) => {
			try {
				const lenA = (a.regexp.exec(inputName) || [''])[0].length
				const lenB = (b.regexp.exec(inputName) || [''])[0].length
				return lenB - lenA
			} catch (e) {
				return 0
			}
		})
		
		if (input instanceof HTMLInputElement) {
			if (input.type === 'file') {
				candidates = candidates.filter((o) => fileRules.includes(o.name))
				if (candidates.length === 0) {
					return fileRules[0]
				}
			} else {
				const inputText = input.outerHTML
				if (candidates.length > 1) {
					candidates.sort((a, b) => {
						let matchA = (a.regexp.exec(inputText) || [''])[0]
						let matchB = (b.regexp.exec(inputText) || [''])[0]
						
						const lenMatchA = matchA.length
						const lenMatchB = matchB.length
						
						if (lenMatchB !== lenMatchA) {
							return lenMatchB - lenMatchA
						}
						
						const lenNameA = (a.regexp.exec(inputName) || [''])[0].length
						const lenNameB = (b.regexp.exec(inputName) || [''])[0].length
						return lenNameB - lenNameA
					})
				}
			}
		}
		
		if (candidates.length > 0) {
			return candidates[0].name
		}
		
		return ''
	}
	
	// Filter and compile rules by current URL
	const currentUrl = window.location.href
	const applicableRules = Object.keys(rulesData)
		.map((key) => {
			const siteRaw = rulesData[key]['site-rule']
			const fieldRaw = rulesData[key]['field-rule']
			const ruleName = rulesData[key]['rule-name']
			const ruleType = rulesData[key]['type']
			
			const siteRegex = safeRegex(siteRaw)
			const fieldRegex = safeRegex(fieldRaw)
			
			if (!siteRegex || !fieldRegex) {
				return null
			}
			return {
				name: key,
				siteRegex,
				fieldRegex,
				ruleName,
				type: ruleType
			}
		})
		.filter((item) => item !== null)
		.filter((rule) => rule!.siteRegex.test(currentUrl))
		.reverse() as Array<{ name: string; siteRegex: RegExp; fieldRegex: RegExp, ruleName: string; type: InputFieldType }>
	
	// Stage 1: check element name, id, and label text
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const expStr = rule.fieldRegex.source
			if (expStr.startsWith('position:')) {
				const index = matrix.get(input)
				const formIndex = input.form ? matrix.get(input.form) : 0
				if (expStr === `position:${index}/${formIndex}` || expStr === `position:${index}`) {
					append(input, rule.name, rule.fieldRegex, 1)
				}
			} else {
				const inputName = getId(input as HTMLElement)
				const label = getElementsByXPath(`//label[@for="${input.id}"]`, input.form || document)
				const labelText = label.length > 0 ? label[0].textContent?.trim() : ''
				if (rule.fieldRegex.test(inputName) || rule.fieldRegex.test(labelText)) {
					const certainty = rule.fieldRegex.test(labelText) ? 0.75 : 0.5
					append(input, rule.name, rule.fieldRegex, certainty)
				}
			}
		}
	})
	
	// Stage 2: inspect element contents
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const expStr = rule.fieldRegex.source
			if (!expStr.startsWith('position:')) {
				if (inspectElement(input as HTMLElement).some((text) => rule.fieldRegex.test(text))) {
					append(input, rule.name, rule.fieldRegex, 0.25)
				}
			}
		}
	})
	
	// Stage 3: inspect parent element contents
	inputs.forEach((input) => {
		if (input.parentElement) {
			for (const rule of applicableRules) {
				const expStr = rule.fieldRegex.source
				if (!expStr.startsWith('position:')) {
					if (inspectElement(input.parentElement).some((text) => rule.fieldRegex.test(text))) {
						append(input, rule.name, rule.fieldRegex, 0.15)
					}
				}
			}
		}
	})
	
	// Finally fill out the found fields
	if (mode === 'insert') {
		inputs
			.filter((input) => founds.has(input))
			.forEach((element) => {
				const key = decide(element, profile)
				const rawValue = profile[key]?.value || ''
				const value: string = typeof rawValue === 'string' ? rawValue : (rawValue as {
					name: string;
					content: string;
				}).content
				const rule = applicableRules.find((rule) => rule.name === key)
				const elementText = element.outerHTML.toLowerCase()
				if (element instanceof HTMLInputElement) {
					if (element.type === 'radio' && rule.type === 'radio') {
						if (rule.fieldRegex.test(elementText) && elementText.includes(value)) {
							element.click()
						}
					} else if (element.type === 'checkbox') {
						const label = getElementsByXPath(`//label[//input[@id="${element.id}"]]`, element.form || document)
						const labelText = label.length > 0 ? label[0].textContent?.trim() : ''
						if (
							element.value.toLowerCase() === value.toLowerCase() ||
							labelText.toLowerCase() === value.toLowerCase()
						) {
							element.checked = value.toLowerCase() === 'true'
							changeElement(element, ' ')
						}
						if (rule.fieldRegex.test(elementText)) {
							if (value.toLowerCase() === 'true') {
								element.click()
								element.checked = value.toLowerCase() === 'true'
							}
						}
					} else if (element.type === 'file') {
						if (rawValue && (rawValue as { name: string; content: string; }).content && (rawValue as {
							name: string;
							content: string;
						}).name) {
							try {
								const rawValueTyped = rawValue as { name: string; content: string; }
								const byteCharacters = window.atob(value)
								const byteArrays = []
								for (let offset = 0; offset < byteCharacters.length; offset += 512) {
									const slice = byteCharacters.slice(offset, offset + 512)
									const byteNumbers = new Array(slice.length)
									for (let i = 0; i < slice.length; i++) {
										byteNumbers[i] = slice.charCodeAt(i)
									}
									const byteArray = new Uint8Array(byteNumbers)
									byteArrays.push(byteArray)
								}
								const blob = new Blob(byteArrays, { type: 'application/pdf' })
								const fileName = rawValueTyped.name
								const file = new File([blob], fileName)
								
								const dataTransfer = new DataTransfer()
								dataTransfer.items.add(file);
								(element as HTMLInputElement).files = dataTransfer.files
								element.dispatchEvent(new Event('change', { bubbles: true }))
							} catch (error) {
								console.error('Error creating Blob/File from base64 and trying to fill input type=\'file\':', error, element)
								console.warn('Automatic filling of the \'file\' input field failed:', element, 'Please fill in the field manually.')
							}
						} else {
							console.warn('Insufficient data to fill the file input (no content or name in profile):', element, rawValue)
							console.warn('Automatic filling of the \'file\' input field failed:', element, 'Please fill in the field manually.')
						}
					} else {
						const replaced = value
							.replace(/_url_/g, window.location.href)
							.replace(/_host_/g, window.location.hostname)
						const formatted = formatValue(replaced)
						element.value = formatted
						try {
							element.selectionStart = element.selectionEnd = formatted.length
						} catch {
							// ignore
						}
						changeElement(element, formatted.slice(-1))
					}
				} else if (element instanceof HTMLTextAreaElement) {
					const replaced = value
						.replace(/_url_/g, window.location.href)
						.replace(/_host_/g, window.location.hostname)
					const formatted = formatValue(replaced)
					element.value = formatted
					changeElement(element, formatted.slice(-1))
				} else if (element instanceof HTMLSelectElement) {
					Array.from(element.options).forEach((option) => {
						if (
							option.value.toLowerCase() === value.toLowerCase() ||
							(option.textContent && option.textContent.toLowerCase() === value.toLowerCase())
						) {
							element.selectedIndex = Array.from(element.options).indexOf(option)
							changeElement(element, ' ')
						}
					})
				}
			})
	}
	return null
}

export default fillForms