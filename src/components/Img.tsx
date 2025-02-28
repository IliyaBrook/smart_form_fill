import type { Theme } from '@src/types/storage'
import React from 'react'

interface IImg extends React.HTMLAttributes<HTMLImageElement> {
	darkSrc?: string;
	lightSrc?: string;
	src?: string;
	alt: string;
	theme?: Theme
}

const Img: React.FC<IImg> = ({
	                                    src,
	                                    darkSrc,
	                                    lightSrc,
	                                    alt,
	                                    theme,
	                                    ...props
                                    }) => {
	
	const getSrc = () => {
		if (src) {
			return src;
		}else {
			if (theme) {
				if (lightSrc && darkSrc) {
					const isLight = theme === 'light'
					return isLight
						? chrome.runtime.getURL(lightSrc)
						: chrome.runtime.getURL(darkSrc)
				}else {
					throw new Error('lightSrc and darkSrc are required')
				}
			}else {
				throw new Error('theme is required or use src instead of lightSrc and darkSrc')}
		}
	}
	const imageSrc = getSrc()
	
	return (
		<img
			src={imageSrc}
			alt={alt}
			{...props}
		/>
	)
}

export default Img