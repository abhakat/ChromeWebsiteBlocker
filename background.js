//background.js
// Define initial blocked sites



let blockedSites = [
    'www.youtube.com',
    'www.facebook.com',
    'www.netflix.com',
    'www.roblox.com',
    'discord.com',
    'www.spotify.com',
    'twitter.com'
];



// Store the initial list of blocked sites in Chrome's local storage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addBlockedSite") {
      const newSite = message.site;
  
      // Get current list of blocked sites
      chrome.storage.local.get(["blockedSites"], (result) => {
        let blockedSites = result.blockedSites || [];
  
        if (!blockedSites.includes(newSite)) {
          blockedSites.push(newSite);
          console.log("HI HI HI HI");
  
          // Update the list in Chrome's local storage
          chrome.storage.local.set({ blockedSites }, () => {
            console.log("added blocked site")
            sendResponse({ success: true });
            const blockedSitesString = blockedSites.join(", ");  // Join the sites with commas
            console.log("Blocked sites: " + blockedSitesString);  // Di

          });
        } else {
          sendResponse({ success: false, error: "Site already blocked" });
        }
      });
  
      // Indicate that the response is asynchronous
      return true;
    }
  });


function getBlockedSites(callback) {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || []; // Default to empty array if not set
    });
}

let timeSpentOnBlockedSites = 0;
let allowedBlockedTime = 100;
let currentTabTime = -1;
let currentTabBlocked = false;
let currentTabId;
let currentUrl;

let shutdownBlockedSites = true;

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "https://leetcode.com/" }); // External URL to open
});

chrome.tabs.onCreated.addListener((tab) => {
    setTimeout(() => {
        if (tab.url === "chrome://newtab/") {
            chrome.tabs.update(tab.id, { url: "https://leetcode.com/" });
        }
    }, 100);  // Delay by 100 ms to ensure override
});

chrome.storage.local.set({'shutdown': shutdownBlockedSites}, function() {
    console.log("Shutdown is set to in storage. : " + shutdownBlockedSites);
});



chrome.tabs.onActivated.addListener(activeInfo => {

    const blockedSitesString = blockedSites.join(", ");  // Join the sites with commas
    console.log("Blocked sites: " + blockedSitesString);  // Di
    currentTabId = activeInfo.tabId;
    chrome.tabs.get(currentTabId, (tab) => {
        updateTabTime(activeInfo.tabId, tab.url);  // Pass the current tab's URL to updateTabTime
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === currentTabId && changeInfo.url) {
        currentUrl = changeInfo.url; // Update currentUrl here
        updateTabTime(tabId, changeInfo.url);
    }
});

function updateTabTime(tabId, newUrl = null) {
    if (newUrl) {
        currentUrl = newUrl; // Make sure currentUrl is updated with new URL
    }
    else {
        currentUrl = "https://www.google.com/"; //else set to default of google
    }
    let url = new URL(currentUrl);
    let hostname = url.hostname;
    let newSiteBlocked = isSiteBlocked(hostname);
    let currentTime = Date.now();

    if (currentTabBlocked && !shutdownBlockedSites) {
        timeSpentOnBlockedSites += currentTime - currentTabTime;  // Update time spent on blocked sites
    }

    // Update the current tab time and blocked status
    if (newSiteBlocked) {
        currentTabTime = currentTime;
        currentTabBlocked = true;
    } else {
        currentTabTime = -1;
        currentTabBlocked = false;
    }
    if (shutdownBlockedSites || timeSpentOnBlockedSites > allowedBlockedTime) {
        shutdownBlockedSites = true;
        console.log("shutdown block sites: ", shutdownBlockedSites);

    }


    console.log("Time spent on blocked sites: " + timeSpentOnBlockedSites);
    chrome.storage.local.set({'shutdown': shutdownBlockedSites}, function() {
        console.log("Shutdown is set to in storage. : " + shutdownBlockedSites);
    });
}



function isSiteBlocked(hostname) {
    getBlockedSites();
    console.log("IN THIS BITCH");
    console.log("Blocked sites: ", blockedSites)
    const blockedSitesString = blockedSites.join(", ");  // Join the sites with commas
    console.log("Blocked sites: " + blockedSitesString);  // Di
    return blockedSites.includes(hostname);
}

