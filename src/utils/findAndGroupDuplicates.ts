interface FindDuplicatesResult<T> {
	uniqueObjects: Record<string, T>;
	duplicateKeys: string[];
	duplicates: Record<string, T[]>;
}

function findAndGroupDuplicates<T>(
	object: Record<string, T>,
	keyExtractor: (item: T) => string
): FindDuplicatesResult<T> {
	const uniqueObjects: Record<string, T> = {};
	const duplicates: Record<string, T[]> = {};
	
	Object.values(object).forEach((item) => {
		const key = keyExtractor(item).toLowerCase();
		
		if (uniqueObjects[key]) {
			if (!duplicates[key]) {
				duplicates[key] = [uniqueObjects[key]];
			}
			duplicates[key].push(item);
		} else {
			uniqueObjects[key] = item;
		}
	});
	
	return { uniqueObjects, duplicateKeys: Object.keys(duplicates), duplicates };
}

export default findAndGroupDuplicates;