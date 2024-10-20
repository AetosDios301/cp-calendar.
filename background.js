const API_ENDPOINTS = {
    codeforces: "https://codeforces.com/api/contest.list",
    codechef: "https://kontests.net/api/v1/code_chef",
    atcoder: "https://kontests.net/api/v1/at_coder"
};

async function fetchContests(platform) {
    try {
        const response = await fetch(API_ENDPOINTS[platform]);
        const data = await response.json();
        
        let contests;
        if (platform === "codeforces") {
            contests = data.result
                .filter(contest => contest.phase === "BEFORE")
                .map(contest => ({
                    name: contest.name,
                    url: `https://codeforces.com/contest/${contest.id}`,
                    start_time: new Date(contest.startTimeSeconds * 1000).toISOString(),
                    end_time: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000).toISOString(),
                    platform: "Codeforces"
                }));
        } else {
            contests = data.map(contest => ({
                ...contest,
                platform: platform.charAt(0).toUpperCase() + platform.slice(1)
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

chrome.alarms.create('fetchContests', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchContests') {
        Object.keys(API_ENDPOINTS).forEach(platform => {
            fetchContests(platform)
                .then(contests => {
                    chrome.storage.local.set({ [`${platform}Contests`]: contests }, () => {
                        console.log(`${platform} contests updated`);
                    });
                })
                .catch(error => console.error(`Error updating ${platform} contests:`, error));
        });
    }
});