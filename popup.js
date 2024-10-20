document.addEventListener("DOMContentLoaded", () => {
    const contestList = document.getElementById("contest-list");
    const platforms = ["codeforces", "codechef", "atcoder"];
    let currentPlatform = "codeforces";

    // Theme toggle
    const themeSwitch = document.getElementById("theme-switch");
    themeSwitch.addEventListener("change", () => {
        document.body.classList.toggle("dark-theme");
        chrome.storage.local.set({ darkTheme: themeSwitch.checked });
    });

    // Load saved theme
    chrome.storage.local.get("darkTheme", (data) => {
        if (data.darkTheme) {
            themeSwitch.checked = true;
            document.body.classList.add("dark-theme");
        }
    });

    // Platform buttons
    platforms.forEach(platform => {
        const btn = document.getElementById(`${platform}-btn`);
        btn.addEventListener("click", () => {
            document.querySelector(".platform-btn.active").classList.remove("active");
            btn.classList.add("active");
            currentPlatform = platform;
            fetchContests(platform);
        });
    });

    // Search input
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", filterContests);

    // Duration filter
    const durationFilter = document.getElementById("duration-filter");
    durationFilter.addEventListener("change", filterContests);

    // Refresh button
    const refreshBtn = document.getElementById("refresh-btn");
    refreshBtn.addEventListener("click", () => fetchContests(currentPlatform));

    function fetchContests(platform) {
        contestList.innerHTML = '<div class="loader">Loading contests...</div>';
        
        chrome.runtime.sendMessage({ action: "fetchContests", platform: platform }, (response) => {
            if (response.error) {
                console.error("Error fetching contests:", response.error);
                contestList.innerHTML = "Error fetching contests.";
            } else {
                displayContests(response.contests);
                updateLastUpdated();
            }
        });
    }

    function filterContests() {
        const searchTerm = searchInput.value.toLowerCase();
        const durationValue = durationFilter.value;

        chrome.storage.local.get(`${currentPlatform}Contests`, (data) => {
            const contests = data[`${currentPlatform}Contests`] || [];
            const filteredContests = contests.filter(contest => {
                const matchesSearch = contest.name.toLowerCase().includes(searchTerm);
                const matchesDuration = durationValue === "all" || matchesContestDuration(contest, durationValue);
                return matchesSearch && matchesDuration;
            });

            displayContests(filteredContests);
        });
    }

    function matchesContestDuration(contest, durationValue) {
        const durationHours = (new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60 * 60);
        switch (durationValue) {
            case "short": return durationHours < 2;
            case "medium": return durationHours >= 2 && durationHours <= 5;
            case "long": return durationHours > 5;
            default: return true;
        }
    }

    function displayContests(contests) {
        contestList.innerHTML = "";
        if (contests.length === 0) {
            contestList.innerHTML = "<p>No contests found.</p>";
            return;
        }

        contests.forEach(contest => {
            const contestElement = document.createElement("div");
            contestElement.className = "contest-item";
            contestElement.innerHTML = `
                <h3>${contest.name}</h3>
                <p>Start: ${new Date(contest.start_time).toLocaleString()}</p>
                <p>Duration: ${formatDuration(contest.start_time, contest.end_time)}</p>
                <a href="${contest.url}" target="_blank">Go to contest</a>
            `;
            contestList.appendChild(contestElement);
        });
    }

    function formatDuration(start, end) {
        const durationHours = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
        return durationHours.toFixed(1) + " hours";
    }

    function updateLastUpdated() {
        const lastUpdatedSpan = document.getElementById("last-updated");
        lastUpdatedSpan.textContent = new Date().toLocaleString();
    }

    // Initial fetch
    fetchContests(currentPlatform);
});