"""
AI Notes service.
Handles AI content generation using Gemini and image enrichment from Unsplash.
"""

import os
import json
import hashlib
import re
import httpx
from typing import List, Optional

from app.ai_notes.schemas import (
    GenerateRequest, GenerateResponse, Section, 
    MermaidDiagram, ThreeDSuggestion, ImageResult
)


# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Unsplash API configuration
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

# System prompt for the AI agent
SYSTEM_PROMPT = """You are an academic content expansion agent.

You receive raw lesson notes written by a faculty member.
You must transform them into immersive structured learning material.

STRICT RULES:
- Return only valid JSON.
- Do NOT include explanations outside JSON.
- No HTML.
- All text must be Markdown compatible.
- Use academic tone.
- Do not hallucinate syllabus beyond given context.
- Generate mermaid diagrams for complex processes.
- Provide image search queries (short phrases only).
- Provide 3D visualization suggestions if conceptually useful.
"""

# User prompt template
USER_PROMPT_TEMPLATE = """Lesson Title: {lesson_title}

Raw Notes:
{raw_text}

Generate:

1. Overview section (2–3 paragraphs)
2. Detailed structured sections with headings
3. Key concepts bullet lists
4. At least 2 mermaid diagrams if applicable
5. 4–8 image search queries
6. Optional 3D visualization suggestions

Return JSON in this format:

{{
  "title": "",
  "overview": "",
  "sections": [
    {{
      "heading": "",
      "content": "",
      "key_points": []
    }}
  ],
  "mermaid_diagrams": [
    {{
      "title": "",
      "code": ""
    }}
  ],
  "image_queries": [],
  "three_d_suggestions": [
    {{
      "type": "",
      "description": ""
    }}
  ]
}}
"""


def build_prompt(lesson_title: str, raw_text: str) -> str:
    """Build the full prompt for the AI agent."""
    return f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(lesson_title=lesson_title, raw_text=raw_text)}"


def extract_json_from_response(response_text: str) -> dict:
    """Extract and parse JSON from the AI response."""
    # Try to find JSON in the response
    # The response might contain markdown code blocks
    import re
    
    # Remove markdown code blocks if present
    cleaned = re.sub(r'```json\s*', '', response_text)
    cleaned = re.sub(r'```\s*$', '', cleaned)
    cleaned = cleaned.strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    
    # Return fallback structure if parsing fails
    return {
        "title": "Content Generation",
        "overview": "Unable to generate structured content. Please try again.",
        "sections": [],
        "mermaid_diagrams": [],
        "image_queries": [],
        "three_d_suggestions": []
    }


async def call_gemini(prompt: str) -> dict:
    """Call Gemini API to generate content."""
    if not GEMINI_API_KEY:
        # Return demo content if no API key
        return get_demo_content()
    
    headers = {
        "Content-Type": "application/json"
    }
    
    params = {
        "key": GEMINI_API_KEY
    }
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 8192,
            "topP": 0.95,
            "topK": 40
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                GEMINI_API_URL,
                headers=headers,
                params=params,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if len(parts) > 0 and "text" in parts[0]:
                        return extract_json_from_response(parts[0]["text"])
            
            return get_demo_content()
            
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return get_demo_content()


