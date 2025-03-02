import type { ProfileItem, RulesData } from '@src/types/settings'
import { safeRegex } from '@src/utils/Regex'
import { changeElement, formatValue, getId, grabInputs, inspectElement } from './formUtils'

function fillForms(profile: { [key: string]: ProfileItem }, rulesData: RulesData) {
	const mode = "insert";
	const detect = "body";
	const typesRegex = new RegExp("^(text|email|password|search|tel|url)$");
	
	let inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [];
	const matrix = new WeakMap<Element, number>();
	const founds = new WeakMap<Element, { name: string; regexp: RegExp; certainty: number }[]>();
	
	// @ts-ignore
	if (detect === "forms") {
		try {
			const forms = Array.from(document.forms);
			if (forms.length > 0) {
				forms.forEach((form, formIndex) => {
					matrix.set(form, formIndex);
					grabInputs(form, typesRegex).forEach((input, index) => {
						inputs.push(input);
						matrix.set(input, index);
					});
				});
			}
		} catch (error) {
			console.error("Detect forms error: ", error);
		}
	}
	
	if (inputs.length === 0 || detect === "body") {
		try {
			grabInputs(document.body, typesRegex).forEach((input, index) => {
				inputs.push(input);
				matrix.set(input, index);
			});
		} catch (error) {
			console.error("Detect body error: ", error);
		}
	}

	inputs = inputs.filter((e, i, arr) => arr.indexOf(e) === i);
	
	/**
	 * Append a found match into the 'founds' map
	 */
	const append = (input: Element, name: string, regexp: RegExp, certainty = 1) => {
		const arr = founds.get(input) || [];
		arr.push({ name, regexp, certainty });
		founds.set(input, arr);
	};
	
	/**
	 * Decide which rule has the highest 'certainty' for the element
	 */
	const decide = (input: Element): string => {
		const arr = founds.get(input) || [];
		const max = Math.max(...arr.map((o) => o.certainty));
		const candidates = arr.filter((o) => o.certainty === max);
		const inputName = getId(input as HTMLElement);
		
		candidates.sort((a, b) => {
			try {
				const lenA = (a.regexp.exec(inputName) || [""])[0].length;
				const lenB = (b.regexp.exec(inputName) || [""])[0].length;
				return lenB - lenA;
			} catch (e) {
				return 0;
			}
		});
		return candidates[0].name;
	};
	
	// Filter and compile rules by current URL
	const currentUrl = window.location.href;
	const applicableRules = Object.keys(rulesData)
		.map((key) => {
			const siteRaw = rulesData[key]["site-rule"];
			const fieldRaw = rulesData[key]["field-rule"];
			
			const siteRegex = safeRegex(siteRaw);
			const fieldRegex = safeRegex(fieldRaw);
			
			if (!siteRegex || !fieldRegex) {
				console.warn(`[fillForms] Skip rule "${key}" because of invalid RegExp.`);
				return null;
			}
			return {
				name: key,
				siteRegex,
				fieldRegex,
			};
		})
		.filter((item) => item !== null)
		.filter((rule) => rule!.siteRegex.test(currentUrl))
		.reverse() as Array<{ name: string; siteRegex: RegExp; fieldRegex: RegExp }>;
	
	// Stage 1: check element name or id
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const expStr = rule.fieldRegex.source;
			if (expStr.startsWith("position:")) {
				const index = matrix.get(input);
				const formIndex = input.form ? matrix.get(input.form) : 0;
				if (expStr === `position:${index}/${formIndex}` || expStr === `position:${index}`) {
					append(input, rule.name, rule.fieldRegex, 1);
				}
			} else {
				const inputName = getId(input as HTMLElement);
				if (rule.fieldRegex.test(inputName)) {
					append(input, rule.name, rule.fieldRegex, 0.5);
				}
			}
		}
	});
	
	// Stage 2: inspect element contents
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const expStr = rule.fieldRegex.source;
			if (!expStr.startsWith("position:")) {
				if (inspectElement(input as HTMLElement).some((text) => rule.fieldRegex.test(text))) {
					append(input, rule.name, rule.fieldRegex, 0.25);
				}
			}
		}
	});
	
	// Stage 3: inspect parent element contents
	inputs.forEach((input) => {
		if (input.parentElement) {
			for (const rule of applicableRules) {
				const expStr = rule.fieldRegex.source;
				if (!expStr.startsWith("position:")) {
					if (inspectElement(input.parentElement).some((text) => rule.fieldRegex.test(text))) {
						append(input, rule.name, rule.fieldRegex, 0.15);
					}
				}
			}
		}
	});
	
	// Finally fill out the found fields
	if (mode === "insert") {
		inputs
			.filter((input) => founds.has(input))
			.forEach((element) => {
				
				const key = decide(element);
				const rawValue = profile[key]?.value || "";
				const value: string = typeof rawValue === "string" ? rawValue : rawValue.content;
				console.log("element:", element)
				console.log("rawValue:", rawValue)
				console.log("value:", value)
				
				if (element instanceof HTMLInputElement) {
					if (element.type === "radio") {
						if (
							element.value.toLowerCase() === value.toLowerCase() ||
							(element.textContent && element.textContent.toLowerCase() === value.toLowerCase())
						) {
							element.click();
						}
					} else if (element.type === "checkbox") {
						element.checked = Boolean(value);
						changeElement(element, " ");
					} else if (element.type === "file") { // **Добавлено условие для file input**
						console.warn("Поле типа 'file' найдено. Автоматическое заполнение файлов не поддерживается. Пожалуйста, заполните поле вручную:", element);
					}
					else {
						const replaced = value
							.replace(/_url_/g, window.location.href)
							.replace(/_host_/g, window.location.hostname);
						const formatted = formatValue(replaced);
						element.value = formatted;
						try {
							element.selectionStart = element.selectionEnd = formatted.length;
						} catch (e) {
							// ignore
						}
						changeElement(element, formatted.slice(-1));
					}
				} else if (element instanceof HTMLTextAreaElement) {
					console.log("Заполняю textarea:", element); // **Добавлен лог для textarea**
					const replaced = value
						.replace(/_url_/g, window.location.href)
						.replace(/_host_/g, window.location.hostname);
					const formatted = formatValue(replaced);
					element.value = formatted;
					changeElement(element, formatted.slice(-1));
				} else if (element instanceof HTMLSelectElement) {
					Array.from(element.options).forEach((option) => {
						if (
							option.value.toLowerCase() === value.toLowerCase() ||
							(option.textContent && option.textContent.toLowerCase() === value.toLowerCase())
						) {
							element.selectedIndex = Array.from(element.options).indexOf(option);
							changeElement(element, " ");
						}
					});
				}
			});
	}
	return null;
}

export default fillForms