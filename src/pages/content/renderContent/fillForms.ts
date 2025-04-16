import type { InputFieldType, Profile, RulesData } from '@src/types/settings'
import { changeElement, formatValue, getElementsByXPath, getId, grabInputs, inspectElement, safeRegex, findMostSimilarKey, stringSimilarity } from '@utils'

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
	
	// Debug function to log string similarity matching
	const logSimilarity = (text: string, key: string, similarity: number) => {
		if (similarity > 0.4) { // Only log reasonably similar matches
			console.log(`String similarity: "${text}" <-> "${key}" = ${similarity.toFixed(2)}`)
		}
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

		// If no candidates found using regex matching, try to find the most similar field using Levenshtein distance
		if (inputName) {
			// Get all texts that might describe the field
			const inputTexts: string[] = [inputName];

			// Add label text if available
			if (input instanceof HTMLInputElement && input.id) {
				const label = getElementsByXPath(`//label[@for="${input.id}"]`, input.form || document);
				if (label.length > 0 && label[0].textContent) {
					inputTexts.push(label[0].textContent.trim());
				}
			}

			// Add text from parent elements and surrounding context
			const elementTexts = inspectElement(input as HTMLElement);
			inputTexts.push(...elementTexts);

			// Look for question text in parent containers (common in modern form UIs)
			let parentElement = input.parentElement;
			const maxDepth = 5; // Limit how far up we go to avoid performance issues
			let depth = 0;

			while (parentElement && depth < maxDepth) {
				// Look for elements with question-related classes or data attributes
				const questionElements = parentElement.querySelectorAll('[class*="question"],[class*="Question"],[data-testid*="question"],[aria-label*="question"]');
				questionElements.forEach(el => {
					if (el.textContent) {
						inputTexts.push(el.textContent.trim());
					}
				});

				// Look for heading elements that might contain question text
				const headings = parentElement.querySelectorAll('h1, h2, h3, h4, h5, h6, .heading, [class*="title"], [class*="Title"]');
				headings.forEach(el => {
					if (el.textContent) {
						inputTexts.push(el.textContent.trim());
					}
				});

				// Check the parent element itself for text content
				if (parentElement.textContent) {
					const text = parentElement.textContent.trim();
					// Only add if it's reasonably short (likely to be a label/question, not a large container)
					if (text.length > 0 && text.length < 200) {
						inputTexts.push(text);
					}
				}

				parentElement = parentElement.parentElement;
				depth++;
			}

			// Filter out empty strings and duplicates
			const uniqueTexts = [...new Set(inputTexts.filter(text => text.length > 0))];

			// Preprocess texts to extract key terms that might match profile fields
			const processedTexts: string[] = [];

			uniqueTexts.forEach(text => {
				// Add the original text
				processedTexts.push(text);

				// Extract key terms from questions like "How many years of experience do you have?"
				const lowerText = text.toLowerCase();

				// Common patterns to extract key terms
				const patterns = [
					// Extract "experience" from "years of experience"
					{ pattern: /years\s+of\s+(\w+)/i, group: 1 },
					// Extract "name" from "first name", "last name", etc.
					{ pattern: /(first|last|middle|full|hebrew)\s+name/i, group: 0 },
					// Extract key terms from questions
					{ pattern: /how\s+many\s+years\s+of\s+(\w+)/i, group: 1 },
					// Extract "experience" from "experience in X"
					{ pattern: /(\w+)\s+in\s+\w+\s+development/i, group: 1 },
					// Extract "experience" from various experience-related questions
					{ pattern: /how\s+many\s+years\s+of\s+experience/i, group: 0, fieldName: 'experience' },
					{ pattern: /years\s+of\s+experience/i, group: 0, fieldName: 'experience' },
					{ pattern: /experience\s+in\s+\w+/i, group: 0, fieldName: 'experience' },
					{ pattern: /\w+\s+experience/i, group: 0, fieldName: 'experience' },
					// Extract "phone" from "phone number"
					{ pattern: /(phone|email|address|city|state|zip|country|salary|linkedin)/i, group: 1 }
				];

				patterns.forEach((patternObj) => {
					const { pattern, group, fieldName } = patternObj;
					const match = lowerText.match(pattern);
					if (match) {
						if (fieldName) {
							// If a specific field name is provided, use it directly
							processedTexts.push(fieldName);
						} else if (match[group]) {
							// Otherwise use the matched group
							processedTexts.push(match[group]);
						}
					}
				});

				// Only add individual words if they are likely to be field names
				// and avoid generic words that might match with many fields
				const potentialFieldWords = [
					'name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country',
					'linkedin', 'github', 'website', 'experience', 'education', 'salary',
					'gender', 'birth', 'company', 'title', 'note', 'message', 'comment'
				];

				const words = text.split(/\s+/).filter(word => {
					const lowerWord = word.toLowerCase();
					return word.length > 3 && potentialFieldWords.some(fieldWord => 
						lowerWord.includes(fieldWord) || stringSimilarity(lowerWord, fieldWord) > 0.7
					);
				});

				processedTexts.push(...words);
			});

			// Remove duplicates again after processing
			const allTexts = [...new Set(processedTexts)];

			// Create a scoring system to find the best match
			interface Match {
				key: string;
				score: number;
				text: string;
				matchType: 'key' | 'name';
			}

			const matches: Match[] = [];

			// Helper function to determine if a field is appropriate for the input type
			const isAppropriateFieldType = (key: string, inputElement: Element): boolean => {
				if (!(inputElement instanceof HTMLInputElement)) return true;

				const fieldType = profile[key]?.type;
				const inputType = inputElement.type;

				// File inputs should only match with file fields
				if (inputType === 'file') return fieldType === 'file';

				// Checkbox inputs should match with boolean fields
				if (inputType === 'checkbox') {
					const value = profile[key]?.value;
					return typeof value === 'boolean' || value === 'true' || value === 'false';
				}

				// Radio inputs should match with fields that have specific values
				if (inputType === 'radio') {
					return fieldType === 'radio' || fieldType === 'select';
				}

				// Email inputs should match with email fields
				if (inputType === 'email') {
					return key.toLowerCase().includes('email') || 
						(typeof profile[key]?.value === 'string' && 
						(profile[key]?.value as string).includes('@'));
				}

				// URL inputs should match with URL fields
				if (inputType === 'url') {
					return key.toLowerCase().includes('website') || 
						key.toLowerCase().includes('linkedin') || 
						key.toLowerCase().includes('github') ||
						(typeof profile[key]?.value === 'string' && 
						((profile[key]?.value as string).includes('http') ||
						(profile[key]?.value  as string).includes('www')));
				}

				// Tel inputs should match with phone fields
				if (inputType === 'tel') {
					return key.toLowerCase().includes('phone') || 
						key.toLowerCase().includes('mobile') ||
						(typeof profile[key]?.value === 'string' && 
						/^\d[\d\s-]+\d$/.test(profile[key]?.value as string));
				}

				return true;
			};

			// Process all texts and calculate scores for each potential match
			for (const text of allTexts) {
				// First try to match with profile keys
				const profileKeys = Object.keys(profile);

				for (const key of profileKeys) {
					// Skip inappropriate field types
					if (!isAppropriateFieldType(key, input)) continue;

					const similarity = stringSimilarity(text, key);
					logSimilarity(text, key, similarity);

					if (similarity >= 0.7) {
						matches.push({
							key,
							score: similarity * 1.2, // Boost key matches slightly
							text,
							matchType: 'key'
						});
					}
				}

				// Then try to match with profile field names
				const profileFieldNames = Object.keys(profile).map(key => profile[key].name);
				const profileKeysByName = Object.keys(profile).reduce((acc, key) => {
					acc[profile[key].name] = key;
					return acc;
				}, {} as Record<string, string>);

				for (const name of profileFieldNames) {
					const key = profileKeysByName[name];

					// Skip inappropriate field types
					if (!isAppropriateFieldType(key, input)) continue;

					const similarity = stringSimilarity(text, name);
					logSimilarity(text, name, similarity);

					if (similarity >= 0.7) {
						matches.push({
							key,
							score: similarity,
							text,
							matchType: 'name'
						});
					}
				}
			}

			// If we have matches, sort by score and return the best match
			if (matches.length > 0) {
				// Sort by score (highest first)
				matches.sort((a, b) => b.score - a.score);

				// Get the best match
				const bestMatch = matches[0];

				console.log(`Found best match using Levenshtein distance (${bestMatch.matchType} match): "${bestMatch.text}" -> "${bestMatch.key}" with score ${bestMatch.score.toFixed(2)}`);
				return bestMatch.key;
			}

			// If no good matches found with higher threshold, try with a lower threshold
			// but only for specific field types that are more reliable
			const specificFieldPatterns = [
				{ pattern: /email/i, field: 'email' },
				{ pattern: /phone|mobile|telephone/i, field: 'phone' },
				{ pattern: /linkedin|linked\s*in/i, field: 'linkedin' },
				{ pattern: /github/i, field: 'github' },
				// Special case for experience fields
				{ pattern: /how\s+many\s+years\s+of\s+experience/i, field: 'experience' },
				{ pattern: /years\s+of\s+experience/i, field: 'experience' },
				{ pattern: /experience\s+in\s+\w+\s+development/i, field: 'experience' },
				{ pattern: /experience/i, field: 'experience' },
				// More specific name patterns to avoid overly aggressive matching
				{ pattern: /^name$/i, field: 'full-name' },
				{ pattern: /full\s*name/i, field: 'full-name' },
				{ pattern: /first\s*name/i, field: 'first-name' },
				{ pattern: /last\s*name/i, field: 'last-name' },
				{ pattern: /middle\s*name/i, field: 'middle-name' },
				{ pattern: /message|note|comment/i, field: 'note' }
			];

			for (const text of allTexts) {
				for (const { pattern, field } of specificFieldPatterns) {
					if (pattern.test(text.toLowerCase()) && profile[field]) {
						console.log(`Found specific field match: "${text}" -> "${field}"`);
						return field;
					}
				}
			}

			// Try to infer the field type from the input element
			if (input instanceof HTMLInputElement) {
				const inputType = input.type;

				// For email inputs, return the email field if it exists
				if (inputType === 'email' && profile['email']) {
					console.log('Input type is email, using email field');
					return 'email';
				}

				// For tel inputs, return the phone field if it exists
				if (inputType === 'tel' && profile['phone']) {
					console.log('Input type is tel, using phone field');
					return 'phone';
				}

				// For url inputs, return the website or linkedin field if it exists
				if (inputType === 'url') {
					if (profile['website']) {
						console.log('Input type is url, using website field');
						return 'website';
					} else if (profile['linkedin']) {
						console.log('Input type is url, using linkedin field');
						return 'linkedin';
					}
				}
			}
		}

		// If we couldn't find a match, return empty string
		// This will prevent the field from being filled
		console.log('No match found for input:', inputName);
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

	// Keep track of which fields have been filled with which values to prevent duplicates
	const filledValues = new Map<string, Set<Element>>();

	// Helper function to check if a value has been used too many times
	const isValueOverused = (value: string, isFile: boolean = false): boolean => {
		if (!value) return false;

		// Get all elements that have been filled with this value
		const elements = filledValues.get(value) || new Set<Element>();

		// For files, we want to limit to just once
		// For other values, if used more than 3 times, it's probably wrong
		return isFile ? elements.size >= 1 : elements.size >= 3;
	};

	// Helper function to record that a value has been used for an element
	const recordFilledValue = (value: string, element: Element): void => {
		if (!value) return;

		// Get or create the set of elements for this value
		const elements = filledValues.get(value) || new Set<Element>();

		// Add this element to the set
		elements.add(element);

		// Update the map
		filledValues.set(value, elements);
	};

	// Finally fill out the found fields
	if (mode === 'insert') {
		inputs
			.filter((input) => founds.has(input))
			.forEach((element) => {
				const key = decide(element, profile)
				if (!key) return; // Skip if no key was found

				const rawValue = profile[key]?.value || ''
				const value: string = typeof rawValue === 'string' ? rawValue : (rawValue as {
					name: string;
					content: string;
				}).content

				// Skip if this value has been used too many times
				if (isValueOverused(value)) {
					console.log(`Skipping field because value "${value}" has been used too many times`);
					return;
				}

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
							// Create a unique identifier for this file
							const rawValueTyped = rawValue as { name: string; content: string; }
							const fileName = rawValueTyped.name

							// Use the file name as the key for tracking
							// This will prevent the same file from being uploaded multiple times
							if (isValueOverused(fileName, true)) {
								console.log(`Skipping file upload because file "${fileName}" has already been used`);
								return;
							}

							try {
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
								const file = new File([blob], fileName)

								const dataTransfer = new DataTransfer()
								dataTransfer.items.add(file);
								(element as HTMLInputElement).files = dataTransfer.files
								element.dispatchEvent(new Event('change', { bubbles: true }))

								// Record that this file has been used
								recordFilledValue(fileName, element)
								console.log(`File "${fileName}" uploaded successfully`);
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
						// Record that this value has been used
						recordFilledValue(value, element)
						changeElement(element, formatted.slice(-1))
					}
				} else if (element instanceof HTMLTextAreaElement) {
					const replaced = value
						.replace(/_url_/g, window.location.href)
						.replace(/_host_/g, window.location.hostname)
					const formatted = formatValue(replaced)
					element.value = formatted
					// Record that this value has been used
					recordFilledValue(value, element)
					changeElement(element, formatted.slice(-1))
				} else if (element instanceof HTMLSelectElement) {
					Array.from(element.options).forEach((option) => {
						if (
							option.value.toLowerCase() === value.toLowerCase() ||
							(option.textContent && option.textContent.toLowerCase() === value.toLowerCase())
						) {
							element.selectedIndex = Array.from(element.options).indexOf(option)
							// Record that this value has been used
							recordFilledValue(value, element)
							changeElement(element, ' ')
						}
					})
				}
			})
	}
	return null
}

export default fillForms
