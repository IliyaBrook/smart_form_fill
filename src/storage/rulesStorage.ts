import { createStorage } from '@src/storage/base'
import type { RulesData } from '@src/types/settings'
import { StorageEnum } from '@src/types/storage'
import initialRulesData from './initialData/defaultRules.json'

// @ts-ignore
const rulesStorage = createStorage<RulesData>('rules', initialRulesData, {
	storageEnum: StorageEnum.Local,
	liveUpdate: true,
	serialization: {
		serialize: (data) => {
			return JSON.stringify(data);
		},
		deserialize: (str) => {
			if (!str) return initialRulesData;
			try {
				const parsed = JSON.parse(str);
				if (typeof parsed !== 'object' || parsed === null) {
					return initialRulesData;
				}
				for (const key in parsed) {
					if (typeof parsed[key] !== 'object' || parsed[key] === null) {
						return initialRulesData;
					}
					if (
						typeof parsed[key]['field-rule'] !== 'string' ||
						typeof parsed[key]['site-rule'] !== 'string'
					) {
						return initialRulesData;
					}
				}
				
				return parsed;
			} catch {
				return initialRulesData;
			}
		},
	},
});

export default rulesStorage;