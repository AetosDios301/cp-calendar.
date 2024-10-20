const API_ENDPOINTS = {
    codeforces: "https://codeforces.com/api/contest.list?gym=false",
    codechef: "https://www.kontests.net/api/v1/code_chef",
    atcoder: "https://www.kontests.net/api/v1/at_coder"
};

async function fetchContests(platform) {
    try {
        const response = await fetch(API_ENDPOINTS[platform]);
        const data = await response.json();
        
        let contests;
        if (platform === "codeforces") {
            contests = data.result.filter(contest => contest.phase === "BEFORE");
        } else {
            contests = data;
        }
        
        return contests;
    } catch (error) {
        console.error(`Error fetching ${platform} contests:`, error);
        throw error;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchContests") {
        fetchContests(request.platform)
            .then(contests => sendResponse({ contests }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Indicates we will send a response asynchronously
    }
});

// Fetch all contests periodically and store them
async function fetchAllContests() {
    const allContests = {};
    for (const platform of Object.keys(API_ENDPOINTS)) {
        try {
            allContests[platform] = await fetchContests(platform);
        } catch (error) {
            console.error(`Error fetching ${platform} contests:`, error);
        }
    }
    chrome.storage.local.set({ contests: allContests }, () => {
        console.log('All contests data saved');
    });
}

// Fetch contests when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    fetchAllContests();
    // Set up alarm to fetch contests periodically
    chrome.alarms.create('fetchAllContests', { periodInMinutes: 60 });
});

// Fetch contests when the alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchAllContests') {
        fetchAllContests();
    }
});