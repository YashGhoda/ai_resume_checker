document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements
    const form = document.getElementById('resumeForm');
    const fileInput = document.getElementById('resume');
    const jobSelect = document.getElementById('jobDescription');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const results = document.getElementById('results');

    // Get the download button and disable it initially
    const downloadBtn = document.getElementById('downloadPDF');
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name;
            if (fileName) {
                const textElement = document.querySelector('.file-drop-area p');
                if (textElement) {
                    textElement.textContent = `Selected: ${fileName}`;
                }
            }
        });
    }

    // Form submission handler
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset previous analysis
            resetAnalysis();

            if (!fileInput || !fileInput.files[0]) {
                alert('Please select a resume file');
                return;
            }
            if (!jobSelect || !jobSelect.value) {
                alert('Please select a job description');
                return;
            }

            // Show loading state
            loadingOverlay.classList.remove('hidden');

            try {
                const formData = new FormData();
                formData.append('resume', fileInput.files[0]);
                formData.append('job_description', jobSelect.value);

                const response = await fetch('/api/resume', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: formData
                });

                const result = await response.json();
                console.log('API Response:', result); // Debug log

                if (result.status && result.data) {
                    displayResults(result.data);
                } else {
                    throw new Error(result.message || 'Failed to analyze resume');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'An error occurred while analyzing the resume');
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        });
    }

    // Get CSRF token
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

    // Display results function
    function displayResults(data) {
        window.lastAnalysisData = data; // Store the data for PDF generation
        console.log('Displaying results:', data);
        
        // Show results section
        const results = document.getElementById('results');
        results.classList.remove('hidden');

        // Enable the download button
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        // Match Score
        const scoreValue = document.getElementById('scoreValue');
        if (scoreValue) {
            const rank = data.data.rank || 0;
            scoreValue.style.width = `${rank}%`;
            scoreValue.style.backgroundColor = rank >= 50 ? '#10B981' : '#EF4444';
            scoreValue.innerHTML = `<span class="text-white font-bold">${rank}%</span>`;
        }

        // Experience
        const experience = document.getElementById('experience');
        if (experience) {
            const years = data.data.total_experience || 0;
            experience.textContent = `${years} years`;
        }

        // Skills
        const skillsContainer = document.getElementById('skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            if (data.data.skills && data.data.skills.length > 0) {
                data.data.skills.forEach(skill => {
                    const div = document.createElement('div');
                    div.className = 'px-3 py-1 m-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium';
                    div.textContent = skill;
                    skillsContainer.appendChild(div);
                });
            } else {
                skillsContainer.innerHTML = '<p class="text-gray-500 italic">No skills found</p>';
            }
        }

        // Project Categories
        const categoriesContainer = document.getElementById('categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
            if (data.data.project_category && data.data.project_category.length > 0) {
                data.data.project_category.forEach(category => {
                    const div = document.createElement('div');
                    div.className = 'px-3 py-1 m-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium';
                    div.textContent = category;
                    categoriesContainer.appendChild(div);
                });
            } else {
                categoriesContainer.innerHTML = '<p class="text-gray-500 italic">No project categories found</p>';
            }
        }

        // Missing Skills
        const missingSkillsContainer = document.getElementById('missingSkills');
        if (missingSkillsContainer) {
            missingSkillsContainer.innerHTML = '';
            if (data.data.missing_skills && data.data.missing_skills.length > 0) {
                data.data.missing_skills.forEach(skill => {
                    const div = document.createElement('div');
                    div.className = 'px-3 py-1 m-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center';
                    div.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${skill}`;
                    missingSkillsContainer.appendChild(div);
                });
            } else {
                missingSkillsContainer.innerHTML = '<p class="text-gray-500 italic">No missing skills</p>';
            }
        }

        // Score Breakdown
        if (data.data.score_breakdown) {
            const breakdown = data.data.score_breakdown;
            ['skills', 'experience', 'projects', 'keywords'].forEach(key => {
                const scoreElement = document.getElementById(`${key}Score`);
                const scoreBar = document.getElementById(`${key}ScoreBar`);
                if (scoreElement && scoreBar) {
                    const score = breakdown[key] || 0;
                    scoreElement.textContent = `${score}%`;
                    scoreBar.style.width = `${score}%`;
                }
            });
        }

        // Project Descriptions
        const projectDescContainer = document.getElementById('projectDescriptions');
        if (projectDescContainer) {
            projectDescContainer.innerHTML = '';
            if (data.data.project_description && Object.keys(data.data.project_description).length > 0) {
                Object.entries(data.data.project_description).forEach(([project, description]) => {
                    const div = document.createElement('div');
                    div.className = 'p-4 rounded-xl bg-gray-50 mb-4';
                    div.innerHTML = `
                        <h4 class="font-semibold text-indigo-600 mb-2">${project}</h4>
                        <p class="text-gray-700">${description}</p>
                    `;
                    projectDescContainer.appendChild(div);
                });
            } else {
                projectDescContainer.innerHTML = '<p class="text-gray-500 italic">No project descriptions available</p>';
            }
        }

        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset function for when starting new analysis
    function resetAnalysis() {
        // Disable the download button
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Hide results
        const results = document.getElementById('results');
        if (results) {
            results.classList.add('hidden');
        }
    }

    // Fetch job descriptions
    fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
            if (data.data && jobSelect) {
                data.data.forEach(job => {
                    const option = document.createElement('option');
                    option.value = job.id;
                    option.textContent = job.job_title;
                    jobSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error fetching jobs:', error));

    // Add this after your existing code
    function generatePDF(data) {
        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 20; // Starting Y position
        const lineHeight = 10;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Resume Analysis Report', 105, yPos, { align: 'center' });
        yPos += lineHeight * 2;

        // Match Score
        doc.setFontSize(16);
        doc.text(`Match Score: ${data.data.rank}%`, 20, yPos);
        yPos += lineHeight * 1.5;

        // Experience
        doc.text(`Experience: ${data.data.total_experience} years`, 20, yPos);
        yPos += lineHeight * 1.5;

        // Skills
        doc.text('Skills:', 20, yPos);
        yPos += lineHeight;
        if (data.data.skills && data.data.skills.length > 0) {
            doc.setFontSize(12);
            const skillsText = data.data.skills.join(', ');
            const splitSkills = doc.splitTextToSize(skillsText, 170);
            doc.text(splitSkills, 20, yPos);
            yPos += (splitSkills.length * lineHeight);
        }
        yPos += lineHeight;

        // Project Categories
        doc.setFontSize(16);
        doc.text('Project Categories:', 20, yPos);
        yPos += lineHeight;
        if (data.data.project_category && data.data.project_category.length > 0) {
            doc.setFontSize(12);
            data.data.project_category.forEach(category => {
                doc.text(`• ${category}`, 25, yPos);
                yPos += lineHeight;
            });
        }
        yPos += lineHeight;

        // Missing Skills
        doc.setFontSize(16);
        doc.text('Missing Skills:', 20, yPos);
        yPos += lineHeight;
        if (data.data.missing_skills && data.data.missing_skills.length > 0) {
            doc.setFontSize(12);
            data.data.missing_skills.forEach(skill => {
                doc.text(`• ${skill}`, 25, yPos);
                yPos += lineHeight;
            });
        }
        yPos += lineHeight;

        // Score Breakdown
        doc.setFontSize(16);
        doc.text('Score Breakdown:', 20, yPos);
        yPos += lineHeight;
        if (data.data.score_breakdown) {
            doc.setFontSize(12);
            Object.entries(data.data.score_breakdown).forEach(([key, value]) => {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                doc.text(`${formattedKey}: ${value}%`, 25, yPos);
                yPos += lineHeight;
            });
        }
        yPos += lineHeight;

        // Project Descriptions
        if (data.data.project_description && Object.keys(data.data.project_description).length > 0) {
            doc.setFontSize(16);
            doc.text('Project Descriptions:', 20, yPos);
            yPos += lineHeight;
            doc.setFontSize(12);
            Object.entries(data.data.project_description).forEach(([project, description]) => {
                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(project, 25, yPos);
                yPos += lineHeight;
                doc.setFont('helvetica', 'normal');
                const splitDesc = doc.splitTextToSize(description, 160);
                doc.text(splitDesc, 25, yPos);
                yPos += (splitDesc.length * lineHeight) + 5;
            });
        }

        // Footer
        doc.setFontSize(10);
        doc.text('Generated by Resume Analyzer', 105, 285, { align: 'center' });
        doc.text(new Date().toLocaleString(), 105, 290, { align: 'center' });

        // Save the PDF
        doc.save('resume-analysis-report.pdf');
    }

    // Download button click handler
    downloadBtn?.addEventListener('click', function() {
        if (!this.disabled && window.lastAnalysisData) {
            generatePDF(window.lastAnalysisData);
        }
    });
}); 