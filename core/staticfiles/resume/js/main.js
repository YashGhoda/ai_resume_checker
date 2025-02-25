document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token from cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Fetch job descriptions when page loads
    fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('jobDescription');
            data.data.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.job_title;
                select.appendChild(option);
            });
        });

    // Handle form submission
    document.getElementById('resumeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('resume', document.getElementById('resume').files[0]);
        formData.append('job_description', document.getElementById('jobDescription').value);

        try {
            const response = await fetch('/api/resume', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData,
                credentials: 'same-origin'  // This is important for CSRF
            });
            
            const result = await response.json();
            if (result.status) {
                displayResults(result.data);
            } else {
                alert(result.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing your request');
        }
    });

    function displayResults(data) {
        // Show results section
        document.getElementById('results').classList.remove('hidden');
        
        // Update score
        const scoreValue = document.getElementById('scoreValue');
        scoreValue.style.width = `${data.rank}%`;
        scoreValue.textContent = `${data.rank}%`;
        
        // Update experience
        document.getElementById('experience').textContent = `${data.total_experience} years`;
        
        // Update skills
        const skillsContainer = document.getElementById('skills');
        skillsContainer.innerHTML = data.skills.map(skill => 
            `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${skill}</span>`
        ).join('');
        
        // Update categories
        const categoriesContainer = document.getElementById('categories');
        categoriesContainer.innerHTML = data.project_category.map(category => 
            `<span class="bg-green-100 text-green-800 px-2 py-1 rounded">${category}</span>`
        ).join('');
    }
}); 