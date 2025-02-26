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

    // Display results function - keep this HTML-only
    function displayResults(data) {
        window.lastAnalysisData = data;
        console.log('Full response data:', data);
        
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

        // Experience - Updated logic with styled text
        const experience = document.getElementById('experience');
        if (experience) {
            const years = data.data.total_experience;
            let experienceText = '';
            
            if (!years) {
                experienceText = '<span class="text-xl font-bold text-indigo-600">Fresher</span> <span class="text-gray-600">(Looking for first job)</span>';
            } else if (years < 3) {
                experienceText = `<span class="text-xl font-bold text-indigo-600">Fresher</span> <span class="text-gray-600">(${years} ${years === 1 ? 'year' : 'years'})</span>`;
            } else {
                experienceText = `<span class="text-xl font-bold text-indigo-600">Experienced</span> <span class="text-gray-600">(${years} years)</span>`;
            }
            
            // Using innerHTML instead of textContent to render HTML tags
            experience.innerHTML = experienceText;
        } else {
            console.log('Experience element not found'); // Debug log
        }

        // Skills with improved wrapping
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

        // Missing Skills with improved formatting
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

        // Score Breakdown section
        if (data.data.score_breakdown) {
            const breakdownContainer = document.getElementById('scoreBreakdown');
            if (breakdownContainer) {
                breakdownContainer.innerHTML = ''; // Clear existing content
                
                // Add title
                const titleDiv = document.createElement('div');
                titleDiv.className = 'text-xl font-bold text-indigo-600 mb-4';
                titleDiv.textContent = 'Detailed Score Breakdown';
                breakdownContainer.appendChild(titleDiv);
                
                // Define categories in desired order
                const categories = [
                    { key: 'skills', label: 'Skills' },
                    { key: 'experience', label: 'Experience' },
                    { key: 'projects', label: 'Projects' },
                    { key: 'keywords', label: 'Keywords' }
                ];
                
                // Add each category
                categories.forEach(({ key, label }) => {
                    const value = data.data.score_breakdown[key] || 0;
                    
                    const div = document.createElement('div');
                    div.className = 'mb-4';
                    div.innerHTML = `
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-indigo-600 font-medium">${label}:</span>
                            <span class="text-indigo-600">${value}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${value}%"></div>
                        </div>
                    `;
                    breakdownContainer.appendChild(div);
                });
            }
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

    // Fetch job descriptions and populate dropdown
    fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
            if (data.data && jobSelect) {
                // Add a default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a job role';
                jobSelect.appendChild(defaultOption);
                
                // Add job options
                data.data.forEach(job => {
                    const option = document.createElement('option');
                    option.value = job.id;
                    option.textContent = job.job_title;
                    jobSelect.appendChild(option);
                });

                // Enable the select element
                jobSelect.disabled = false;
            } else {
                console.error('No job data received or job select element not found');
            }
        })
        .catch(error => {
            console.error('Error fetching jobs:', error);
            // Add error handling UI feedback if needed
            if (jobSelect) {
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error loading job roles';
                jobSelect.appendChild(errorOption);
            }
        });

    // Keep PDF generation separate in the generatePDF function
    function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 25;
        const lineHeight = 7;
        const margin = 20;
        const contentWidth = doc.internal.pageSize.width - (margin * 2);

        // Helper function for section headers
        function addSectionHeader(text) {
            yPos += lineHeight;
            doc.setDrawColor(63, 81, 181); // Indigo color
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(63, 81, 181);
            doc.text(text, margin, yPos);
            doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
            yPos += lineHeight * 1.2;
        }

        // Get job role
        const jobSelect = document.getElementById('jobDescription');
        const selectedJobTitle = jobSelect.options[jobSelect.selectedIndex].text;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text('Resume Analysis Report', 105, yPos, { align: 'center' });
        yPos += lineHeight * 2;

        // Job Role
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 73, 94);
        doc.text(`Position: ${selectedJobTitle}`, 105, yPos, { align: 'center' });
        yPos += lineHeight * 2;

        // Match Score
        addSectionHeader('Overall Match Score');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const score = data.data.rank;
        doc.text(`${score}% Match with the job requirements`, margin, yPos);
        yPos += lineHeight * 2;

        // Experience
        addSectionHeader('Experience Level');
        const years = data.data.total_experience || 0;
        let experienceText = '';
        if (!years) {
            experienceText = 'Fresher (Looking for first job)';
        } else if (years < 3) {
            experienceText = `Fresher (${years} ${years === 1 ? 'year' : 'years'} of experience)`;
        } else {
            experienceText = `Experienced Professional (${years} years of experience)`;
        }
        doc.text(experienceText, margin, yPos);
        yPos += lineHeight * 2;

        // Skills
        if (data.data.skills && data.data.skills.length > 0) {
            addSectionHeader('Your Skills');
            const skills = data.data.skills;
            let skillsText = '';
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            
            skills.forEach((skill, index) => {
                const separator = index === 0 ? '' : ' • ';
                const newText = separator + skill;
                
                if (doc.getTextWidth(skillsText + newText) > contentWidth - 5) {
                    doc.text(skillsText, margin, yPos);
                    yPos += lineHeight;
                    skillsText = skill;
                } else {
                    skillsText += newText;
                }
            });
            
            if (skillsText) {
                doc.text(skillsText, margin, yPos);
                yPos += lineHeight * 2;
            }
        }

        // Missing Skills
        if (data.data.missing_skills && data.data.missing_skills.length > 0) {
            addSectionHeader('Recommended Skills to Learn');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            
            data.data.missing_skills.forEach(skill => {
                doc.text(`•  ${skill}`, margin + 3, yPos);
                yPos += lineHeight;
            });
            yPos += lineHeight;
        }

        // Score Breakdown on new page
        if (data.data.score_breakdown) {
            doc.addPage();
            yPos = 25; // Reset Y position for new page
            
            // Add title with underline
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(63, 81, 181);
            doc.text('Detailed Score Breakdown', margin, yPos);
            
            // Draw underline
            const titleWidth = doc.getTextWidth('Detailed Score Breakdown');
            doc.line(margin, yPos + 1, margin + contentWidth, yPos + 1);
            
            yPos += lineHeight * 2;
            
            // Reset font for content
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            
            // Define categories in desired order
            const categories = [
                { key: 'skills', label: 'Skills' },
                { key: 'experience', label: 'Experience' },
                { key: 'projects', label: 'Projects' },
                { key: 'keywords', label: 'Keywords' }
            ];
            
            categories.forEach(({ key, label }) => {
                const value = data.data.score_breakdown[key] || 0;
                
                // Draw label
                doc.setTextColor(63, 81, 181);
                doc.text(`${label}:`, margin, yPos);
                
                // Draw percentage (right-aligned)
                const percentText = `${value}%`;
                const percentWidth = doc.getTextWidth(percentText);
                doc.text(percentText, margin + contentWidth - percentWidth, yPos);
                
                yPos += lineHeight;
                
                // Draw progress bar background (gray)
                doc.setFillColor(229, 231, 235);
                doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
                
                // Draw progress bar (blue)
                doc.setFillColor(63, 81, 181);
                const progressWidth = (contentWidth * value) / 100;
                doc.rect(margin, yPos - 4, progressWidth, 6, 'F');
                
                // Add space before next category
                yPos += lineHeight * 2;
            });
        }

        // Project Categories
        if (data.data.project_category && data.data.project_category.length > 0) {
            addSectionHeader('Project Categories');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const categories = data.data.project_category.join(' • ');
            const splitCategories = doc.splitTextToSize(categories, contentWidth - 10);
            doc.text(splitCategories, margin, yPos);
            yPos += (splitCategories.length * lineHeight) + lineHeight;
        }

        // Project Details
        if (data.data.project_description && Object.keys(data.data.project_description).length > 0) {
            addSectionHeader('Project Details');
            Object.entries(data.data.project_description).forEach(([project, description]) => {
                if (yPos > doc.internal.pageSize.height - 40) {
                    doc.addPage();
                    yPos = 25;
                }
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(project, margin, yPos);
                yPos += lineHeight;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const splitDesc = doc.splitTextToSize(description, contentWidth - 10);
                doc.text(splitDesc, margin + 5, yPos);
                yPos += (splitDesc.length * lineHeight) + lineHeight;
            });
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text('Generated by Resume Analyzer', 105, pageHeight - 15, { align: 'center' });
        doc.text(new Date().toLocaleDateString(), 105, pageHeight - 10, { align: 'center' });

        // Save the PDF
        const filename = `${selectedJobTitle.toLowerCase().replace(/\s+/g, '-')}_analyze.pdf`;
        doc.save(filename);
    }

    // Download button click handler
    downloadBtn?.addEventListener('click', function() {
        if (!this.disabled && window.lastAnalysisData) {
            generatePDF(window.lastAnalysisData);
        }
    });
}); 