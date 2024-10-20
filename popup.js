document.addEventListener("DOMContentLoaded", () => {
    const contestList = document.getElementById("contest-list");
    const platforms = ["codeforces", "codechef", "atcoder"];

    platforms.forEach(platform => {
        document.getElementById(`${platform}-btn`).addEventListener("click", () => fetchContests(platform));
    });

    // Fetch contests from the default platform on load (Codeforces)
    fetchContests("codeforces");

    function fetchContests(platform) {
        contestList.innerHTML = "Loading contests...";
        
        chrome.runtime.sendMessage({ action: "fetchContests", platform: platform }, (response) => {
            if (response.error) {
                console.error("Error fetching contests:", response.error);
                contestList.innerHTML = "Error fetching contests.";
            } else {
                displayContests(response.contests, platform);
            }
        });
    }

    function displayContests(contests, platform) {
        contestList.innerHTML = "";
        contests.slice(0, 10).forEach(contest => {
            const contestElement = document.createElement("div");
            contestElement.className = "contest-item";

            const contestUrl = getContestUrl(contest, platform);
            const startTime = getStartTime(contest, platform);

            contestElement.innerHTML = `
                <a href="${contestUrl}" target="_blank">
                    <strong>${contest.name}</strong><br>
                    Start Time: ${new Date(startTime).toLocaleString()}
                </a>
            `;
            contestList.appendChild(contestElement);
        });
    }

    function getContestUrl(contest, platform) {
        switch (platform) {
            case "codeforces":
                return `https://codeforces.com/contest/${contest.id}`;
            case "codechef":
            case "atcoder":
                return contest.url;
            default:
                return "#";
        }
    }

    function getStartTime(contest, platform) {
        return platform === "codeforces" ? contest.startTimeSeconds * 1000 : new Date(contest.start_time).getTime();
    }
});