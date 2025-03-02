// import { fillForms } from '@pages/content/renderContent/lib/formUtils'
import type { FormProfilesData, RulesData } from '@src/types/settings'
import { useEffect } from 'react'
import fillForms from './lib/fillForms'


export default function Content() {
  useEffect(() => {
    const listener = (message: any, sender: any, sendResponse: (response: any) => void) => {
      if (message.action === "fillForm") {
        chrome.storage.local.get(["form-profiles", "rules"], (result) => {
          if (result["form-profiles"] && result["rules"]) {
            let profilesData: FormProfilesData;
            let rulesData: RulesData;
            try {
              profilesData = JSON.parse(result["form-profiles"]);
              rulesData = JSON.parse(result["rules"]);
            } catch (e) {
              console.error("Ошибка парсинга данных:", e);
              return;
            }
            const activeProfileName = profilesData.activeProfile;
            const profile = profilesData.profiles[activeProfileName];
            console.log("profilesData:", profilesData);
            console.log("rulesData:", rulesData);
            console.log("activeProfileName:", activeProfileName);
            console.log("[active profile]:", profile);
            if (profile) {
              fillForms(profile, rulesData);
            } else {
              console.error("Активный профиль не найден");
            }
          } else {
            console.error("Данные профилей или правил не найдены в storage");
          }
          sendResponse({ message: "ok" });
        });
        return true;
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);
  
  return null;
}
