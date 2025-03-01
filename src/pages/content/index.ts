console.log("content loaded");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillForm') {
		chrome.storage.local.get()
			.then(storage => {
				console.log("data: ", storage)
				
			}).catch(err => console.log(err))
	  
  }
});
/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./renderContent");
