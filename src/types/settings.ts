export type InputFieldType = 'text' | 'textarea' | 'file' | 'checkbox' | 'boolean' | 'empty'

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
}

export interface RulesData {
	[key: string]: RuleItem;
}