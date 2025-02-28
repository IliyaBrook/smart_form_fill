import Img from '@src/components/Img'
import ThemeToggleButton from '@src/components/ThemeToggleButton'
import { useStorage } from '@src/hooks'
import { themeStorage } from '@src/storage'
import formProfileStorage from '@src/storage/formProfileStorage'
import type { Theme } from '@src/types/storage'
import { cn } from '@src/utils/cn'
import { navigateToTab, navigateToUrl } from '@src/utils/navigateUtils'
import { Button, Divider, Select, Space } from 'antd'
import React from 'react'


const Popup = () => {
	const theme: Theme = useStorage(themeStorage)
	const isLight = theme === 'light'
	
	const { profiles, profileNames, activeProfile } = useStorage(formProfileStorage);
	console.log("profiles: ", profiles)
	console.log("profileNames: ", profileNames)
	console.log("activeProfile: ", activeProfile)
	
	const profileSelectOptions = profileNames.map(profile => ({label: profile, value: profile}))
	const onChangeProfile = (value: string) => {
		formProfileStorage.set(prev => ({
			...prev,
			activeProfile: value
		}));
	}
	
	return (
		<div
			className={cn(
				'grid grid-rows-[1fr_3fr_1fr]',
				isLight ? 'bg-white text-black' : 'bg-black text-gray-100'
			)}
		>
			{/* Header */}
			<header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 h-full">
				<div className="flex space-x-2">
					<ThemeToggleButton theme={theme} />
					<Button
						type="default"
						onClick={() => navigateToUrl("https://github.com/IliyaBrook/smart_form_fill/blob/master/README.md")}
						icon={<Img
							theme={theme}
							alt="info"
							lightSrc="info_white.png"
							darkSrc="info_black.png"
						/>}
					/>
					<Button
						type="default"
						onClick={() => navigateToUrl("https://github.com/IliyaBrook/smart_form_fill/issues")}
						icon={<Img
							theme={theme}
							alt="bug"
							lightSrc="bug_white.png"
							darkSrc="bug_black.png"
						/>}
					/>
				</div>
				<div>
					<Button
						type="default"
						onClick={() => navigateToTab('src/pages/settings/index.html')}
						icon={<Img
							theme={theme}
							alt="info"
							lightSrc="info_white.png"
							darkSrc="info_black.png"
							className="w-4 h-4 mr-2"
						/>}
					>
						Settings
					</Button>
				</div>
				<div>
					<Select
						showSearch
						placeholder="Select Profile"
						optionFilterProp="label"
						onChange={onChangeProfile}
						options={profileSelectOptions}
						value={activeProfile}
					/>
				</div>
			</header>
			{/* Main Content */}
			<div className="flex justify-center h-full">
				<Space>
					<Button
						size='large'
						type='default'
						icon={<Img
							theme={theme}
							alt="info"
							lightSrc="form_white.png"
							darkSrc="form_black.png"
							className="w-4 h-4 mr-2"
						/>}
						onClick={() => {
							//@Todo implement "FILL FORM"
						}}
					>
						FILL FORM
					</Button>
				</Space>
			</div>
			<div className="flex items-center justify-around h-full">
				<Space>
					<Button
						type='default'
						size='middle'
						shape='round'
						onClick={() => {
							//@Todo implement "Extract roles"
						}}
					>
						Extract roles
					</Button>
				</Space>
				<Divider
					type="vertical"
					className="border h-[60%]"
					// style={{ borderWidth: '1px', height: '60%' }}
				/>
				<Space>
					<Button
						shape='round'
						type='default'
						size='middle'
						onClick={() => {
							//@Todo implement "Update Profile"
						}}
						// className="px-4 py-2 rounded shadow-sm"
					>
						Update Profile
					</Button>
				</Space>
			</div>
		</div>
	)
}

export default Popup
