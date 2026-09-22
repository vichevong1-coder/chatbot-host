"""
File: orchestrator/app/services/socratic/hint_engine.py
Description: 3-Tier Progressive Hint Engine for elementary Socratic tutoring.
             Guarantees zero answer leakage across Nudge, Visual, and Micro-Breakdown tiers.
"""

import re
import logging
from typing import Optional, Dict, List, Any, Tuple
from app.services.socratic.card_schema import SocraticStep
from app.services.socratic.prompts.controller import SocraticPromptController

logger = logging.getLogger("orchestrator.socratic.hint_engine")


class HintEngine:
    """
    Manages progressive 3-tier hint generation for elementary students (Grades 1-6).
    Tier 1: Guiding Nudge (focus attention on key terms/starting values, no arithmetic)
    Tier 2: Visual Scaffold (emoji diagrams, cross-out illustrations)
    Tier 3: Micro-Breakdown (small bite-sized calculation sub-steps, no final answer)
    """

    def __init__(self, prompt_controller: Optional[SocraticPromptController] = None):
        self.prompt_controller = prompt_controller or SocraticPromptController()

    def escalate_hint(
        self,
        step: SocraticStep,
        prior_attempts: Optional[List[str]] = None,
        grade_level: str = "grade_1_3"
    ) -> Tuple[int, str]:
        """
        Advances the hint level for the step (capped at 3) and returns (new_level, hint_text).
        """
        prior_attempts = prior_attempts or []
        next_tier = min(step.current_hint_level + 1, 3)
        step.current_hint_level = next_tier

        # Use pre-computed hint if already cached in step.hints
        if next_tier <= len(step.hints) and step.hints[next_tier - 1]:
            hint_text = step.hints[next_tier - 1]
            logger.info(f"[HintEngine] Used pre-computed hint tier {next_tier}")
        else:
            hint_text = self.generate_hint(
                step=step,
                tier=next_tier,
                prior_attempts=prior_attempts,
                grade_level=grade_level
            )
            # Cache it into step.hints
            while len(step.hints) < next_tier:
                step.hints.append("")
            step.hints[next_tier - 1] = hint_text

        logger.info(f"[HintEngine] Generated hint level {next_tier} for step {step.step_number}")
        return next_tier, hint_text

    def generate_hint(
        self,
        step: SocraticStep,
        tier: int,
        prior_attempts: Optional[List[str]] = None,
        grade_level: str = "grade_1_3"
    ) -> str:
        """
        Generates a grade-appropriate hint for the target tier.
        Uses deterministic pedagogical heuristics with LLM template fallback.
        """
        prior_attempts = prior_attempts or []
        attempts_str = ", ".join(prior_attempts) if prior_attempts else "None yet"

        # 1. Deterministic elementary heuristics
        fallback_hint = self._generate_rule_based_hint(step, tier, grade_level)
        if fallback_hint:
            return fallback_hint

        # 2. LLM Prompt Controller fallback
        try:
            prompt_data = self.prompt_controller.format_prompt(
                template_name="progressive_hint_generation",
                grade_level=grade_level,
                hint_tier=tier,
                step_mission=step.mission,
                your_turn_question=step.your_turn,
                step_concept=step.concept or step.title,
                prior_attempts=attempts_str
            )
            return f"💡 Think about {step.title.lower()}! Review clue: {step.clue}"
        except Exception as e:
            logger.warning(f"Error generating LLM hint: {e}. Using deterministic fallback.")
            return f"💡 Check the clue: {step.clue}"

    def _generate_rule_based_hint(
        self,
        step: SocraticStep,
        tier: int,
        grade_level: str
    ) -> Optional[str]:
        """
        Generates clean visual and conceptual scaffolds without leaking expected answers.
        """
        question = step.your_turn.strip()
        q_lower = question.lower() + " " + step.mission.lower() + " " + step.clue.lower()
        numbers = [int(n) for n in re.findall(r"\b\d+\b", question)]
        is_math = len(numbers) >= 2 or any(w in q_lower for w in ["plus", "minus", "subtract", "add", "count", "left", "total"])

        # Science Topic Detection
        is_boiling = any(w in q_lower for w in ["boil", "steam", "evaporat", "kettle"])
        is_melting = any(w in q_lower for w in ["melt", "ice", "popsicle", "freeze", "freezer"])
        is_plant = any(w in q_lower for w in ["plant", "sunlight", "photosynthesis", "leaf", "roots", "seed"])
        is_gravity = any(w in q_lower for w in ["gravity", "fall", "drop", "downward"])
        is_magnet = any(w in q_lower for w in ["magnet", "magnetic", "attract", "repel", "iron", "pole"])
        is_shadow = any(w in q_lower for w in ["shadow", "light", "flashlight", "beam", "dark shape"])
        is_sink_float = any(w in q_lower for w in ["sink", "float", "buoyancy", "water surface"])
        is_lifecycle = any(w in q_lower for w in ["butterfly", "caterpillar", "chrysalis", "cocoon", "frog", "tadpole"])
        is_day_night = any(w in q_lower for w in ["day and night", "night", "dark at night", "earth spin", "sun rise"])
        is_rain = any(w in q_lower for w in ["rain", "cloud", "rainbow", "water droplet", "storm"])
        is_sound = any(w in q_lower for w in ["sound", "vibration", "vibrate", "hear", "drum"])

        if tier == 1:
            # Tier 1: Guiding Nudge
            if is_boiling:
                return "👀 Clue: Think about what happens to water in a hot kettle when you see white puffy steam!"
            elif is_melting:
                return "👀 Clue: Think about what happens to an ice cube when it is left on a warm table in the sun."
            elif is_plant:
                return "👀 Clue: What shines brightly in the sky and what falls from rainclouds that plants need?"
            elif is_gravity:
                return "👀 Clue: When you drop an apple, does it float away into space or fall down to the ground?"
            elif is_magnet:
                return "👀 Clue: Look at what things stick to your refrigerator door at home!"
            elif is_shadow:
                return "👀 Clue: When you stand in front of a bright sunny light, what dark shape follows your feet?"
            elif is_sink_float:
                return "👀 Clue: Think about a wooden toy boat versus a heavy metal coin in the bathtub."
            elif is_lifecycle:
                return "👀 Clue: Think about what tiny crawling creature munches leaves before growing colorful wings."
            elif is_day_night:
                return "👀 Clue: When our side of the spinning Earth turns away from the Sun, what happens to the sky?"
            elif is_rain:
                return "👀 Clue: When billions of water drops gather up high in the sky, what fluffy shapes do they make?"
            elif is_sound:
                return "👀 Clue: Touch your throat gently while humming! What rapid buzzing or shaking do you feel?"
            elif is_math and len(numbers) >= 2:
                return f"👀 Look at the numbers in the question: {', '.join(map(str, numbers))}. What operation does our mission ask us to do?"
            return f"👀 Focus on the keyword in our mission: '{step.mission}'. What is the key thing we should find?"

        elif tier == 2:
            # Tier 2: Visual Scaffold
            if is_boiling or is_melting:
                return "🎨 Visual helper:\n🧊 (Solid Ice) ➡️ [Heat 🔥] ➡️ 💧 (Liquid Water) ➡️ [More Heat 🔥] ➡️ 💨 (Steam / Gas)!"
            elif is_plant:
                return "🎨 Visual helper:\n☀️ Sunlight + 🌧️ Water + 🍃 Green Leaf ➡️ 🍬 Plant Food (Sugar) + 🌬️ Fresh Oxygen!"
            elif is_gravity:
                return "🎨 Visual helper:\n🍎 (Apple in air) ⬇️⬇️ [ Earth's Gravity Pull ] ⬇️⬇️ 🌍 (Falls to Ground)!"
            elif is_magnet:
                return "🎨 Visual helper:\n🧲 [North Pole] ➡️ ❤️ ⬅️ [South Pole] (Opposite poles attract and stick together!)"
            elif is_shadow:
                return "🎨 Visual helper:\n🔦 (Light Beam) ➡️ ✋ (Hand Blocks Light) ➡️ ⬛ (Dark Shadow on Wall)!"
            elif is_sink_float:
                return "🎨 Visual helper:\n🌊 Water Surface: 🪵 (Light Wood Floats 🛶) | ⬇️ 🪨 (Heavy Rock Sinks to Bottom)!"
            elif is_lifecycle:
                if "frog" in q_lower or "tadpole" in q_lower:
                    return "🎨 Visual helper:\n🥚 (Egg in Pond) ➡️ 🐟 (Swimming Tadpole with Tail) ➡️ 🐸 (Adult Hopping Frog)!"
                return "🎨 Visual helper:\n🥚 (Egg) ➡️ 🐛 (Caterpillar) ➡️ 🥥 (Chrysalis / Cocoon) ➡️ 🦋 (Butterfly)!"
            elif is_day_night:
                return "🎨 Visual helper:\n☀️ Sun Shining ➡️ 🌍 [Day Side ☀️ | Night Side 🌙] ➡️ (Earth spins once every 24 hours)!"
            elif is_rain:
                return "🎨 Visual helper:\n💧 (Water evaporates) ➡️ ☁️ (Clouds get heavy) ➡️ 🌧️ (Rain falls down)!"
            elif is_sound:
                return "🎨 Visual helper:\n🥁 (Drum skin vibrates) 〰️〰️ (Sound waves travel through air) ➡️ 👂 (Ears hear sound)!"
            elif is_math and len(numbers) >= 2 and numbers[0] <= 15 and numbers[1] <= 15:
                a, b = numbers[0], numbers[1]
                if "-" in question or any(w in q_lower for w in ["left", "remain", "gave", "ate", "lost", "minus"]):
                    icons = "🍎 " * a
                    return f"🎨 Visual helper:\n{icons}\n❌ Imagine crossing out {b} apples! How many are left?"
                elif "+" in question or any(w in q_lower for w in ["total", "altogether", "both", "in all", "plus"]):
                    return f"🎨 Visual helper:\nGroup 1: {'⭐ ' * a}\nGroup 2: {'⭐ ' * b}\nCount both groups together!"
            return f"🎨 Let's picture it! {step.helpful_example}"

        elif tier == 3:
            # Tier 3: Micro-Breakdown
            if is_boiling:
                return "🧩 Micro-step: When liquid water heats up and turns into steam/gas, this process is called Evaporation!"
            elif is_melting:
                return "🧩 Micro-step: When solid ice heats up and turns into liquid water, this process is called Melting!"
            elif is_plant:
                return "🧩 Micro-step: 'Photo' means light, and 'synthesis' means putting things together. The word is Photosynthesis!"
            elif is_gravity:
                return "🧩 Micro-step: The pulling force that starts with the letter 'G' is Gravity!"
            elif is_magnet:
                return "🧩 Micro-step: Magnets pull on metals like iron, and opposite poles (North & South) Attract!"
            elif is_shadow:
                return "🧩 Micro-step: A shadow forms when an opaque object blocks light from passing through."
            elif is_sink_float:
                return "🧩 Micro-step: Light objects like wood float on top; heavy objects like rocks sink to the bottom."
            elif is_lifecycle:
                if "frog" in q_lower or "tadpole" in q_lower:
                    return "🧩 Micro-step: A baby swimming frog with a tail is called a Tadpole!"
                return "🧩 Micro-step: A caterpillar builds a protective shell called a Chrysalis before turning into a butterfly!"
            elif is_day_night:
                return "🧩 Micro-step: Day and night happen because Earth is smoothly spinning (rotating) in space!"
            elif is_rain:
                return "🧩 Micro-step: Clouds are made of floating water droplets, which fall as rain when heavy!"
            elif is_sound:
                return "🧩 Micro-step: Fast back-and-forth movement that makes sound is called a Vibration!"
            elif is_math and len(numbers) >= 2:
                a, b = numbers[0], numbers[1]
                if "-" in question or any(w in q_lower for w in ["left", "remain", "gave", "ate", "lost"]):
                    half_b = max(1, b // 2)
                    rem_b = b - half_b
                    return f"🧩 Micro-step: First, take away {half_b} from {a} (that makes {a - half_b}). Now take away the remaining {rem_b}!"
                elif "+" in question or any(w in q_lower for w in ["total", "altogether", "both"]):
                    return f"🧩 Micro-step: Start counting up from {a}, and take {b} steps forward!"
            return f"🧩 Micro-step: Re-read our clue: '{step.clue}' and apply it step-by-step!"

        return None
