import Img from '@src/components/Img'
import { themeStorage } from '@src/storage'
import type { Theme } from '@src/types/storage'
import { Button } from 'antd'
import type { ComponentPropsWithoutRef } from 'react'

type ToggleButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'type'> & {
	type?: 'link' | 'text' | 'ghost' | 'default' | 'primary' | 'dashed';
	theme: Theme;
};
const ThemeToggleButton = ({
	                                  className,
	                                  children,
	                                  theme,
	                                  ...props
                                  }: ToggleButtonProps) => {
	return (
		<Button
			type='default'
			className={className}
			onClick={themeStorage.toggle}
			{...props}
			icon={
				<Img
					theme={theme}
					alt='change theme'
					lightSrc={'theme_white.png'}
					darkSrc={'theme_black.png'}
				/>}
		/>
	)
}
export default ThemeToggleButton;