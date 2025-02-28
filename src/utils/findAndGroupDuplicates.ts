interface ProfileField {
	name: string;
	value: string;
}

interface Profile {
	[key: string]: ProfileField;
}

interface FindDuplicatesResult {
	uniqueObject: { [key: string]: ProfileField };
	duplicateKeys: string[];
}

function findAndGroupDuplicates(profile: Profile): FindDuplicatesResult {
	const uniqueObject: { [key: string]: ProfileField } = {};
	const duplicates: { [key: string]: ProfileField[] } = {};
	
	Object.values(profile).forEach((item) => {
		const key = item.name.toLowerCase();
		if (uniqueObject[key]) {
			if (!duplicates[key]) {
				duplicates[key] = [uniqueObject[key]];
			}
			duplicates[key].push(item);
		} else {
			uniqueObject[key] = item;
		}
	});
	
	return { uniqueObject, duplicateKeys: Object.keys(duplicates) };
}

export default findAndGroupDuplicates;