export enum typeOption {
	Text = 'text',
	TextArea = 'textarea',
	File = 'file',
	Checkbox = 'checkbox',
	Boolean = 'boolean',
	None = 'none',
	Select = 'select',
	Radio = 'radio'
}

export type InputFieldType = (typeof typeOption)[keyof typeof typeOption];

export const InputFieldOptions = Array.from(Object.values(typeOption))

export interface ProfileItem {
	name: string;
	value: string | { name: string; content: string };
	type: InputFieldType;
}

export interface Profile {
	[key: string]: ProfileItem;
}

export interface FormProfilesData {
	profiles: { [key: string]: Profile };
	profileNames: string[];
	activeProfile: string;
}

export interface RuleItem {
	'field-rule': string;
	'site-rule': string;
	'rule-name': string;
	 type: InputFieldType;
}

export interface RulesData {
	[key: string]: RuleItem;
}