export const isValidRegex = (pattern: string) => {
	try {
		new RegExp(pattern, 'i')
		return true
	} catch {
		return false
	}
}

/**
 * Safely compile a regex pattern. If it's invalid, return null and log an error.
 */
export function safeRegex(pattern: string): RegExp | null {
	try {
		return new RegExp(pattern, 'i')
	} catch (error) {
		console.error(`[safeRegex] Invalid RegExp pattern: "${pattern}"`, error)
		return null
	}
}