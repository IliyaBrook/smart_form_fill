/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./renderContent")
	.catch(error => {
		const errorMessage = error?.message;
		if (errorMessage?.includes("reading 'catch'")) {
			return
		}
		console.error("Error in directory: src/pages/content/index.ts \n", error)
	})
