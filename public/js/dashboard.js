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

    // Add keyboard navigation for modal
    document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('postModal');
        if (modal && modal.classList.contains('show')) {
            if (event.key === 'Escape') {
                bootstrap.Modal.getInstance(modal).hide();
            }
        }
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

// Add function to handle post clicks
async function openPostModal(platform, postId, postType) {
    const modal = new bootstrap.Modal(document.getElementById('postModal'));
    const modalTitle = document.getElementById('postModalLabel');
    const modalBody = document.getElementById('postModalContent');
    const modalEngagement = document.getElementById('postModalEngagement');
    const modalExternalLink = document.getElementById('postModalExternalLink');
    
    // Set loading state
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    modalTitle.textContent = `Loading ${postType}...`;
    modalEngagement.innerHTML = '';
    modal.show();

    try {
        // Generate embed code based on platform
        let embedHtml = '';
        let platformUrl = '';
        
        switch (platform) {
            case 'tiktok':
                platformUrl = `https://www.tiktok.com/embed/v2/${postId}`;
                embedHtml = `<iframe src="${platformUrl}" 
                    class="tiktok-embed" style="width: 100%; height: 600px;" 
                    frameborder="0" allow="autoplay"></iframe>`;
                break;
            case 'instagram':
                platformUrl = `https://www.instagram.com/${postType === 'story' ? 'stories' : postType}/${postId}`;
                embedHtml = `
                    <div class="text-center">
                        <p class="mb-3">Instagram ${postType}s cannot be embedded directly.</p>
                        <a href="${platformUrl}" target="_blank" class="btn btn-primary">
                            <i class="fab fa-instagram"></i> View on Instagram
                        </a>
                        <div class="mt-3">
                            <img src="/images/instagram-preview.png" alt="Instagram Preview" 
                                 class="img-fluid rounded shadow-sm" style="max-width: 300px;">
                        </div>
                    </div>`;
                break;
            case 'facebook':
                if (postType === 'video') {
                    platformUrl = `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${postId}`;
                } else {
                    platformUrl = `https://www.facebook.com/plugins/post.php?href=https://www.facebook.com/${postId}`;
                }
                embedHtml = `<iframe src="${platformUrl}" 
                    class="facebook-embed" style="width: 100%; height: 600px;" 
                    frameborder="0" scrolling="no"></iframe>`;
                break;
            case 'twitter':
                platformUrl = `https://platform.twitter.com/embed/Tweet.html?id=${postId}`;
                embedHtml = `<iframe src="${platformUrl}" 
                    class="twitter-embed" style="width: 100%; height: 400px;" 
                    frameborder="0" scrolling="no"></iframe>`;
                break;
        }

        modalTitle.textContent = `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${postType}`;
        modalBody.innerHTML = embedHtml;

        // Get post data for engagement metrics
        const response = await fetch(`/api/posts/${platform}?id=${postId}`);
        if (response.ok) {
            const { post } = await response.json();
            if (post) {
                modalEngagement.innerHTML = `
                    <div class="post-engagement">
                        ${post.views ? `
                            <div class="metric">
                                <i class="fas fa-eye"></i>
                                <span>${post.views.toLocaleString()} views</span>
                            </div>` : ''
                        }
                        ${post.likes ? `
                            <div class="metric">
                                <i class="fas fa-heart"></i>
                                <span>${post.likes.toLocaleString()} likes</span>
                            </div>` : ''
                        }
                        ${post.comments ? `
                            <div class="metric">
                                <i class="fas fa-comment"></i>
                                <span>${post.comments.toLocaleString()} comments</span>
                            </div>` : ''
                        }
                        ${post.shares ? `
                            <div class="metric">
                                <i class="fas fa-share"></i>
                                <span>${post.shares.toLocaleString()} shares</span>
                            </div>` : ''
                        }
                    </div>`;
            }
        }

        // Update external link
        modalExternalLink.href = getPostUrl(platform, { id: postId, type: postType });

    } catch (error) {
        console.error('Error loading post:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                Failed to load content. 
                <a href="${platformUrl}" target="_blank" class="alert-link">View on ${platform}</a>
            </div>`;
        modalEngagement.innerHTML = '';
    }
}

/**
 * Generate platform-specific URLs for posts
 * @param {string} platform - The social media platform
 * @param {Object} post - The post object
 * @returns {string} The platform URL for the post
 */
function getPostUrl(platform, post) {
    switch (platform) {
        case 'tiktok':
            return `https://www.tiktok.com/@budgetvegas/video/${post.id}`;
        case 'instagram':
            if (post.type === 'story') {
                return `https://www.instagram.com/stories/budgetvegas/${post.id}`;
            } else if (post.type === 'reel') {
                return `https://www.instagram.com/reel/${post.id}`;
            }
            return `https://www.instagram.com/p/${post.id}`;
        case 'facebook':
            if (post.type === 'video') {
                return `https://www.facebook.com/watch/?v=${post.id}`;
            } else if (post.type === 'event') {
                return `https://www.facebook.com/events/${post.id}`;
            }
            return `https://www.facebook.com/budgetvegas/posts/${post.id}`;
        case 'twitter':
            return `https://twitter.com/budgetvegas/status/${post.id}`;
        default:
            return '#';
    }
} 