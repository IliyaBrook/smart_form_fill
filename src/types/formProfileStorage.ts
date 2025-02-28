export type FileTypes = 'text' | 'file'

export interface ProfileItem {
	name: string;
	value: string | { name: string; content: string };
	type: FileTypes;
}

export interface Profile {
	[key: string]: ProfileItem;
}

export interface FormProfilesData {
	profiles: { [key: string]: Profile };
	profileNames: string[];
	activeProfile: string;
}