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



// After adding a blocked site, ensure that `blockedSites` is updated with the new list
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addBlockedSite") {
        const newSite = message.site;

        chrome.storage.local.get(["blockedSites"], (result) => {
            let blockedSites = result.blockedSites || [];

            if (!blockedSites.includes(newSite)) {
                blockedSites.push(newSite);

                chrome.storage.local.set({ blockedSites }, () => {
                    sendResponse({ success: true });
                    console.log("Blocked sites: " + blockedSites.join(", ")); // Log updated blocked sites
                    let newBlockedSites = blockedSites;
                    blockedSites = newBlockedSites;
                });
            } else {
                sendResponse({ success: false, error: "Site already blocked" });
            }
        });

        return true; // Indicate asynchronous response
    }
});


  function getBlockedSites(callback) {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || []; // Default to empty array if not set
        callback(blockedSites);
    });
}

let timeSpentOnBlockedSites = 0;
let allowedBlockedTime = 100;
let currentTabTime = -1;
let currentTabBlocked = false;
let currentTabId;
let currentUrl;

let shutdownBlockedSites = true;

// chrome.action.onClicked.addListener(() => {
//     chrome.tabs.create({ url: "https://leetcode.com/" }); // External URL to open
// });

// chrome.tabs.onCreated.addListener((tab) => {
//     setTimeout(() => {
//         if (tab.url === "chrome://newtab/") {
//             chrome.tabs.update(tab.id, { url: "https://leetcode.com/" });
//         }
//     }, 100);  // Delay by 100 ms to ensure override
// });

chrome.storage.local.set({'shutdown': shutdownBlockedSites}, function() {
    console.log("Shutdown is set to in storage. : " + shutdownBlockedSites);
});



// After a tab becomes active, ensure blockedSites is properly fetched
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || []; // Default to empty array if not set

        // Log the current blocked sites
        console.log("Blocked sites: " + blockedSites.join(", "));

        currentTabId = activeInfo.tabId; // Store the current active tab ID
        
        // Check if blockedSites is an array
        if (!Array.isArray(blockedSites)) {
            blockedSites = []; // Default to empty array if it's not
        }

        // Fetch the current tab and update tab time with blocked sites
        chrome.tabs.get(currentTabId, (tab) => {
            updateTabTime(currentTabId, tab.url, blockedSites);
        });
    });
});


// After a tab is updated, ensure blockedSites is properly fetched
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || [];

        // Ensure blockedSites is an array before using it
        if (!Array.isArray(blockedSites)) {
            blockedSites = [];
        }

        if (tabId === currentTabId && changeInfo.url) {
            updateTabTime(tabId, changeInfo.url, blockedSites);
        }
    });
});


function updateTabTime(tabId, newUrl) {
    let currentUrl = newUrl || "https://www.google.com/"; // Default to a safe URL
    let hostname = new URL(currentUrl).hostname;

    // Get the current time for tracking purposes
    let currentTime = Date.now();

    // Use the isSiteBlocked function to determine if the current site is blocked
    isSiteBlocked(hostname, (isBlocked) => {
        if (currentTabBlocked && !shutdownBlockedSites) {
            // If the current tab is blocked, update the time spent on blocked sites
            timeSpentOnBlockedSites += currentTime - currentTabTime;
        }

        currentTabBlocked = isBlocked;

        if (isBlocked) {
            // If the current site is blocked, update the current tab time
            currentTabTime = currentTime;
        } else {
            currentTabTime = -1; // Reset the tab time if it's not blocked
        }

        // Check if shutdown should be enabled based on allowed time spent
        if (shutdownBlockedSites || timeSpentOnBlockedSites > allowedBlockedTime) {
            shutdownBlockedSites = true;
        }

        console.log("Time spent on blocked sites: " + timeSpentOnBlockedSites);

        // Save the shutdown status in local storage
        chrome.storage.local.set({ 'shutdown': shutdownBlockedSites }, () => {
            console.log("Shutdown set in storage: " + shutdownBlockedSites);
        });
    });
}



function isSiteBlocked(hostname, callback) {
    console.log("IN THIS BITCH");
    getBlockedSites((blockedSites) => {
        callback(blockedSites.includes(hostname));
        console.log("Blocked sites: ", blockedSites)
    });

}
