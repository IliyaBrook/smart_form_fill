// content.ts
import { data } from 'autoprefixer'

console.log("content loaded");

interface ProfileField {
	name: string;
	value: string;
	type: string;
}

interface ProfilesData {
	profiles: {
		[key: string]: { [field: string]: ProfileField };
	};
	activeProfile: string;
	profileNames: string[];
}

interface Rule {
	"field-rule": string;
	"site-rule": string;
}

type RulesData = Record<string, Rule>;

const defaults = {
	detect: "forms", // или "body"
	types: "^(text|email|password|search|tel|url)$",
};

const utils = {
	// Возвращает идентификатор элемента (name, id или placeholder)
	id: (e: HTMLElement): string => {
		let name = e.getAttribute("name") || e.getAttribute("id") || "";
		if (!name) {
			name = (e.getAttribute("placeholder") || "").replace(/\s/g, "_");
		}
		return name;
	},
	// Собирает все элементы с атрибутом name и типом по регулярке
	inputs: (target: HTMLElement, types: RegExp): Set<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> => {
		const set = new Set<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
		target.querySelectorAll("[name]").forEach(el => {
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				el instanceof HTMLSelectElement
			) {
				if (types.test(el.type)) {
					set.add(el);
				}
			}
		});
		return set;
	},
	// Простейший форматер (замена переносов)
	format: (value: string): string =>
		value.replace(/(?:\\n)|(?:<br\s*\/?>)/g, "\n"),
};

function change(element: HTMLElement, value: string = " ") {
	try {
		const o: KeyboardEventInit = {
			code: value === " " ? "Space" : value.toUpperCase(),
			key: value,
			keyCode: value.charCodeAt(0),
			which: value.charCodeAt(0),
			bubbles: true,
		};
		element.dispatchEvent(new KeyboardEvent("keydown", o));
		element.dispatchEvent(new KeyboardEvent("keyup", o));
		["change", "input"].forEach(evt => {
			element.dispatchEvent(new Event(evt, { bubbles: true }));
		});
	} catch (e) {}
}

function inspect(node: HTMLElement): string[] {
	let results: string[] = [];
	const one = (node: HTMLElement) => {
		results.push(node instanceof HTMLInputElement ? node.value : (node.getAttribute("placeholder") || ""));
		if (node.tagName !== "SELECT" && !node.querySelector("select")) {
			results.push(node.textContent || "");
		}
	};
	one(node);
	if (node.parentElement) {
		node.parentElement.querySelectorAll("*").forEach(child => {
			if (child instanceof HTMLElement) one(child);
		});
	}
	return results
		.map(s => s.trim())
		.filter((s, i, arr) => s && s.length > 3 && arr.indexOf(s) === i);
}

function grab(target: HTMLElement, types: RegExp): (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] {
	return Array.from(utils.inputs(target, types));
}

