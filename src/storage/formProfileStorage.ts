import { createStorage } from '@src/storage/base';
import { StorageEnum } from '@src/types/storage';
import defaultProfileData from '@pages/settings/formProfile/defaultProfile.json'; // Импортируем defaultProfileData

export interface ProfileItem {
	name: string;
	value: string;
}

export interface Profile {
	[key: string]: ProfileItem;
}

export interface FormProfilesData {
	profiles: { [key: string]: Profile };
	profileNames: string[];
	activeProfile:string;
}
const transformProfile = (profile: any): Profile => {
	const transformedProfile: Profile = {};
	Object.entries(profile).forEach(([key, value]) => {
		transformedProfile[key] = { name: key, value: String(value) };
	});
	return transformedProfile;
};

const initialData: FormProfilesData = {
	profiles: {
		default: transformProfile(defaultProfileData)
	},
	profileNames: ['default'],
	activeProfile:'default'
};

const formProfileStorage = createStorage<FormProfilesData>(
	'form-profiles',
	initialData,
	{
		storageEnum: StorageEnum.Local,
		liveUpdate: true,
		serialization: {
			serialize: (data) => {
				return JSON.stringify(data);
			},
			deserialize: (str) => {
				if (!str) return initialData;
				try {
					const parsed = JSON.parse(str);
					if (typeof parsed !== 'object' || parsed === null) {
						return initialData;
					}
					
					const requiredKeys: (keyof FormProfilesData)[] = [
						'profiles',
						'profileNames',
						'activeProfile',
					];
					
					if (!requiredKeys.every((key) => key in parsed)) {
						return initialData;
					}
					
					return parsed;
				} catch {
					return initialData;
				}
			},
		},
	}
);

export default formProfileStorage;
