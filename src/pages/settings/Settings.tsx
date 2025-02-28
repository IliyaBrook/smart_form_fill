import FormProfile from '@pages/settings/formProfile/formProfile'
import FormRules from '@pages/settings/formRules/formRules'
import GeneralSettings from '@pages/settings/generalSettings/generalSettings'
import useTheme from '@src/hooks/useTheme'
import { ConfigProvider, Tabs } from 'antd'
import '@pages/global.css'

const Settings = () => {
	useTheme()
	
	return (
		<ConfigProvider>
			<div className="px-4 py-2">
				<Tabs
					defaultActiveKey='2'
					className='px-4'
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