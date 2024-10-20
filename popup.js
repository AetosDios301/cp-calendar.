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

            contestElement.innerHTML = `
                <a href="${contest.url}" target="_blank">
                    <strong>${contest.name}</strong><br>
                    Start Time: ${new Date(contest.start_time).toLocaleString()}
                </a>
            `;
            contestList.appendChild(contestElement);
        });
    }
});