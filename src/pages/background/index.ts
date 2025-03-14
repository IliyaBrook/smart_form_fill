import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
declare const __IS_DEV__: boolean;


/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */

if (__IS_DEV__) {
	try {
		reloadOnUpdate("pages/background");
		reloadOnUpdate("global.css.scss");
	}catch {}
}