"""
File: services/science_service/app/solvers/chemistry.py
Description: Chemistry solver module in the Unified Science Service.
             Provides chemical equation balancing, molar mass calculation, and AI fallback.
"""

import re
import json
import os
from sympy import Matrix, lcm, Rational
import google.generativeai as genai
from app.prompts.controller import prompt_controller

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Atomic weights of elements (g/mol)
ATOMIC_WEIGHTS = {
    "H": 1.008, "He": 4.0026, "Li": 6.94, "Be": 9.0122, "B": 10.81, "C": 12.011, "N": 14.007,
    "O": 15.999, "F": 18.998, "Ne": 20.180, "Na": 22.990, "Mg": 24.305, "Al": 26.982, "Si": 28.085,
    "P": 30.974, "S": 32.06, "Cl": 35.45, "Ar": 39.948, "K": 39.098, "Ca": 40.078, "Sc": 44.956,
    "Ti": 47.867, "V": 50.942, "Cr": 51.996, "Mn": 54.938, "Fe": 55.845, "Co": 58.933, "Ni": 58.693,
    "Cu": 63.546, "Zn": 65.38, "Ga": 69.723, "Ge": 72.630, "As": 74.922, "Se": 78.971, "Br": 79.904,
    "Kr": 83.798, "Rb": 85.468, "Sr": 87.62, "Y": 88.906, "Zr": 91.224, "Nb": 92.906, "Mo": 95.95,
    "Tc": 98.0, "Ru": 101.07, "Rh": 102.91, "Pd": 106.42, "Ag": 107.87, "Cd": 112.41, "In": 114.82,
    "Sn": 118.71, "Sb": 121.76, "Te": 127.60, "I": 126.90, "Xe": 131.29, "Cs": 132.91, "Ba": 137.33,
    "La": 138.91, "Ce": 140.12, "Pr": 140.91, "Nd": 144.24, "Pm": 145.0, "Sm": 150.36, "Eu": 151.96,
    "Gd": 157.25, "Tb": 158.93, "Dy": 162.50, "Ho": 164.93, "Er": 167.26, "Tm": 168.93, "Yb": 173.05,
    "Lu": 174.97, "Hf": 178.49, "Ta": 180.95, "W": 183.84, "Re": 186.21, "Os": 190.23, "Ir": 192.22,
    "Pt": 195.08, "Au": 196.97, "Hg": 200.59, "Tl": 204.38, "Pb": 207.2, "Bi": 208.98, "Po": 209.0,
    "At": 210.0, "Rn": 222.0, "Fr": 223.0, "Ra": 226.0, "Ac": 227.0, "Th": 232.04, "Pa": 231.04,
    "U": 238.03
}

def expand_parentheses(formula: str) -> str:
    pattern = re.compile(r'\(([^)]+)\)(\d+)')
    while True:
        match = pattern.search(formula)
        if not match:
            break
        sub_formula = match.group(1)
        multiplier = int(match.group(2))
        sub_elements = parse_simple_compound(sub_formula)
        expanded_sub = "".join(f"{elem}{count * multiplier}" for elem, count in sub_elements.items())
        formula = formula[:match.start()] + expanded_sub + formula[match.end():]
    return formula

def parse_simple_compound(formula: str) -> dict:
    pattern = re.compile(r'([A-Z][a-z]*)(\d*)')
    elements = {}
    for elem, count in pattern.findall(formula):
        c = int(count) if count else 1
        elements[elem] = elements.get(elem, 0) + c
    return elements

def parse_compound(formula: str) -> dict:
    expanded = expand_parentheses(formula)
    return parse_simple_compound(expanded)

