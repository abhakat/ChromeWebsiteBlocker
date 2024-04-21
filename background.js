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



// Listen for when a tab becomes active
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Fetch the latest list of blocked sites from Chrome's local storage
    chrome.storage.local.get(['blockedSites'], (result) => {
        // Use the retrieved blocked sites list
        let blockedSites = result.blockedSites || [];  // Default to empty array if not set
        
        // Join the blocked sites with commas for logging/debugging
        const blockedSitesString = blockedSites.join(", ");
        console.log("Blocked sites: " + blockedSitesString);
        
        // Store the current active tab ID
        currentTabId = activeInfo.tabId;

        // Get details of the active tab
        chrome.tabs.get(currentTabId, (tab) => {
            // Update the tab time with the current URL and blocked sites
            updateTabTime(activeInfo.tabId, tab.url, blockedSites);
        });
    });
});;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === currentTabId && changeInfo.url) {
        currentUrl = changeInfo.url; // Update currentUrl here
        updateTabTime(tabId, changeInfo.url);
    }
});

// Modify updateTabTime to accept blocked sites as a parameter
function updateTabTime(tabId, newUrl, blockedSites) {
    let currentUrl = newUrl || "https://www.google.com/";  // Default URL if none is provided
    let url = new URL(currentUrl);
    let hostname = url.hostname;

    // Determine if the current site is blocked
    let newSiteBlocked = blockedSites.includes(hostname);
    let currentTime = Date.now();

    if (currentTabBlocked && !shutdownBlockedSites) {
        // Update time spent on blocked sites if current tab is blocked
        timeSpentOnBlockedSites += currentTime - currentTabTime;
    }

    // Set the status of the current tab based on whether it's blocked
    if (newSiteBlocked) {
        currentTabTime = currentTime;
        currentTabBlocked = true;
    } else {
        currentTabTime = -1;
        currentTabBlocked = false;
    }

    if (shutdownBlockedSites || timeSpentOnBlockedSites > allowedBlockedTime) {
        shutdownBlockedSites = true;
        console.log("Shutdown block sites: ", shutdownBlockedSites);
    }

    console.log("Time spent on blocked sites: " + timeSpentOnBlockedSites);

    // Update local storage with the current shutdown state
    chrome.storage.local.set({'shutdown': shutdownBlockedSites}, () => {
        console.log("Shutdown is set in storage. : " + shutdownBlockedSites);
    });
}




function isSiteBlocked(hostname, callback) {
    getBlockedSites((blockedSites) => {
        callback(blockedSites.includes(hostname));
    });
    console.log("IN THIS BITCH");
    console.log("Blocked sites: ", blockedSites)
}