function fillForms(profile: { [key: string]: ProfileField }, rulesData: RulesData) {
	const mode = "insert";
	const detect = defaults.detect;
	const typesRegex = new RegExp(defaults.types);
	let inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [];
	const matrix = new WeakMap<Element, number>();
	const founds = new WeakMap<Element, { name: string; regexp: RegExp; certainty: number }[]>();
	
	if (detect === "forms") {
		const forms = Array.from(document.forms);
		forms.forEach((form, formIndex) => {
			matrix.set(form, formIndex);
			grab(form, typesRegex).forEach((input, index) => {
				inputs.push(input);
				matrix.set(input, index);
			});
		});
	}
	if (inputs.length === 0 || detect === "body") {
		grab(document.body, typesRegex).forEach((input, index) => {
			inputs.push(input);
			matrix.set(input, index);
		});
	}
	inputs = inputs.filter((e, i, arr) => arr.indexOf(e) === i);
	
	// Добавление найденного соответствия
	const append = (input: Element, name: string, regexp: RegExp, certainty: number = 1) => {
		const arr = founds.get(input) || [];
		arr.push({ name, regexp, certainty });
		founds.set(input, arr);
	};
	
	// Выбор наилучшего совпадения
	const decide = (input: Element): string => {
		const arr = founds.get(input) || [];
		const max = Math.max(...arr.map(o => o.certainty));
		const candidates = arr.filter(o => o.certainty === max);
		const inputName = utils.id(input as HTMLElement);
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
	
	// Фильтруем правила по текущему URL
	const currentUrl = window.location.href;
	const applicableRules = Object.keys(rulesData)
		.map(key => ({ name: key, ...rulesData[key] }))
		.filter(rule => {
			const r = new RegExp(rule["site-rule"], "i");
			return r.test(currentUrl);
		})
		.reverse();
	
	// Этап 1: проверка имени или id элемента
	inputs.forEach(input => {
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
				const inputName = utils.id(input as HTMLElement);
				if (r.test(inputName)) {
					append(input, rule.name, r, 0.5);
				}
			}
		}
	});
	
	// Этап 2: анализ содержимого элемента
	inputs.forEach(input => {
		for (const rule of applicableRules) {
			const exp = rule["field-rule"];
			if (!exp.startsWith("position:")) {
				const r = new RegExp(exp, "i");
				if (inspect(input as HTMLElement).some(text => r.test(text))) {
					append(input, rule.name, r, 0.25);
				}
			}
		}
	});
	
	// Этап 3: анализ содержимого родительского элемента
	inputs.forEach(input => {
		for (const rule of applicableRules) {
			const exp = rule["field-rule"];
			if (!exp.startsWith("position:") && input.parentElement) {
				const r = new RegExp(exp, "i");
				if (inspect(input.parentElement).some(text => r.test(text))) {
					append(input, rule.name, r, 0.15);
				}
			}
		}
	});
	
	if (mode === "insert") {
		inputs.filter(input => founds.has(input)).forEach(element => {
			const key = decide(element);
			let value = profile[key]?.value || "";
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
					change(element, " ");
				} else {
					value = value.replace(/_url_/g, window.location.href)
						.replace(/_host_/g, window.location.hostname);
					value = utils.format(value);
					element.value = value;
					try {
						element.selectionStart = element.selectionEnd = value.length;
					} catch (e) {}
					change(element, value.slice(-1));
				}
			} else if (element instanceof HTMLTextAreaElement) {
				value = value.replace(/_url_/g, window.location.href)
					.replace(/_host_/g, window.location.hostname);
				value = utils.format(value);
				element.value = value;
				change(element, value.slice(-1));
			} else if (element instanceof HTMLSelectElement) {
				Array.from(element.options).forEach((option, idx) => {
					if (
						option.value.toLowerCase() === value.toLowerCase() ||
						(option.textContent && option.textContent.toLowerCase() === value.toLowerCase())
					) {
						element.selectedIndex = idx;
						change(element, " ");
					}
				});
			}
		});
	}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "fillForm") {
		// chrome.storage.local.get(null, (data) => {
		// 	console.log("all data:", data)
		//
		// })
		chrome.storage.local.get(["form-profiles", "rules"], (result) => {
			
			if (result["form-profiles"] && result["rules"]) {
				let profilesData: ProfilesData;
				let rulesData: RulesData;
				try {
					profilesData = JSON.parse(result["form-profiles"]);
					rulesData = JSON.parse(result["rules"]);
				} catch (e) {
					console.error("Ошибка парсинга данных:", e);
					return;
				}
				const activeProfileName = profilesData.activeProfile;
				const profile = profilesData.profiles[activeProfileName];
				console.log("profilesData:", profilesData)
				console.log("rulesData:", rulesData)
				console.log("activeProfileName:", activeProfileName)
				console.log("[active profile]: ", profile)
				if (profile) {
					fillForms(profile, rulesData);
				} else {
					console.error("Активный профиль не найден");
				}
			} else {
				console.error("Данные профилей или правил не найдены в storage");
			}
		});
		sendResponse({message: "ok"});
	}
});