def balance_reaction(equation_str: str) -> dict:
    steps = [f"Original equation: '{equation_str}'"]
    norm_eq = equation_str.replace('=', '->')
    if '->' not in norm_eq:
        return {"solution": None, "steps": steps, "success": False, "error": "Invalid equation format. Must contain '->' or '='."}
        
    reactants_part, products_part = norm_eq.split('->')
    reactants = [r.strip() for r in reactants_part.split('+') if r.strip()]
    products = [p.strip() for p in products_part.split('+') if p.strip()]
    
    if not reactants or not products:
        return {"solution": None, "steps": steps, "success": False, "error": "Equation must have at least one reactant and product."}

    reactant_compositions = [parse_compound(r) for r in reactants]
    product_compositions = [parse_compound(p) for p in products]
    
    all_elements = set()
    for comp in reactant_compositions + product_compositions:
        all_elements.update(comp.keys())
    unique_elements = sorted(list(all_elements))
    
    num_vars = len(reactants) + len(products)
    matrix_data = []
    for element in unique_elements:
        row = []
        for comp in reactant_compositions:
            row.append(comp.get(element, 0))
        for comp in product_compositions:
            row.append(-comp.get(element, 0))
        matrix_data.append(row)
        
    try:
        sym_matrix = Matrix(matrix_data)
        null_space = sym_matrix.nullspace()
        if not null_space:
            return {"solution": None, "steps": steps, "success": False, "error": "No solution exists for this equation."}
            
        basis = null_space[0]
        rationals = [Rational(val) for val in basis]
        scale_factor = lcm([r.q for r in rationals])
        coefficients = [int(r * scale_factor) for r in rationals]
        if any(c < 0 for c in coefficients):
            coefficients = [-c for c in coefficients]
            
        r_coeffs = coefficients[:len(reactants)]
        p_coeffs = coefficients[len(reactants):]
        
        def format_compound(coeff, compound):
            return f"{coeff} {compound}" if coeff > 1 else compound
            
        balanced_r = " + ".join(format_compound(c, comp) for c, comp in zip(r_coeffs, reactants))
        balanced_p = " + ".join(format_compound(c, comp) for c, comp in zip(p_coeffs, products))
        balanced_eq = f"{balanced_r} -> {balanced_p}"
        
        steps.append(f"Balanced chemical equation: '{balanced_eq}'")
        return {"solution": balanced_eq, "steps": steps, "success": True, "error": None}
    except Exception as e:
        return {"solution": None, "steps": steps, "success": False, "error": f"Failed to balance: {str(e)}"}

def calculate_molar_mass(formula_str: str) -> dict:
    clean_formula = re.sub(r'\b(molar\s+mass\s+of|molecular\s+weight\s+of|weight|mass)\b', '', formula_str, flags=re.IGNORECASE).strip()
    steps = [f"Formula: '{clean_formula}'"]
    try:
        composition = parse_compound(clean_formula)
        total_mass = 0.0
        for element, count in composition.items():
            if element not in ATOMIC_WEIGHTS:
                return {"solution": None, "steps": steps, "success": False, "error": f"Unknown element '{element}'"}
            weight = ATOMIC_WEIGHTS[element]
            element_mass = count * weight
            total_mass += element_mass
            steps.append(f"{element}: {count} atoms * {weight} g/mol = {element_mass:.3f} g/mol")
        solution_str = f"{round(total_mass, 3)} g/mol"
        steps.append(f"Total molar mass: {solution_str}")
        return {"solution": solution_str, "steps": steps, "success": True, "error": None}
    except Exception as e:
        return {"solution": None, "steps": steps, "success": False, "error": str(e)}

def solve_chemistry_ai(expression: str, grade_level: str) -> dict:
    if not GEMINI_API_KEY:
        return {"solution": None, "steps": [expression], "success": False, "error": "API key not set"}
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = prompt_controller.get_prompt("chemistry", expression, grade_level)
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

def solve_chemistry(expression: str, context: dict = None) -> dict:
    context = context or {}
    grade_level = context.get("grade_level", "grade_4_6")
    query_str = expression.strip()
    
    # Check for balancing
    if any(k in query_str.lower() for k in ["balance", "reaction", "equation"]) or "->" in query_str or "=" in query_str:
        res = balance_reaction(query_str)
        if res.get("success"):
            return res
            
    # Check for molar mass or direct formula
    if any(k in query_str.lower() for k in ["molar mass", "molecular weight", "weight of"]):
        res = calculate_molar_mass(query_str)
        if res.get("success"):
            return res
            
    # Try calculating molar mass directly for simple chemical formulas (e.g. 'H2O', 'NaCl')
    if query_str and all(c.isalnum() or c in "()" for c in query_str):
        res = calculate_molar_mass(query_str)
        if res.get("success"):
            return res

    # Fallback to AI
    return solve_chemistry_ai(expression, grade_level)
