// Load posts when the page loads and when tabs change
document.addEventListener('DOMContentLoaded', function() {
    // Load initial posts for the active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
        const platform = activeTab.id;
        loadPosts(platform, 1);
    }

    // Handle tab changes
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            const platform = event.target.getAttribute('data-bs-target').replace('#', '');
            loadPosts(platform, 1);
        });
    });
});

/**
 * Load posts for a specific platform and page
 * @param {string} platform - The social media platform
 * @param {number} page - The page number to load
 */
async function loadPosts(platform, page) {
    const postsContainer = document.getElementById(`${platform}-posts`);
    if (!postsContainer) return;

    try {
        const response = await fetch(`/api/posts/${platform}?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        
        // Render posts using the post-list partial
        postsContainer.innerHTML = await fetch('/partials/post-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                posts: data.posts,
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                platform
            })
        }).then(res => res.text());
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = `<div class="alert alert-danger">Failed to load posts: ${error.message}</div>`;
    }
}

/**
 * Run metrics collection for a specific platform
 * @param {string} platform - The social media platform
 */
async function runPlatformCollection(platform) {
    const button = document.getElementById(`${platform}-collect-btn`);
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Collecting...`;

    try {
        const response = await fetch(`/api/collect/${platform}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Show success message
        alert(`Successfully collected ${platform} data!`);
        
        // Reload the page to show new data
        window.location.reload();
    } catch (error) {
        console.error('Collection failed:', error);
        alert(`Failed to collect ${platform} data: ${error.message}`);
        
        // Reset button state
        button.disabled = false;
        button.innerHTML = `<i class="fab fa-${platform}"></i> Collect ${platform.charAt(0).toUpperCase() + platform.slice(1)} Data`;
    }
} 