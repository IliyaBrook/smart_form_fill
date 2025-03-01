import defaultProfileData from '@src/storage/initialData/defaultProfile.json'
import { createStorage } from '@src/storage/base'
import type { FileTypes, FormProfilesData, Profile, ProfileItem } from '@src/types/settings'
import { StorageEnum } from '@src/types/storage'

function convertType(type: string): FileTypes {
	if (type === 'text' || type === 'file') {
		return type as FileTypes;
	} else {
		return 'text';
	}
}

const transformProfile = (profile: Record<string, ProfileItem>): Profile => {
	const transformedProfile: Profile = {};
	Object.entries(profile).forEach(([key, value]) => {
		transformedProfile[key] = {
			name: key,
			value:  value.value,
			type: convertType(value.type) ,
		};
	});
	return transformedProfile;
};
const initialData: FormProfilesData = {
	profiles: {
		default: transformProfile(defaultProfileData as Record<string, ProfileItem>)
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
