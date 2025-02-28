import { useStorage } from '@src/hooks/useStorage'
import { themeStorage } from '@src/storage'
import type { Theme } from '@src/types/storage'
import { useEffect } from 'react'

const useTheme = (): Theme => {
	const theme = useStorage(themeStorage);
	useEffect(() => {
		const themeId = "antd-theme";
		const existingLink = document.getElementById(themeId);
		
		if (existingLink) {
			existingLink.remove();
		}
		const link = document.createElement("link");
		link.id = themeId;
		link.rel = "stylesheet";
		link.href = theme === "dark"
			? `/assets/css/darkThem.chunk.css`
			: `/assets/css/lightThem.chunk.css`;
		
		document.head.appendChild(link);
	}, [theme]);
	return theme;
};

export default useTheme;