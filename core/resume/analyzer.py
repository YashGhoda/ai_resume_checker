import json

import pdfplumber
import spacy
from groq import Groq

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"

    return text.strip()

API_KEY = "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"

def analyze_resume_with_llm(resume_text:str,job_description:str) ->dict:
    prompt = f"""
        Analyze this resume for a software engineering position. Focus on these key aspects:

        1. Find the Skills/Technical Skills section and extract ONLY the skills listed there.
        2. Calculate total years of experience from the work history.
        3. Identify and categorize all projects mentioned.
        4. Compare skills against job requirements.
        5. Calculate match percentage.

        Resume Text:
        {resume_text}

        Job Description:
        {job_description}

        Provide a JSON response with these exact fields:
        {{
            "rank": <number 0-100>,
            "skills": [<skills from skills section>],
            "total_experience": <number>,
            "project_category": [<project categories>],
            "missing_skills": [<required skills not in resume>],
            "score_breakdown": {{
                "skills": <number 0-100>,
                "experience": <number 0-100>,
                "projects": <number 0-100>,
                "keywords": <number 0-100>
            }},
            "project_description": {{
                <project name>: <brief description>
            }}
        }}

        Rules:
        - Only extract skills from the dedicated skills section
        - Use numbers for all scores (not strings)
        - Keep project descriptions brief
        - Include all fields in response
    """

    try:
        client = Groq(api_key=API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                'role': 'user', 
                'content': prompt
            }],
            temperature=0.5,  # Reduced for more consistent output
            response_format={'type': "json_object"}
        )

        # Parse and validate response
        result = json.loads(response.choices[0].message.content)
        
        # Ensure all required fields exist
        required_fields = ['rank', 'skills', 'total_experience', 'project_category', 
                         'missing_skills', 'score_breakdown', 'project_description']
        
        for field in required_fields:
            if field not in result:
                result[field] = [] if field in ['skills', 'project_category', 'missing_skills'] else {}
                
        # Ensure score_breakdown has all required fields
        score_fields = ['skills', 'experience', 'projects', 'keywords']
        if 'score_breakdown' in result:
            for field in score_fields:
                if field not in result['score_breakdown']:
                    result['score_breakdown'][field] = 0

        return result

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        return {
            "rank": 0,
            "skills": [],
            "total_experience": 0,
            "project_category": [],
            "missing_skills": [],
            "score_breakdown": {
                "skills": 0,
                "experience": 0,
                "projects": 0,
                "keywords": 0
            },
            "project_description": {}
        }
    except Exception as e:
        print(f"Error in analyze_resume_with_llm: {e}")
        raise

def process_resume(pdf_path, job_description):
    try:
        resume_text = extract_text_from_pdf(pdf_path)
        if not resume_text.strip():
            return {
                'status': False,
                'message': "Could not extract text from PDF"
            }

        data = analyze_resume_with_llm(resume_text, job_description)
        return {
            'status': True,
            'data': data
        }
    except Exception as e:
        print(f"Error processing resume: {e}")
        return {
            'status': False,
            'message': str(e)
        }

