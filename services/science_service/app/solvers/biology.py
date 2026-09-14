"""
File: services/science_service/app/solvers/biology.py
Description: Biology solver module in the Unified Science Service.
             Provides DNA transcription, translation, and AI biological step compilation.
"""

import re
import json
import os
import google.generativeai as genai
from app.prompts.controller import prompt_controller

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

TRANSCRIPTION_MAP = {"A": "U", "T": "A", "C": "G", "G": "C"}

CODON_MAP = {
    "AUG": "Methionine (Start)",
    "UUU": "Phenylalanine", "UUC": "Phenylalanine",
    "UUA": "Leucine", "UUG": "Leucine", "CUU": "Leucine", "CUC": "Leucine", "CUA": "Leucine", "CUG": "Leucine",
    "AUU": "Isoleucine", "AUC": "Isoleucine", "AUA": "Isoleucine",
    "GUU": "Valine", "GUC": "Valine", "GUA": "Valine", "GUG": "Valine",
    "UCU": "Serine", "UCC": "Serine", "UCA": "Serine", "UCG": "Serine", "AGU": "Serine", "AGC": "Serine",
    "CCU": "Proline", "CCC": "Proline", "CCA": "Proline", "CCG": "Proline",
    "ACU": "Threonine", "ACC": "Threonine", "ACA": "Threonine", "ACG": "Threonine",
    "GCU": "Alanine", "GCC": "Alanine", "GCA": "Alanine", "GCG": "Alanine",
    "UAU": "Tyrosine", "UAC": "Tyrosine",
    "CAU": "Histidine", "CAC": "Histidine",
    "CAA": "Glutamine", "CAG": "Glutamine",
    "AAU": "Asparagine", "AAC": "Asparagine",
    "AAA": "Lysine", "AAG": "Lysine",
    "GAU": "Aspartic Acid", "GAC": "Aspartic Acid",
    "GAA": "Glutamic Acid", "GAG": "Glutamic Acid",
    "UGU": "Cysteine", "UGC": "Cysteine",
    "UGG": "Tryptophan",
    "CGU": "Arginine", "CGC": "Arginine", "CGA": "Arginine", "CGG": "Arginine", "AGA": "Arginine", "AGG": "Arginine",
    "GGU": "Glycine", "GGC": "Glycine", "GGA": "Glycine", "GGG": "Glycine",
    "UAA": "STOP", "UAG": "STOP", "UGA": "STOP"
}

def solve_biology_ai(expression: str, grade_level: str) -> dict:
    if not GEMINI_API_KEY:
        return {"solution": None, "steps": [expression], "success": False, "error": "API key not set"}
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = prompt_controller.get_prompt("biology", expression, grade_level)
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            text = "\n".join(lines).strip()
        steps = json.loads(text)
        return {"solution": str(steps[-1]), "steps": steps, "success": True, "error": None}
    except Exception as e:
        return {"solution": None, "steps": [expression], "success": False, "error": str(e)}

def solve_biology(expression: str, context: dict = None) -> dict:
    context = context or {}
    grade_level = context.get("grade_level", "grade_4_6")
    query_lower = expression.lower()
    
    seq_match = re.search(r'\b([atcgur\- ]{3,})\b', query_lower)
    if seq_match and any(w in query_lower for w in ["transcribe", "translate", "dna", "rna", "codon", "sequence"]):
        try:
            raw_seq = seq_match.group(1).upper().replace(" ", "").replace("-", "")
            is_dna = "T" in raw_seq or not "U" in raw_seq
            steps = [f"Original sequence: '{seq_match.group(1)}'"]
            
            if is_dna:
                mrna_seq = "".join(TRANSCRIPTION_MAP.get(base, "N") for base in raw_seq)
                if "N" in mrna_seq:
                    raise ValueError("Sequence contains invalid base characters.")
                steps.append(f"Transcribe DNA sequence to mRNA: '{mrna_seq}'")
            else:
                mrna_seq = raw_seq
                steps.append(f"Identify mRNA sequence: '{mrna_seq}'")
                
            codons = [mrna_seq[i:i+3] for i in range(0, len(mrna_seq), 3) if len(mrna_seq[i:i+3]) == 3]
            steps.append(f"Split mRNA into codons: {', '.join(codons)}")
            
            amino_acids = []
            for codon in codons:
                aa = CODON_MAP.get(codon, "Unknown")
                amino_acids.append(aa)
                steps.append(f"Codon '{codon}' -> '{aa}'")
                if aa == "STOP":
                    break
                    
            solution = " - ".join(amino_acids)
            steps.append(f"Final amino acid chain: '{solution}'")
            return {"solution": solution, "steps": steps, "success": True, "error": None}
        except Exception:
            pass

    return solve_biology_ai(expression, grade_level)
