import fillForms from '@pages/content/renderContent/lib/fillForms'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import rulesStorage from '@src/storage/rulesStorage'
import type { FormProfilesData, RulesData } from '@src/types/settings'
import { useEffect } from 'react'

export default function Content() {
	const rulesData: RulesData = useStorage(rulesStorage)
	const { profiles, activeProfile, profileNames }: FormProfilesData = useStorage(formProfileStorage)
	console.log("[formProfileStorage] profiles:", profiles)
	console.log("[formProfileStorage] activeProfile:", activeProfile)
	console.log("[formProfileStorage] profileNames:", profileNames)
	console.log("--------------------------------------")
	console.log("[rulesData]:", rulesData)
	
	useEffect(() => {
		// Message handler
		const listener = (message: any, sender: any, sendResponse: (response: any) => void) => {
			if (message.action === 'fillForm') {
				if (!rulesData || Object.keys(rulesData).length === 0) {
					console.error('No rules in local storage (rulesData is empty).')
					sendResponse({ message: 'no rules' })
					return true
				}
				
				if (!profiles || !activeProfile || !profiles[activeProfile]) {
					console.error('Active profile not found or profiles are empty.')
					sendResponse({ message: 'no profile' })
					return true
				}
				const profile = profiles[activeProfile]
				fillForms(profile, rulesData)
				sendResponse({ message: 'ok' })
				return true
			}
		}
		
		chrome.runtime.onMessage.addListener(listener)
		
		return () => {
			chrome.runtime.onMessage.removeListener(listener)
		}
	}, [rulesData, profiles, activeProfile])
	
	return null
}
