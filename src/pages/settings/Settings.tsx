import FormProfile from '@pages/settings/formProfile/formProfile'
import FormRules from '@pages/settings/formRules/formRules'
import GeneralSettings from '@pages/settings/generalSettings/generalSettings'
import useTheme from '@src/hooks/useTheme'
import { ConfigProvider, Tabs } from 'antd'
import '@pages/global.css'
import { useEffect, useState } from 'react'

const Settings = () => {
	useTheme()
	const [activeTab, setActiveTab] = useState("2");
	
	useEffect(() => {
		chrome.storage.local.get('activeTab', result => {
			if (result?.activeTab) {
				setActiveTab(result.activeTab);
			}
		});
	}, []);
	
	return (
		<ConfigProvider>
			<div className="px-4 py-2">
				<Tabs
					key={`render-key-${activeTab}`}
					defaultActiveKey={activeTab}
					className='px-4'
					onTabClick={key => {
						chrome.storage.local.set({ activeTab: key }, () => {
							setActiveTab(key);
						});
					}}
				>
					<Tabs.TabPane tab='General Settings' key='1'>
						<GeneralSettings />
					</Tabs.TabPane>
					<Tabs.TabPane tab='Form Profile' key='2'>
						<FormProfile />
					</Tabs.TabPane>
					<Tabs.TabPane tab='Form Rules' key='3'>
						<FormRules />
					</Tabs.TabPane>
				</Tabs>
			</div>
		</ConfigProvider>
	)
}
export default Settings;