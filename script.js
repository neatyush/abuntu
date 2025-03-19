function updateDateTime() {
    let currentDate = new Date();
    
    let options = { 
        month: "short", // "Mar"
        day: "numeric", // "9"
        hour: "2-digit", // "21"
        minute: "2-digit", // "01"
        hour12: false // 24-hour format
    };

    let formattedDate = currentDate.toLocaleString("en-US", options).replace(",", "");

    document.querySelector(".centerDate").innerHTML = formattedDate;
}

updateDateTime(); // Run once immediately
setInterval(updateDateTime, 1000); // Update every second

// window functionality
// Track open windows
let windowInstances = {};

// Click event to open/restore windows
document.querySelectorAll('.docklink').forEach(icon => {
    icon.addEventListener('click', function() {
        const appName = icon.getAttribute('data-app');
        openOrRestoreWindow(appName, icon);
    });
});

// Function to open or restore a window
function openOrRestoreWindow(appName, dockIcon) {
    let existingWindow = windowInstances[appName];

    if (existingWindow) {
        // Restore minimized window instead of opening a new one
        existingWindow.style.display = "block";
        return;
    }

    // Create window container
    const windowDiv = document.createElement('div');
    windowDiv.classList.add('window');
    windowDiv.id = appName.replace(/\s+/g, '') + "-0"; // Unique per app

    // Default window size
    let winWidth = 400, winHeight = 300;

    // Get viewport size and calculate center position
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let startX = Math.max((viewportWidth - winWidth) / 2, 10);
    let startY = Math.max((viewportHeight - winHeight) / 2, 10);

    windowDiv.style.width = `${winWidth}px`;
    windowDiv.style.height = `${winHeight}px`;
    windowDiv.style.left = `${startX}px`;
    windowDiv.style.top = `${startY}px`;

    // Window header with buttons
    windowDiv.innerHTML = `
        <div class="window-header">
            <span>${appName}</span>
            <div class="window-buttons">
                <button class="minimize-btn"></button>
                <button class="resize-btn"></button>
                <button class="close-btn"></button>
            </div>
        </div>
        <div class="window-body">
            ${appName === "Camera" ? '<video id="webcam" autoplay></video>' : `<p>Content of ${appName}</p>`}
        </div>
    `;

    document.body.appendChild(windowDiv);
    windowInstances[appName] = windowDiv; // Store reference

    updateDockCount(dockIcon, appName);
    makeDraggable(windowDiv);

    if (appName === "Camera") startWebcam(windowDiv);

    // Close window
    windowDiv.querySelector('.close-btn').addEventListener('click', function() {
        windowDiv.remove();
        delete windowInstances[appName]; // Remove from tracking
        updateDockCount(dockIcon, appName);
    });

    // Minimize window
    windowDiv.querySelector('.minimize-btn').addEventListener('click', function() {
        windowDiv.style.display = 'none';
    });

    // Resize window (toggle fullscreen)
    windowDiv.querySelector('.resize-btn').addEventListener('click', function() {
        toggleFullscreen(windowDiv);
    });
}

// Function to toggle fullscreen while keeping the window within screen bounds
function toggleFullscreen(windowDiv) {
    let dockHeight = 50; // Adjust this based on your actual dock/taskbar height
    let maxWidth = window.innerWidth, maxHeight = window.innerHeight - dockHeight;

    if (windowDiv.classList.contains('fullscreen')) {
        // Restore original size and position
        let winWidth = 400, winHeight = 300;
        windowDiv.style.width = `${winWidth}px`;
        windowDiv.style.height = `${winHeight}px`;

        // Keep it centered after restoring
        let startX = Math.max((maxWidth - winWidth) / 2, 10);
        let startY = Math.max((maxHeight - winHeight) / 2, 10);
        windowDiv.style.left = `${startX}px`;
        windowDiv.style.top = `${startY}px`;

        windowDiv.classList.remove('fullscreen');
    } else {
        // Maximize but ensure it doesn't go under the dock
        windowDiv.style.width = `${maxWidth}px`;
        windowDiv.style.height = `${maxHeight}px`;
        windowDiv.style.left = "0px";
        windowDiv.style.top = "0px";
        windowDiv.classList.add('fullscreen');
    }
}

// Function to update dock icon window count
function updateDockCount(dockIcon, appName) {
    const countSpan = dockIcon.querySelector('.window-count');
    countSpan.textContent = Object.keys(windowInstances).includes(appName) ? 1 : 0;
    countSpan.style.display = windowInstances[appName] ? "block" : "none";
}

// Function to make windows draggable within screen bounds
function makeDraggable(windowElement) {
    let offsetX, offsetY, isDragging = false;

    const header = windowElement.querySelector('.window-header');
    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - windowElement.offsetLeft;
        offsetY = e.clientY - windowElement.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
    });

    function onMouseMove(e) {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Ensure window stays within bounds (avoiding dock/taskbar)
        const maxX = window.innerWidth - windowElement.offsetWidth;
        const maxY = window.innerHeight - windowElement.offsetHeight - 50; // Avoid dock

        windowElement.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        windowElement.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    }

    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
    });
}

// Function to start webcam stream in Camera app
function startWebcam(windowDiv) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            let video = windowDiv.querySelector("#webcam");
            if (video) video.srcObject = stream;
        })
        .catch(err => console.error("Webcam access denied:", err));
}