async def fetch_unsplash_images(queries: List[str], max_per_query: int = 2) -> List[ImageResult]:
    """Fetch images from Unsplash API based on queries."""
    if not UNSPLASH_ACCESS_KEY or not queries:
        return get_demo_images()
    
    images = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
        }
        
        for query in queries[:4]:  # Limit to 4 queries
            try:
                response = await client.get(
                    UNSPLASH_API_URL,
                    headers=headers,
                    params={
                        "query": query,
                        "per_page": max_per_query,
                        "orientation": "landscape"
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                if "results" in result:
                    for photo in result["results"][:max_per_query]:
                        images.append(ImageResult(
                            url=photo["urls"]["regular"],
                            alt=photo.get("alt_description", query),
                            photographer=photo["user"]["name"],
                            photographer_url=photo["user"]["links"]["html"]
                        ))
                        
            except Exception as e:
                print(f"Error fetching from Unsplash for query '{query}': {e}")
                continue
    
    return images if images else get_demo_images()


def get_demo_content() -> dict:
    """Return demo content when API is not available."""
    return {
        "title": "Demo: Introduction to Photosynthesis",
        "overview": "Photosynthesis is the biological process by which plants, algae, and certain bacteria convert light energy into chemical energy. This process is fundamental to life on Earth as it produces oxygen and organic compounds that sustain most ecosystems.",
        "sections": [
            {
                "heading": "What is Photosynthesis?",
                "content": "Photosynthesis is the process used by plants to convert light energy into chemical energy that can be used to fuel the plant's activities. This process occurs primarily in the leaves, where specialized organelles called chloroplasts contain the pigment chlorophyll.",
                "key_points": [
                    "Occurs in chloroplasts",
                    "Requires chlorophyll pigment",
                    "Converts CO2 and H2O into glucose and O2"
                ]
            },
            {
                "heading": "The Light-Dependent Reactions",
                "content": "The light-dependent reactions take place in the thylakoid membranes of the chloroplasts. These reactions capture light energy and convert it into chemical energy in the form of ATP and NADPH.",
                "key_points": [
                    "Require light energy",
                    "Occur in thylakoid membranes",
                    "Produce ATP and NADPH"
                ]
            },
            {
                "heading": "The Calvin Cycle",
                "content": "The Calvin cycle (also known as the light-independent reactions) takes place in the stroma of the chloroplast. It uses the ATP and NADPH produced in the light-dependent reactions to fix carbon dioxide into organic molecules.",
                "key_points": [
                    "Does not require light",
                    "Occurs in stroma",
                    "Produces glucose"
                ]
            }
        ],
        "mermaid_diagrams": [
            {
                "title": "Photosynthesis Overview",
                "code": "graph TD\n    A[Light Energy] --> B[Chloroplast]\n    B --> C[Light-Dependent Reactions]\n    B --> D[Calvin Cycle]\n    C --> E[ATP + NADPH]\n    D --> E\n    E --> F[Glucose + O2]"
            },
            {
                "title": "Light Reactions",
                "code": "flowchart LR\n    A[Light] --> B[Photosystem II]\n    B --> C[Electron Transport]\n    C --> D[Photosystem I]\n    D --> E[NADPH]\n    B --> F[ATP Synthase]\n    F --> G[ATP]"
            }
        ],
        "image_queries": [
            "photosynthesis process",
            "chloroplast structure",
            "plant leaves",
            "light energy"
        ],
        "three_d_suggestions": [
            {
                "type": "molecule",
                "description": "3D model of chlorophyll molecule"
            }
        ]
    }


def get_demo_images() -> List[ImageResult]:
    """Return demo images when API is not available."""
    return [
        ImageResult(
            url="https://images.unsplash.com/photo-1518112390430-f4ab02e9c2c8?w=800",
            alt="Green plant leaves",
            photographer="Johannes Plenio",
            photographer_url="https://unsplash.com/@plenio"
        ),
        ImageResult(
            url="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
            alt="Forest sunlight",
            photographer="Lukasz Szmigiel",
            photographer_url="https://unsplash.com/@szmigieldesign"
        )
    ]


def compute_content_hash(raw_text: str) -> str:
    """Compute SHA256 hash of raw text for caching."""
    return hashlib.sha256(raw_text.encode()).hexdigest()


async def generate_notes(data: GenerateRequest) -> GenerateResponse:
    """
    Generate immersive notes from raw text.
    
    This is the main entry point for the AI Notes generation service.
    """
    # Build the prompt
    prompt = build_prompt(data.lesson_title, data.raw_text)
    
    # Call Gemini to generate content
    structured = await call_gemini(prompt)
    
    # Extract image queries from the response
    image_queries = structured.get("image_queries", [])
    
    # Fetch images from Unsplash (or use demo images)
    images = await fetch_unsplash_images(image_queries)
    
    # Build the response
    response = GenerateResponse(
        title=structured.get("title", data.lesson_title),
        overview=structured.get("overview", ""),
        sections=[Section(**section) for section in structured.get("sections", [])],
        mermaid_diagrams=[MermaidDiagram(**diagram) for diagram in structured.get("mermaid_diagrams", [])],
        image_queries=image_queries,
        three_d_suggestions=[ThreeDSuggestion(**suggestion) for suggestion in structured.get("three_d_suggestions", [])],
        images=images
    )
    
    return response
