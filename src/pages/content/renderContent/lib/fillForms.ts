import type { ProfileItem, RulesData } from '@src/types/settings'
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
			console.log("forms:", forms);
			if (forms.length > 0) {
				forms.forEach((form, formIndex) => {
					matrix.set(form, formIndex);
					grabInputs(form, typesRegex).forEach((input, index) => {
						inputs.push(input);
						matrix.set(input, index);
					});
				});
			}
		}catch (error) {
			console.error('Detect forms error: ', error)
		}
	}
	console.log("all input after grab:", inputs)
	
	if (inputs.length === 0 || detect === "body") {
		try {
			grabInputs(document.body, typesRegex).forEach((input, index) => {
				inputs.push(input);
				matrix.set(input, index);
			});
		}catch (error) {
			console.error('Detect body error: ', error)
		}
	}
	inputs = inputs.filter((e, i, arr) => arr.indexOf(e) === i);

	// Функция для добавления найденного совпадения
	const append = (input: Element, name: string, regexp: RegExp, certainty: number = 1) => {
		const arr = founds.get(input) || [];
		arr.push({ name, regexp, certainty });
		founds.set(input, arr);
	};

	// Выбор наилучшего совпадения
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

	// Фильтрация правил по текущему URL
	const currentUrl = window.location.href;
	const applicableRules = Object.keys(rulesData)
		.map((key) => ({ name: key, ...rulesData[key] }))
		.filter((rule) => {
			const r = new RegExp(rule["site-rule"], "i");
			return r.test(currentUrl);
		})
		.reverse();

	// Этап 1: проверка имени или id элемента
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const exp = rule["field-rule"];
			if (exp.startsWith("position:")) {
				const index = matrix.get(input);
				const formIndex = input.form ? matrix.get(input.form) : 0;
				if (exp === "position:" + index + "/" + formIndex || exp === "position:" + index) {
					append(input, rule.name, /./, 1);
				}
			} else {
				const r = new RegExp(exp, "i");
				const inputName = getId(input as HTMLElement);
				if (r.test(inputName)) {
					append(input, rule.name, r, 0.5);
				}
			}
		}
	});

	// Этап 2: анализ содержимого элемента
	inputs.forEach((input) => {
		for (const rule of applicableRules) {
			const exp = rule["field-rule"];
			if (!exp.startsWith("position:")) {
				const r = new RegExp(exp, "i");
				if (inspectElement(input as HTMLElement).some((text) => r.test(text))) {
					append(input, rule.name, r, 0.25);
				}
			}
		}
	});

	// Этап 3: анализ содержимого родительского элемента
	inputs.forEach((input) => {
		if (input.parentElement) {
			for (const rule of applicableRules) {
				const exp = rule["field-rule"];
				if (!exp.startsWith("position:")) {
					const r = new RegExp(exp, "i");
					if (inspectElement(input.parentElement).some((text) => r.test(text))) {
						append(input, rule.name, r, 0.15);
					}
				}
			}
		}
	});

	// Заполнение найденных полей
	if (mode === "insert") {
		inputs.filter(input => founds.has(input)).forEach(element => {
			const key = decide(element);
			// Если value не строка, то пробуем взять поле content
			const rawValue = profile[key]?.value || "";
			const value: string = typeof rawValue === "string" ? rawValue : rawValue.content;

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
				} else {
					const replaced = value.replace(/_url_/g, window.location.href)
						.replace(/_host_/g, window.location.hostname);
					const formatted = formatValue(replaced);
					element.value = formatted;
					try {
						element.selectionStart = element.selectionEnd = formatted.length;
					} catch (e) {}
					changeElement(element, formatted.slice(-1));
				}
			} else if (element instanceof HTMLTextAreaElement) {
				const replaced = value.replace(/_url_/g, window.location.href)
					.replace(/_host_/g, window.location.hostname);
				const formatted = formatValue(replaced);
				element.value = formatted;
				changeElement(element, formatted.slice(-1));
			} else if (element instanceof HTMLSelectElement) {
				Array.from(element.options).forEach(option => {
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
	return null
}

export default fillForms