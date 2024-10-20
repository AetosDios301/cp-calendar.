const API_ENDPOINTS = {
    codeforces: "https://codeforces.com/api/contest.list?gym=false",
    codechef: "https://kontests.net/api/v1/code_chef",
    atcoder: "https://kontests.net/api/v1/at_coder"
};

async function fetchContests(platform) {
    try {
        const response = await fetch(API_ENDPOINTS[platform]);
        const data = await response.json();
        
        let contests;
        if (platform === "codeforces") {
            contests = data.result.filter(contest => contest.phase === "BEFORE").map(contest => ({
                name: contest.name,
                url: `https://codeforces.com/contest/${contest.id}`,
                start_time: new Date(contest.startTimeSeconds * 1000).toISOString()
            }));
        } else {
            contests = data.map(contest => ({
                name: contest.name,
                url: contest.url,
                start_time: contest.start_time
            }));
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

async function fetchAllContests() {
    const allContests = {};
    for (const platform of Object.keys(API_ENDPOINTS)) {
        try {
            allContests[platform] = await fetchContests(platform);
        } catch (error) {
            console.error(`Error fetching ${platform} contests:`, error);
            allContests[platform] = [];
        }
    }
    chrome.storage.local.set({ contests: allContests }, () => {
        console.log('All contests data saved');
    });
}

chrome.runtime.onInstalled.addListener(() => {
    fetchAllContests();
    chrome.alarms.create('fetchAllContests', { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchAllContests') {
        fetchAllContests();
    }
});