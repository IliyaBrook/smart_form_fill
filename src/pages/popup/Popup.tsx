import Img from '@src/components/Img'
import ThemeToggleButton from '@src/components/ThemeToggleButton'
import { useStorage } from '@src/hooks'
import { themeStorage } from '@src/storage'
import formProfileStorage from '@src/storage/formProfileStorage'
import type { Theme } from '@src/types/storage'
import { cn, navigateToTab, navigateToUrl } from '@utils'
import { Button, Select, Space } from 'antd'
import React from 'react'

const Popup = () => {
	const theme: Theme = useStorage(themeStorage)
	const isLight = theme === 'light'
	
	const { profileNames, activeProfile } = useStorage(formProfileStorage)
	const profileSelectOptions = profileNames.map(profile => ({ label: profile, value: profile }))
	const onChangeProfile = (value: string) => {
		void formProfileStorage.set(prev => ({
			...prev,
			activeProfile: value
		}))
	}
	
	const handleFillForm = () => {
		chrome.tabs
			.query({ active: true, currentWindow: true })
			.then(tabs => {
				if (!tabs?.[0]?.id) return
				const currentTabId = tabs[0].id
				chrome.tabs.sendMessage(currentTabId, { action: 'fillForm' }, response => {
					if (chrome.runtime.lastError) {
						console.error('Error sending message:', chrome.runtime.lastError.message)
						return
					} else {
						console.log('Response from content script:', response)
					}
				})
			})
			.catch(error => console.error('Error in query:', error))
	};
	
	return (
		<div
			className={cn(
				'grid grid-rows-[1fr_3fr_1fr]',
				isLight ? 'bg-white text-black' : 'bg-black text-gray-100'
			)}
		>
			{/* Header */}
			<header className='flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 h-full'>
				<div className='flex space-x-2'>
					<ThemeToggleButton theme={theme} />
					<Button
						type='default'
						onClick={() => navigateToUrl('https://github.com/IliyaBrook/smart_form_fill/blob/master/README.md')}
						icon={<Img
							theme={theme}
							alt='info'
							lightSrc='info_white.png'
							darkSrc='info_black.png'
						/>}
					/>
					<Button
						type='default'
						onClick={() => navigateToUrl('https://github.com/IliyaBrook/smart_form_fill/issues')}
						icon={<Img
							theme={theme}
							alt='bug'
							lightSrc='bug_white.png'
							darkSrc='bug_black.png'
						/>}
					/>
				</div>
				<div>
					<Button
						type='default'
						onClick={() => navigateToTab('src/pages/settings/index.html')}
						icon={<Img
							theme={theme}
							alt='info'
							lightSrc='info_white.png'
							darkSrc='info_black.png'
							className='w-4 h-4 mr-2'
						/>}
					>
						Settings
					</Button>
				</div>
				<div>
					<Select
						showSearch
						placeholder='Select Profile'
						optionFilterProp='label'
						onChange={onChangeProfile}
						options={profileSelectOptions}
						value={activeProfile}
					/>
				</div>
			</header>
			{/* Main Content */}
			<div className='flex justify-center h-full'>
				<Space>
					<Button
						size='large'
						type='default'
						icon={<Img
							theme={theme}
							alt='info'
							lightSrc='form_white.png'
							darkSrc='form_black.png'
							className='w-4 h-4 mr-2'
						/>}
						onClick={handleFillForm}
					>
						FILL FORM
					</Button>
				</Space>
			</div>
		</div>
	)
}

export default Popup
