import fillForms from '@pages/content/renderContent/lib/fillForms'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import rulesStorage from '@src/storage/rulesStorage'
import type { FormProfilesData, RulesData } from '@src/types/settings'
import { useEffect } from 'react'

export default function Content() {
  const rulesData: RulesData = useStorage(rulesStorage);
  const { profiles, profileNames, activeProfile }: FormProfilesData = useStorage(formProfileStorage);
  
  useEffect(() => {
    // Обработчик сообщения
    const listener = (message: any, sender: any, sendResponse: (response: any) => void) => {
      if (message.action === "fillForm") {
        console.log("Content script: получено сообщение fillForm");
        
        if (!rulesData || Object.keys(rulesData).length === 0) {
          console.error("В локальном хранилище нет правил (rulesData пустой).");
          sendResponse({ message: "no rules" });
          return true;
        }
        
        if (!profiles || !activeProfile || !profiles[activeProfile]) {
          console.error("Активный профиль не найден или профили пусты.");
          sendResponse({ message: "no profile" });
          return true;
        }
        
        const profile = profiles[activeProfile];
        console.log("Активный профиль:", activeProfile, profile);
        console.log("Правила:", rulesData);
        
        fillForms(profile, rulesData);
        sendResponse({ message: "ok" });
        return true;
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [rulesData, profiles, activeProfile]);

  return null;
}
