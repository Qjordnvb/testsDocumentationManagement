const API_BASE = '/api/v1';

// Utility functions
function showResult(elementId, message, isSuccess = true) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = isSuccess ? 'result success' : 'result error';
}

function hideResult(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

// Upload and parse file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        showResult('uploadResult', 'Please select a file first', false);
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showResult('uploadResult', `✓ ${data.message}\nParsed ${data.user_stories.length} user stories`);
            loadUserStories(); // Refresh the list
        } else {
            showResult('uploadResult', `✗ Error: ${data.detail}`, false);
        }
    } catch (error) {
        showResult('uploadResult', `✗ Network error: ${error.message}`, false);
    }
}

// Load user stories
async function loadUserStories() {
    try {
        const response = await fetch(`${API_BASE}/user-stories`);
        const stories = await response.json();

        const container = document.getElementById('storiesList');

        if (stories.length === 0) {
            container.innerHTML = '<p>No user stories found. Upload a file to get started.</p>';
            return;
        }

        container.innerHTML = stories.map(story => `
            <div class="story-item">
                <h3>${story.id}: ${story.title}</h3>
                <p>${story.description.substring(0, 150)}${story.description.length > 150 ? '...' : ''}</p>
                <div class="story-meta">
                    <span class="badge badge-priority-${(story.priority || 'medium').toLowerCase()}">
                        ${story.priority || 'N/A'}
                    </span>
                    <span class="badge badge-status-${(story.status || 'backlog').toLowerCase().replace(/ /g, '-')}">
                        ${story.status || 'N/A'}
                    </span>
                    <span class="badge">Progress: ${story.completion_percentage || 0}%</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Generate test cases
async function generateTests() {
    const storyId = document.getElementById('storyId').value;
    const useAI = document.getElementById('useAI').checked;
    const numScenarios = document.getElementById('numScenarios').value;

    if (!storyId) {
        showResult('testResult', 'Please enter a Story ID', false);
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/generate-test-cases/${storyId}?use_ai=${useAI}&num_scenarios=${numScenarios}`,
            { method: 'POST' }
        );

        const data = await response.json();

        if (response.ok) {
            showResult('testResult', `✓ ${data.message}\nTest Case ID: ${data.test_case_id}\nFile: ${data.gherkin_file}`);
        } else {
            showResult('testResult', `✗ Error: ${data.detail}`, false);
        }
    } catch (error) {
        showResult('testResult', `✗ Network error: ${error.message}`, false);
    }
}

// Generate test plan
async function generateTestPlan() {
    const projectName = document.getElementById('projectName').value;
    const format = document.getElementById('planFormat').value;

    if (!projectName) {
        showResult('planResult', 'Please enter a Project Name', false);
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/generate-test-plan?project_name=${encodeURIComponent(projectName)}&format=${format}`,
            { method: 'POST' }
        );

        const data = await response.json();

        if (response.ok) {
            let filesText = Object.entries(data.files)
                .map(([type, path]) => `${type.toUpperCase()}: ${path}`)
                .join('\n');
            showResult('planResult', `✓ ${data.message}\n\n${filesText}`);
        } else {
            showResult('planResult', `✗ Error: ${data.detail}`, false);
        }
    } catch (error) {
        showResult('planResult', `✗ Network error: ${error.message}`, false);
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();

        const container = document.getElementById('statsContainer');
        container.innerHTML = `
            <div class="stat-card">
                <h3>${stats.total_user_stories}</h3>
                <p>User Stories</p>
            </div>
            <div class="stat-card">
                <h3>${stats.total_test_cases}</h3>
                <p>Test Cases</p>
            </div>
            <div class="stat-card">
                <h3>${stats.total_bugs}</h3>
                <p>Bugs</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Sync to Notion
async function syncToNotion() {
    const storyId = document.getElementById('notionStoryId').value;

    if (!storyId) {
        showResult('notionResult', 'Please enter a Story ID', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/sync-to-notion/${storyId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok) {
            showResult('notionResult', `✓ ${data.message}\nNotion Page ID: ${data.notion_page_id}`);
        } else {
            showResult('notionResult', `✗ Error: ${data.detail}`, false);
        }
    } catch (error) {
        showResult('notionResult', `✗ Network error: ${error.message}`, false);
    }
}

// Sync to Azure DevOps
async function syncToAzure() {
    const storyId = document.getElementById('azureStoryId').value;

    if (!storyId) {
        showResult('azureResult', 'Please enter a Story ID', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/sync-to-azure/${storyId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok) {
            showResult('azureResult', `✓ ${data.message}\nWork Item ID: ${data.work_item_id}`);
        } else {
            showResult('azureResult', `✗ Error: ${data.detail}`, false);
        }
    } catch (error) {
        showResult('azureResult', `✗ Network error: ${error.message}`, false);
    }
}

// Load initial data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserStories();
    loadStatistics();
});
