//popup.js

// Define function to get blocked sites
function getBlockedSites(callback) {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || [];
        callback(blockedSites);  // Pass the data to the callback function
    });
}


function renderBlockedSites() {
    const blockedSitesList = document.getElementById("blockedSitesList");

    // Clear existing content
    blockedSitesList.innerHTML = "";

    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || [];

        if (blockedSites.length > 0) {
            blockedSites.forEach((site, index) => {
                const listItem = document.createElement("li");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox"; // Create a checkbox
                checkbox.id = `blockedSite-${index}`; // Unique ID for each checkbox

                const label = document.createElement("label");
                label.htmlFor = checkbox.id; // Link label to checkbox
                label.textContent = site;

                listItem.style.display = "inline-block"; // Ensure items stay on the same line
                checkbox.style.marginRight = "8px"; // Add space between checkbox and label

                listItem.appendChild(checkbox); // Append checkbox to list item
                listItem.appendChild(label); // Append label to list item
                blockedSitesList.appendChild(listItem);
            });
        } else {
            const emptyMessage = document.createElement("li");
            emptyMessage.textContent = "No blocked sites found.";
            blockedSitesList.appendChild(emptyMessage);
        }
    });
}

// Function to update shutdown status in the popup
function updateShutdownStatus() {
    const shutdownStatus = document.getElementById("shutdownStatus");

    chrome.storage.local.get(['shutdown'], (result) => {
        const isShutdown = result.shutdown;
        shutdownStatus.textContent = isShutdown ? "Shutdown Enabled" : "Shutdown Disabled";
    });
}

function saveInput() {
    const inputBar = document.getElementById("inputBar");
    const newSite = inputBar.value;
  
    if (newSite) {
      // Send a message to the background script to update blocked sites
      chrome.runtime.sendMessage(
        { action: "addBlockedSite", site: newSite },
        (response) => {
          if (response.success) {
            console.log("Site added to blocked list");
            renderBlockedSites(); // Re-render the list to show the new site
          }
        }
      );
    }
  
    inputBar.value = ""; // Clear the input field
  }

// Function to delete selected sites from the blocked list
function deleteSelectedSites() {
    const blockedSitesList = document.getElementById("blockedSitesList");

    chrome.storage.local.get(['blockedSites'], (result) => {
        let blockedSites = result.blockedSites || [];

        const selectedSites = []; // List of sites to be deleted

        // Find all checked checkboxes and add corresponding sites to selectedSites
        blockedSitesList.childNodes.forEach((listItem, index) => {
            const checkbox = listItem.querySelector("input[type='checkbox']");
            if (checkbox && checkbox.checked) {
                selectedSites.push(index); // Store the index to remove from blockedSites
            }
        });

        // Remove selected sites from blockedSites
        blockedSites = blockedSites.filter((_, index) => !selectedSites.includes(index));

        // Update Chrome's local storage with the new blocked sites list
        chrome.storage.local.set({ 'blockedSites': blockedSites }, () => {
            renderBlockedSites(); // Re-render the list after deletion
        });
    });
}

// Function to initialize the state of the toggle switch from local storage
function initializeBlockingSwitch() {
    const blockingSwitch = document.getElementById("blockingSwitch");

    // Get the current state of the blocking switch from local storage
    chrome.storage.local.get(['forceBlock'], (result) => {
        const forceBlock = result.forceBlock ?? false; // Default to true
        blockingSwitch.checked = forceBlock; // Set the switch based on the stored value
    });

    // Update the state in local storage when the switch is toggled
    blockingSwitch.addEventListener("change", (event) => {
        chrome.storage.local.set({ 'forceBlock': event.target.checked }, () => {
            console.log("Site blocking enabled:", event.target.checked);
        });
    });
}

// Event listeners for popup initialization
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("saveButton").addEventListener("click", saveInput);
    document.getElementById("deleteButton").addEventListener("click", deleteSelectedSites);

    renderBlockedSites(); // Render blocked sites when the popup is loaded
    updateShutdownStatus(); // Update shutdown status when the popup is loaded

    initializeBlockingSwitch(); // Initialize the blocking switch
    // alert("blocking switch initialized");
});

